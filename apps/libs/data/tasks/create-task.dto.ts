import { Entity } from 'typeorm';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { TaskStatus } from '../tasks.entity' // Import TaskStatus enum

export class CreateTaskDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  @IsUUID('4', { message: 'Invalid assigneeId format' })
  assigneeId?: string; // Optional: ID of the user assigned to the task
}