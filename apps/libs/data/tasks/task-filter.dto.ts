import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { TaskStatus } from '../tasks.entity'

export class TaskFilterDto {
  @IsString()
  @IsOptional()
  search?: string; // Search by title or description

  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus; // Filter by status

  @IsString()
  @IsOptional()
  @IsUUID('4', { message: 'Invalid creatorId format' })
  creatorId?: string; // Filter by task creator

  @IsString()
  @IsOptional()
  @IsUUID('4', { message: 'Invalid assigneeId format' })
  assigneeId?: string; // Filter by task assignee
}