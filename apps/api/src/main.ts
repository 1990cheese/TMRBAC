/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

async function bootstrap() {
  // Add import for In operator
  const { In } = await import('typeorm');
  const app = await NestFactory.create(AppModule);

  // --- Organization and superuser seeding logic ---
  const connection = app.get(DataSource);
  const orgRepo = connection.getRepository(
    (await import('../../libs/data/organization.entity')).Organization
  );
  const userRepo = connection.getRepository(
    (await import('../../libs/data/user.entity')).User
  );
  const rolesModule = await import('../../libs/data/roles.entity');
  const roleRepo = connection.getRepository(rolesModule.Role);
  const RoleName = rolesModule.RoleName;
  const permissionsModule = await import('../../libs/data/permissions.entity');
  const permissionRepo = connection.getRepository(permissionsModule.Permission);
  const PermissionName = permissionsModule.PermissionName;
  const bcrypt = await import('bcryptjs');
  const env = process.env;

  // Seed organizations
  let parentOrg = await orgRepo.findOne({ where: { name: 'parent' } });
  if (!parentOrg) {
    parentOrg = orgRepo.create({ name: 'parent', description: 'Parent organization', level: 1 });
    parentOrg = await orgRepo.save(parentOrg);
    Logger.log('Seeded parent organization');
  }
  let childOrg = await orgRepo.findOne({ where: { name: 'child' } });
  if (!childOrg) {
    childOrg = orgRepo.create({
      name: 'child',
      description: 'Child organization',
      level: 2,
      parentId: parentOrg.id
    });
    childOrg = await orgRepo.save(childOrg);
    Logger.log('Seeded child organization');
  }

  // Seed organization permissions
  const orgPermissions = [
    PermissionName.CREATE_ORGANIZATION,
    PermissionName.READ_ORGANIZATION,
    PermissionName.UPDATE_ORGANIZATION,
    PermissionName.DELETE_ORGANIZATION,
  ];
  const orgPermissionEntities = [];
  for (const permName of orgPermissions) {
    let perm = await permissionRepo.findOne({ where: { name: permName } });
    if (!perm) {
      perm = permissionRepo.create({ name: permName, description: `Organization permission: ${permName}` });
      perm = await permissionRepo.save(perm);
    }
    orgPermissionEntities.push(perm);
  }

  // Seed superuser
  const superEmail = env.SUPERUSEREMAIL;
  const superUsername = env.SUPERUSERNAME;
  const superPassword = env.SUPERUSERPASS;
  if (superEmail && superUsername && superPassword) {
    let superUser = await userRepo.findOne({ where: { email: superEmail }, relations: ['roles'] });
    let superRole = await roleRepo.findOne({ where: { name: RoleName.OWNER }, relations: ['permissions'] });
    if (!superRole) {
      superRole = roleRepo.create({ name: RoleName.OWNER, description: 'Owner', permissions: orgPermissionEntities });
      superRole = await roleRepo.save(superRole);
    } else {
      // Ensure OWNER role has all org permissions
      const missingPerms = orgPermissionEntities.filter(
        perm => !superRole.permissions?.some(p => p.name === perm.name)
      );
      if (missingPerms.length > 0) {
        superRole.permissions = [...(superRole.permissions || []), ...missingPerms];
        superRole = await roleRepo.save(superRole);
      }
    }
    if (!superUser) {
      const hashedPassword = await bcrypt.hash(superPassword, 10);
      superUser = userRepo.create({
        email: superEmail,
        password: hashedPassword,
        firstName: superUsername,
        lastName: 'Superuser',
        organizationId: parentOrg.id,
        roles: [superRole],
      });
      superUser = await userRepo.save(superUser);
      Logger.log('Seeded superuser');
    } else {
      // Ensure superuser has OWNER role and its permissions
      const hasOwnerRole = superUser.roles?.some(r => r.name === RoleName.OWNER);
      if (!hasOwnerRole) {
        superUser.roles = [...(superUser.roles || []), superRole];
        superUser = await userRepo.save(superUser);
      }
    }
  }

  const adminRole = await roleRepo.findOne({ where: { name: RoleName.ADMIN } });
  const userRole = await roleRepo.findOne({ where: { name: RoleName.USER } });

  if (!adminRole) {
    const adminRole = roleRepo.create({ name: RoleName.ADMIN, description: 'Admin', permissions: [] });
    await roleRepo.save(adminRole);
    Logger.log('Seeded ADMIN role');
  }
  if (!userRole) {
    const userRole = roleRepo.create({ name: RoleName.USER, description: 'User', permissions: [] });
    await roleRepo.save(userRole);
    Logger.log('Seeded USER role');
  }
  console.log('adminRole', adminRole);
  console.log('userRole', userRole);

  // Helper: assign permissions to roles for all users
  const allUsers = await userRepo.find({ relations: ['roles'] });
  // Helper to get all descendant org IDs
  async function getOrgAndChildrenIds(orgId) {
    const orgs = await orgRepo.find();
    const ids = [orgId];
    const stack = [orgId];
    while (stack.length) {
      const current = stack.pop();
      for (const org of orgs) {
        if (org.parentId === current) {
          ids.push(org.id);
          stack.push(org.id);
        }
      }
    }
    return ids;
  }

   async function seedUser(email: string, firstName: string, lastName: string, orgId: string, role: any) {
    if (!role || !role.name) {
      console.log('role', role);
      throw new Error(`Role is missing or has no name for user ${email}`);
    }
    let user = await userRepo.findOne({ where: { email }, relations: ['roles'] });
    if (!user) {
      const hashedPassword = await bcrypt.hash('password123', 10);
      user = userRepo.create({
        email,
        password: hashedPassword,
        firstName,
        lastName,
        organizationId: orgId,
        roles: [role],
      });
      user = await userRepo.save(user);
      Logger.log(`Seeded user: ${email} (${role.name}) in org ${orgId}`);
    }
    return user;
  }

  // Seed ADMINs and USERs in parent and child orgs
  const parentAdmin = await seedUser('parentadmin@test.com', 'Parent', 'Admin', parentOrg.id, adminRole);
  const parentUser = await seedUser('parentuser@test.com', 'Parent', 'User', parentOrg.id, userRole);
  const childAdmin = await seedUser('childadmin@test.com', 'Child', 'Admin', childOrg.id, adminRole);
  const childUser = await seedUser('childuser@test.com', 'Child', 'User', childOrg.id, userRole);

  for (const user of allUsers) {
    let updated = false;
    for (const role of user.roles) {
      // OWNER gets all org permissions for their org and all child orgs
      if (role.name === RoleName.OWNER) {
        const orgIds = await getOrgAndChildrenIds(user.organizationId);
        // Find all users in these orgs
  const childUsers = await userRepo.find({ where: { organizationId: In(orgIds) } });
        // OWNER permissions: all org permissions + all user permissions for child orgs
        const allPerms = [...orgPermissionEntities];
        // Add user permissions for each child user (example: CRUD_USER, ASSIGN_ROLES, etc.)
        // You may need to fetch or define these permissions as needed
        // For demonstration, let's assume all user permissions are in permissionRepo
        const userPerms = await permissionRepo.find();
        for (const perm of userPerms) {
          if (!allPerms.some(p => p.name === perm.name)) {
            allPerms.push(perm);
          }
        }
        const missingPerms = allPerms.filter(
          perm => !(role.permissions || []).some(p => p.name === perm.name)
        );
        if (missingPerms.length > 0) {
          role.permissions = [...(role.permissions || []), ...missingPerms];
          await roleRepo.save(role);
          updated = true;
        }
      } else if (role.name === RoleName.ADMIN) {
        // ADMIN gets only READ and UPDATE
        const adminPerms = orgPermissionEntities.filter(
          perm => perm.name === PermissionName.READ_ORGANIZATION || perm.name === PermissionName.UPDATE_ORGANIZATION
        );
        const missingPerms = adminPerms.filter(
          perm => !(role.permissions || []).some(p => p.name === perm.name)
        );
        if (missingPerms.length > 0) {
          role.permissions = [...(role.permissions || []), ...missingPerms];
          await roleRepo.save(role);
          updated = true;
        }
      } else if (role.name === RoleName.USER) {
        let readPerm = orgPermissionEntities.find(p => p.name === PermissionName.READ_ORGANIZATION);
        if (readPerm && !(role.permissions || []).some(p => p.name === readPerm.name)) {
          role.permissions = [...(role.permissions || []), readPerm];
          await roleRepo.save(role);
          updated = true;
        }
      }
      // Add more role-permission logic as needed
    }
    if (updated) {
      Logger.log(`Updated permissions for user ${user.email}`);
    }
  }
  // --- End seeding logic ---
  // --- Seed dummy users and tasks ---
  const taskModule = await import('../../libs/data/tasks.entity');
  const taskRepo = connection.getRepository(taskModule.Task);
  const TaskStatus = taskModule.TaskStatus;
  // Find roles

  // Helper to create user if not exists
 

  // Helper to create task if not exists
  const TaskPriority = taskModule.TaskPriority;
  function getRandomPriority() {
    const priorities = [TaskPriority.LOW, TaskPriority.MEDIUM, TaskPriority.HIGH, TaskPriority.CRITICAL];
    return priorities[Math.floor(Math.random() * priorities.length)];
  }

  async function seedTask(title: string, orgId: string, creatorId: string, assigneeId: string, reporterId: string) {
    let task = await taskRepo.findOne({ where: { title, organizationId: orgId } });
    if (!task) {
      task = taskRepo.create({
        title,
        description: `Dummy task for ${title}`,
        status: TaskStatus.TODO,
        priority: getRandomPriority(),
        organizationId: orgId,
        creatorId,
        assigneeId,
        reporterId,
      });
      task = await taskRepo.save(task);
      Logger.log(`Seeded task: ${title} in org ${orgId} with priority ${task.priority}`);
    }
    return task;
  }

  // Seed tasks assigned to USERs, created by ADMINs, reporter is always ADMIN
  await seedTask('Parent Org Task 1', parentOrg.id, parentAdmin.id, parentUser.id, parentAdmin.id);
  await seedTask('Parent Org Task 2', parentOrg.id, parentAdmin.id, parentUser.id, parentAdmin.id);
  await seedTask('Child Org Task 1', childOrg.id, childAdmin.id, childUser.id, childAdmin.id);
  await seedTask('Child Org Task 2', childOrg.id, childAdmin.id, childUser.id, childAdmin.id);

  // Seed tasks assigned to ADMINs, created by USERs, reporter is always ADMIN
  await seedTask('Parent Org Admin Task 1', parentOrg.id, parentUser.id, parentAdmin.id, parentAdmin.id);
  await seedTask('Child Org Admin Task 1', childOrg.id, childUser.id, childAdmin.id, childAdmin.id);


  app.enableCors({
    origin: 'http://localhost:4200', // Adjust this to your frontend URL
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`
  );
}

bootstrap();
