import { Auth } from './../auth/entities/auth.entity';
import { Controller, Get, Patch, Param, Body, UseGuards, ValidationPipe } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PermissionName, HasPermissions, UpdateUserRoleDto } from '../../../../libs/data';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @HasPermissions(PermissionName.READ_USER)
  findAll() {
    return this.usersService.findAll();
  }

  @Patch(':id/role')
  @HasPermissions(PermissionName.ASSIGN_ROLES)
  updateUserRole(
    @Param('id') id: string,
    @Body(ValidationPipe) updateUserRoleDto: UpdateUserRoleDto,
  ) {
    return this.usersService.updateUserRole(id, updateUserRoleDto.roleName);
  }
}