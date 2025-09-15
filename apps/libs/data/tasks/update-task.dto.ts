import { IsString, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { TaskStatus } from '../tasks.entity' // Import TaskStatus enum
import { PartialType } from '@nestjs/mapped-types'; // Used for partial updates

// Import CreateTaskDto
import { CreateTaskDto } from './create-task.dto';

// PartialType makes all properties optional and keeps validation rules
export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsEnum(TaskStatus)
  @IsOptional()
  status?: TaskStatus; // Optional: New status for the task

  @IsString()
  @IsOptional()
  @IsUUID('4', { message: 'Invalid assigneeId format' })
  override assigneeId?: string; // Optional: Update assignee

  @IsString()
  @IsOptional()
  @IsUUID('4', { message: 'Invalid reporterId format' })
  override reporterId?: string; // Optional: Update reporter
}