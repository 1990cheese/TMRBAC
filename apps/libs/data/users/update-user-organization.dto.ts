import { IsUUID, IsNotEmpty } from 'class-validator';

export class UpdateUserOrganizationDto {
  @IsNotEmpty()
  @IsUUID()
  organizationId!: string;
}