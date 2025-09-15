import { Injectable, UnauthorizedException, ConflictException, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';

import { User, Role, RoleName, Permission, PermissionName, RegisterDto, LoginDto, UpdateUserDto } from '../../../../libs/data';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private permissionsRepository: Repository<Permission>,
    private jwtService: JwtService
  ) {}

  /**
   * Hashes a plain text password.
   * @param password The plain text password.
   * @returns The hashed password.
   */
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt();
    return bcrypt.hash(password, salt);
  }

  /**
   * Compares a plain text password with a hashed password.
   * @param password The plain text password.
   * @param hashedPassword The hashed password to compare against.
   * @returns True if passwords match, false otherwise.
   */
  private async comparePasswords(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  /**
   * Seeds initial roles and permissions into the database if they don't exist.
   */
  async seedRolesAndPermissions() {
    try {
      const existingRoles = await this.rolesRepository.find();
      const existingPermissions = await this.permissionsRepository.find();

      const rolesToCreate: { name: RoleName; description: string }[] = [
        { name: RoleName.ADMIN, description: 'Administrator with full access' },
        { name: RoleName.OWNER, description: 'Manager with elevated privileges' },
        { name: RoleName.USER, description: 'Standard user with basic access' },
      ];

      const permissionsToCreate: { name: PermissionName; description: string }[] = [
        // User Permissions
        { name: PermissionName.CREATE_USER, description: 'Allows creating new users' },
        { name: PermissionName.READ_USER, description: 'Allows reading user data' },
        { name: PermissionName.UPDATE_USER, description: 'Allows updating user data' },
        { name: PermissionName.DELETE_USER, description: 'Allows deleting users' },
        { name: PermissionName.ASSIGN_ROLES, description: 'Allows assigning roles to users' },

        // Organization Permissions
        { name: PermissionName.CREATE_ORGANIZATION, description: 'Allows creating new organizations' },
        { name: PermissionName.READ_ORGANIZATION, description: 'Allows reading organization data' },
        { name: PermissionName.UPDATE_ORGANIZATION, description: 'Allows updating organization data' },
        { name: PermissionName.DELETE_ORGANIZATION, description: 'Allows deleting organizations' },

        // Task Permissions
        { name: PermissionName.CREATE_TASK, description: 'Allows creating new tasks' },
        { name: PermissionName.READ_TASK, description: 'Allows reading task data' },
        { name: PermissionName.UPDATE_TASK, description: 'Allows updating task data' },
        { name: PermissionName.DELETE_TASK, description: 'Allows deleting tasks' },

        // Audit Log Permissions
        { name: PermissionName.READ_AUDIT_LOG, description: 'Allows reading audit logs' },

        // Self Permissions (user can manage their own data)
        { name: PermissionName.READ_OWN_TASK, description: 'Allows reading user\'s own tasks' },
        { name: PermissionName.UPDATE_OWN_TASK, description: 'Allows updating user\'s own tasks' },
        { name: PermissionName.DELETE_OWN_TASK, description: 'Allows deleting user\'s own tasks' },
        { name: PermissionName.READ_OWN_PROFILE, description: 'Allows reading user\'s own profile' },
        { name: PermissionName.UPDATE_OWN_PROFILE, description: 'Allows updating user\'s own profile' },
      ];

      // Create permissions if they don't exist
      for (const permData of permissionsToCreate) {
        if (!existingPermissions.some(ep => ep.name === permData.name)) {
          const newPermission = this.permissionsRepository.create(permData);
          await this.permissionsRepository.save(newPermission);
          console.log(`Permission created: ${newPermission.name}`);
        }
      }

      // Create roles if they don't exist and link permissions
      for (const roleData of rolesToCreate) {
        let role = existingRoles.find(er => er.name === roleData.name);
        if (!role) {
          role = this.rolesRepository.create(roleData);
          await this.rolesRepository.save(role);
          console.log(`Role created: ${role.name}`);
        }

        // Link permissions to roles
        if (role.name === RoleName.OWNER) {
          const allPermissions = await this.permissionsRepository.find();
          role.permissions = allPermissions;
        } else if (role.name === RoleName.ADMIN) {
          const managerPermissions = await this.permissionsRepository.find({
            where: [
              { name: PermissionName.READ_USER },
              { name: PermissionName.CREATE_TASK },
              { name: PermissionName.READ_TASK },
              { name: PermissionName.UPDATE_TASK },
              { name: PermissionName.READ_ORGANIZATION },
              { name: PermissionName.READ_AUDIT_LOG },
              { name: PermissionName.READ_OWN_TASK },
              { name: PermissionName.UPDATE_OWN_TASK },
              { name: PermissionName.READ_OWN_PROFILE },
              { name: PermissionName.UPDATE_OWN_PROFILE },
            ],
          });
          role.permissions = managerPermissions;
        } else if (role.name === RoleName.USER) {
          const userPermissions = await this.permissionsRepository.find({
            where: [
              { name: PermissionName.CREATE_TASK },
              { name: PermissionName.READ_TASK },
              { name: PermissionName.READ_OWN_TASK },
              { name: PermissionName.UPDATE_OWN_TASK },
              { name: PermissionName.DELETE_OWN_TASK },
              { name: PermissionName.READ_OWN_PROFILE },
              { name: PermissionName.UPDATE_OWN_PROFILE },
            ],
          });
          role.permissions = userPermissions;
        } else{
          const guestPermissions = await this.permissionsRepository.find({
            where: [
              { name: PermissionName.READ_OWN_PROFILE },
            ],
          });
          role.permissions = guestPermissions;
        }
        await this.rolesRepository.save(role);
      }
      console.log('Roles and permissions seeded successfully.');
    } catch (error) {
      console.error('Error seeding roles and permissions:', error);
    }
  }


  /**
   * Registers a new user with a default role.
   * @param registerDto The registration data.
   * @returns The registered user object.
   */
  async register(registerDto: RegisterDto): Promise<User> {
    const { email, password, firstName, lastName } = registerDto;

    console.log('Registering user:', { email, firstName, lastName });

    const existingUser = await this.usersRepository.findOne({ where: { email } });
    if (existingUser) {
      console.log('User already exists:', email);
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await this.hashPassword(password);

    // Assign a default role (e.g., 'user')
    const defaultUserRole = await this.rolesRepository.findOne({ where: { name: RoleName.USER } });
    if (!defaultUserRole) {
      console.log('Default user role not found!');
      throw new InternalServerErrorException('Default user role not found. Please seed roles first.');
    }

    const user = this.usersRepository.create({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      roles: [defaultUserRole],
    });

    try {
      console.log('Saving user:', user);
      const result = await this.usersRepository.save(user);
      console.log('User saved successfully:', result);
      // Immediately check if user exists in DB after save
      const checkUser = await this.usersRepository.findOne({ where: { email: user.email } });
      if (!checkUser) {
        console.error('User not found in DB after save:', user.email);
      } else {
        console.log('Verified user in DB after save:', checkUser);
      }
      return result;
    } catch (error) {
      console.error('Error saving user:', error);
      if (error instanceof Error) {
        console.error('Error stack:', error.stack);
      }
      throw new InternalServerErrorException('Failed to register user.');
    }
  }

  /**
   * Validates user credentials and returns a JWT token upon successful login.
   * @param loginDto The login credentials.
   * @returns An object containing the JWT access token.
   */

  async login(loginDto: LoginDto): Promise<{ accessToken: string; user: any }> {
    const { email, password } = loginDto;
    
    // The query to find the user is correct.
    const user = await this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .leftJoinAndSelect('user.roles', 'roles')
      .leftJoinAndSelect('roles.permissions', 'permissions')
      .where('user.email = :email', { email })
      .getOne();
  
    if (!user || !(await this.comparePasswords(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
  
    // The JWT payload is also correct.
    const payload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      roles: user.roles.map(role => role.name),
      permissions: user.roles.flatMap(role => role.permissions.map(perm => perm.name))
    };
  
    const accessToken = this.jwtService.sign(payload);
  
    // THE FIX IS HERE:
    // Create a user object for the response, making sure to remove the password.
    const { password: _, ...userForResponse } = user;
  
    // Return BOTH the accessToken and the user object.
    return {
      accessToken: accessToken,
      user: userForResponse
    };
  }
  
  /**
   * Validates a user for JWT strategy.
   * This method is called by the JwtStrategy to validate the user from the JWT payload.
   * @param payload The JWT payload.
   * @returns The validated user object or null.
   */
  async validateUser(payload: any): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { id: payload.sub },
      relations: ['roles', 'roles.permissions'], // Load roles and their permissions
    });

    if (!user) {
      return null;
    }

    // Attach roles and permissions directly to the user object for easy access
    // This is optional but convenient for RBAC checks
    user.roles = user.roles.map(role => ({ ...role, permissions: role.permissions || [] }));
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, updateUserDto);
    await this.usersRepository.save(user);
    return user;
  }
}