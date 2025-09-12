import { IsEnum, IsNotEmpty } from 'class-validator';
import { RoleName } from '..';

export class UpdateUserRoleDto {
  @IsNotEmpty()
  @IsEnum(RoleName)
  roleName!: RoleName;
}