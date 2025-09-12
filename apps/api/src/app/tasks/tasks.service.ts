import { Injectable, NotFoundException, UnauthorizedException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task, User, Organization, TaskStatus, AuditLog, AuditLogAction, RoleName, TaskFilterDto, UpdateTaskDto, CreateTaskDto } from '../../../../libs/data'; // Import entities

@Injectable()
export class TasksService {
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

    // Managers can only assign tasks to users within their own organization.
    if (creatorRole === RoleName.OWNER && assignee.organizationId !== creatorUser.organizationId) {
      throw new ForbiddenException('You can only assign tasks to users in your own organization.');
    }

    const task = this.tasksRepository.create({
      ...createTaskDto,
      creator: creatorUser,
      assignee: assignee,
      organizationId: assignee.organizationId, // Task belongs to the assignee's organization
      status: TaskStatus.OPEN,
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
      .leftJoinAndSelect('task.assignee', 'assignee');

    switch (userRole) {
      case RoleName.ADMIN:
        // Admin sees all tasks. No additional filters needed.
        break;

      case RoleName.OWNER:
        // Manager sees all tasks within their organization.
        query.where('task.organizationId = :organizationId', {
          organizationId: requestingUser.organizationId,
        });
        break;

      case RoleName.USER:
        // User only sees tasks assigned to them.
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

    return query.getMany();
  }


  /**
   * Finds a single task by ID.
   * @param id ID of the task.
   * @param requestingUser The user requesting the task.
   * @returns The found task.
   */
  async getTaskById(id: string, requestingUser: User): Promise<Task> {
    const task = await this.tasksRepository.findOne({
      where: { id },
      relations: ['creator', 'assignee', 'organization'],
    });

    if (!task) {
      throw new NotFoundException(`Task with ID "${id}" not found.`);
    }

    // Ensure the user has access to this task (belongs to the same organization)
    if (!requestingUser.organizationId || task.organizationId !== requestingUser.organizationId) {
      throw new UnauthorizedException('You do not have access to this task.');
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