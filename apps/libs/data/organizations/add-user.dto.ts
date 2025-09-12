import { IsNotEmpty, IsUUID } from 'class-validator';

export class AddUserToOrganizationDto {
  @IsNotEmpty()
  @IsUUID()
  userId!: string;
}