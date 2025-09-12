import { CreateTaskDto } from './create-task.dto';

export type UpdateTaskDto = Partial<CreateTaskDto> & {
  status?: string;
};
