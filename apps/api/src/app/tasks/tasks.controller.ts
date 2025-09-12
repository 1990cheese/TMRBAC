import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, UsePipes, ValidationPipe, Query, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { AuthGuard } from '@nestjs/passport'; // For JWT authentication
import { Task, User, Role, GetUser, CreateTaskDto, UpdateTaskDto, TaskFilterDto, HasPermissions, HasRoles, RoleName, PermissionName } from '../../../../libs/data'; // To type req.user
import { RolesGuard } from '../auth/guards/roles.guard'; // We will create this

@Controller('tasks') // Base route for tasks endpoints (e.g., /api/tasks)
@UseGuards(AuthGuard('jwt')) // Protect all task endpoints with JWT authentication
export class TasksController {
  constructor(private tasksService: TasksService) {}


  @Post()
  @UsePipes(ValidationPipe)
  // CRITICAL CHANGE: Only ADMIN and MANAGER can create tasks.
  @HasPermissions(PermissionName.CREATE_TASK)
  async createTask(
    @Body() createTaskDto: CreateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    return this.tasksService.createTask(createTaskDto, user);
  }


  @Get()
  // This can remain broad, as the service now handles the scoping.
  @HasPermissions(PermissionName.READ_TASK)
  async getTasks(
    @Query(ValidationPipe) filterDto: TaskFilterDto,
    @GetUser() user: User,
  ): Promise<Task[]> {
    return this.tasksService.getTasks(filterDto, user);
  }
  

  @Get('/:id')
  @UseGuards(RolesGuard)
  @HasRoles(RoleName.ADMIN, RoleName.OWNER, RoleName.USER)
  async getTaskById(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<Task> {
    // The service handles access control (organization-level and ownership implied)
    return this.tasksService.getTaskById(id, user);
  }

  @Patch('/:id')
  @UsePipes(ValidationPipe)
  @UseGuards(RolesGuard)
  @HasRoles(RoleName.ADMIN, RoleName.OWNER, RoleName.USER) // Admins/Managers/Users can update tasks
  async updateTask(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @GetUser() user: User,
  ): Promise<Task> {
    // The service handles access control (organization-level and ownership implied)
    return this.tasksService.updateTask(id, updateTaskDto, user);
  }

  @Delete('/:id')
  @UseGuards(RolesGuard)
  @HasRoles(RoleName.ADMIN, RoleName.OWNER, RoleName.USER) // Admins/Managers/Users can delete tasks (fine-grain logic in service)
  async deleteTask(
    @Param('id') id: string,
    @GetUser() user: User,
  ): Promise<void> {
    // The service handles access control
    return this.tasksService.deleteTask(id, user);
  }
}