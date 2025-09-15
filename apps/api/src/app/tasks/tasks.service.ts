import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User, Organization, TaskStatus, AuditLog, AuditLogAction, RoleName, TaskFilterDto, UpdateTaskDto, CreateTaskDto } from '../../../../libs/data'; // Import entities

@Injectable()
export class TasksService {
  // Helper: get all descendant org IDs (including own org)
  private async getOrgAndChildrenIds(orgId: string): Promise<string[]> {
    const orgs = await this.organizationsRepository.find();
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
  constructor(
    @InjectRepository(Task)
    private tasksRepository: Repository<Task>,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>, // For organization check
    @InjectRepository(AuditLog) // For audit logging
    private auditLogRepository: Repository<AuditLog>,
  ) {}

  /**
   * Creates a new task.
   * @param createTaskDto Data for the new task.
   * @param creatorUser The user creating the task.
   * @returns The created task.
   */
  async createTask(createTaskDto: CreateTaskDto, creatorUser: User): Promise<Task> {
  console.log('[TasksService] Received status:', createTaskDto.status);
    const creatorRole = creatorUser.roles[0]?.name;
    if (creatorRole !== RoleName.ADMIN && creatorRole !== RoleName.OWNER) {
      throw new ForbiddenException('You do not have permission to create tasks.');
    }

    if (!createTaskDto.assigneeId) {
      throw new ForbiddenException('An assignee is required to create a task.');
    }

    const assignee = await this.usersRepository.findOneBy({ id: createTaskDto.assigneeId });
    if (!assignee) {
      throw new NotFoundException(`Assignee with ID "${createTaskDto.assigneeId}" not found.`);
    }

    // OWNERs can assign tasks to users in their org and all child orgs
    if (creatorRole === RoleName.OWNER) {
      const allowedOrgIds = await this.getOrgAndChildrenIds(creatorUser.organizationId);
      if (!allowedOrgIds.includes(assignee.organizationId)) {
        throw new ForbiddenException('You can only assign tasks to users in your organization or its children.');
      }
    }

    let reporter: User | undefined = undefined;
    if (createTaskDto.reporterId) {
      reporter = await this.usersRepository.findOneBy({ id: createTaskDto.reporterId });
      if (!reporter) {
        throw new NotFoundException(`Reporter with ID "${createTaskDto.reporterId}" not found.`);
      }
    }

    const task = this.tasksRepository.create({
      ...createTaskDto,
      creator: creatorUser,
      assignee: assignee,
      reporter: reporter,
      reporterId: reporter?.id,
      organizationId: assignee.organizationId, // Task belongs to the assignee's organization
      status: createTaskDto.status ?? TaskStatus.TODO,
    });

    return this.tasksRepository.save(task);
  }

  /**
   * Finds tasks based on filters and user context.
   * @param filterDto Filters to apply.
   * @param requestingUser The user requesting the tasks.
   * @returns Array of tasks.
   */
  async getTasks(filterDto: TaskFilterDto, requestingUser: User): Promise<Task[]> {
    const userRole = requestingUser.roles[0]?.name;

    const query = this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.reporter', 'reporter')
      .addSelect([
        'assignee.id', 'assignee.firstName', 'assignee.lastName', 'assignee.email',
        'reporter.id', 'reporter.firstName', 'reporter.lastName', 'reporter.email'
      ]);

    switch (userRole) {
      case RoleName.OWNER: {
        // OWNER sees all tasks in their org and child orgs
        const orgIds = await this.getOrgAndChildrenIds(requestingUser.organizationId);
        query.where('task.organizationId IN (:...orgIds)', { orgIds });
        break;
      }
      case RoleName.ADMIN:
        // ADMIN sees all tasks within their organization.
        query.where('task.organizationId = :organizationId', {
          organizationId: requestingUser.organizationId,
        });
        break;
      case RoleName.USER:
        // USER only sees tasks assigned to them.
        query.where('task.assigneeId = :userId', { userId: requestingUser.id });
        break;
      default:
        // If user has no recognized role, they see nothing.
        return [];
    }

    // You can still add other filters like status or search on top
    if (filterDto.status) {
      query.andWhere('task.status = :status', { status: filterDto.status });
    }
    if (filterDto.search) {
      query.andWhere('(task.title LIKE :search OR task.description LIKE :search)', { search: `%${filterDto.search}%` });
    }

  const tasks = await query.getMany();
  console.log(`getTasks: user=${requestingUser.email}, role=${userRole}, returned=${tasks.length} tasks`);
  return tasks;
  }


  /**
   * Finds a single task by ID.
   * @param id ID of the task.
   * @param requestingUser The user requesting the task.
   * @returns The found task.
   */
  async getTaskById(id: string, requestingUser: User): Promise<Task> {
    const task = await this.tasksRepository.createQueryBuilder('task')
      .leftJoinAndSelect('task.creator', 'creator')
      .leftJoinAndSelect('task.assignee', 'assignee')
      .leftJoinAndSelect('task.reporter', 'reporter')
      .leftJoinAndSelect('task.organization', 'organization')
      .addSelect([
        'assignee.id', 'assignee.firstName', 'assignee.lastName', 'assignee.email',
        'reporter.id', 'reporter.firstName', 'reporter.lastName', 'reporter.email'
      ])
      .where('task.id = :id', { id })
      .getOne();

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }

    // OWNERs can access any task; others must match organization
    const userRole = requestingUser.roles[0]?.name;
    if (userRole !== RoleName.OWNER) {
      if (!requestingUser.organizationId || task.organizationId !== requestingUser.organizationId) {
        throw new UnauthorizedException('You do not have access to this task.');
      }
    }

    return task;
  }

  /**
   * Updates an existing task.
   * @param id ID of the task to update.
   * @param updateTaskDto Data to update the task with.
   * @param requestingUser The user performing the update.
   * @returns The updated task.
   */
  async updateTask(id: string, updateTaskDto: UpdateTaskDto, requestingUser: User): Promise<Task> {
    const task = await this.getTaskById(id, requestingUser); // Reuses access check

    const oldTask = { ...task }; // Capture old state for audit log

    if (updateTaskDto.assigneeId && updateTaskDto.assigneeId !== task.assigneeId) {
      const newAssignee = await this.usersRepository.findOne({ where: { id: updateTaskDto.assigneeId } });
      if (!newAssignee || newAssignee.organizationId !== requestingUser.organizationId) {
        throw new BadRequestException('New assignee not found or does not belong to your organization.');
      }
      task.assignee = newAssignee;
      task.assigneeId = newAssignee.id;
    } else if (updateTaskDto.assigneeId === null) { // Allow unassigning
      task.assignee = null;
      task.assigneeId = null;
    }

    // Update reporter if provided
    if (updateTaskDto.reporterId && updateTaskDto.reporterId !== task.reporterId) {
      const newReporter = await this.usersRepository.findOne({ where: { id: updateTaskDto.reporterId } });
      if (!newReporter) {
        throw new BadRequestException('New reporter not found.');
      }
      task.reporter = newReporter;
      task.reporterId = newReporter.id;
    } else if (updateTaskDto.reporterId === null) { // Allow unsetting
      task.reporter = null;
      task.reporterId = null;
    }

    // Apply other updates
    Object.assign(task, updateTaskDto);

    try {
      const savedTask = await this.tasksRepository.save(task);
      await this.logAudit(
        AuditLogAction.UPDATE,
        'Task',
        savedTask.id,
        oldTask,
        savedTask,
        requestingUser.id
      );
      return savedTask;
    } catch (error) {
      console.error('Error updating task:', error.message);
      throw new InternalServerErrorException('Failed to update task.');
    }
  }

  /**
   * Deletes a task.
   * @param id ID of the task to delete.
   * @param requestingUser The user performing the deletion.
   */
  async deleteTask(id: string, requestingUser: User): Promise<void> {
    const task = await this.getTaskById(id, requestingUser); // Reuses access check
    try {
      await this.tasksRepository.remove(task);
      await this.logAudit(
        AuditLogAction.DELETE,
        'Task',
        id,
        task,
        null,
        requestingUser.id
      );
    } catch (error) {
      console.error('Error deleting task:', error.message);
      throw new InternalServerErrorException('Failed to delete task.');
    }
  }

  /**
   * Internal helper to log audit events.
   * @param action The action performed.
   * @param entityType The type of entity affected.
   * @param entityId The ID of the entity affected (optional).
   * @param oldValue The state of the entity before the change (optional).
   * @param newValue The state of the entity after the change (optional).
   * @param userId The ID of the user who performed the action.
   */
  private async logAudit(
    action: AuditLogAction,
    entityType: string,
    entityId: string | null,
    oldValue: any,
    newValue: any,
    userId: string
  ): Promise<void> {
    const auditLog = this.auditLogRepository.create({
      action,
      entityType,
      entityId,
      oldValue: oldValue ? JSON.parse(JSON.stringify(oldValue)) : null, // Deep copy and remove circular references
      newValue: newValue ? JSON.parse(JSON.stringify(newValue)) : null,
      userId,
      timestamp: new Date(),
      // ipAddress and userAgent can be added from request context if available
    });
    await this.auditLogRepository.save(auditLog);
  }
}