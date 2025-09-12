import { RolesGuard } from '../auth/guards/roles.guard';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrganizationsService } from './organizations.service';
import { AddUserToOrganizationDto, HasPermissions, PermissionName, CreateOrganizationDto } from '../../../../libs/data/';
import { ValidationPipe } from '@nestjs/common';

@Controller('organizations')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  @HasPermissions(PermissionName.READ_ORGANIZATION)
  findAll() {
    return this.organizationsService.findAll();
  }

  @Post()
  @HasPermissions(PermissionName.CREATE_ORGANIZATION)
  create(@Body(ValidationPipe) createOrganizationDto: CreateOrganizationDto) {
    return this.organizationsService.create(createOrganizationDto);
  }

  @Post(':orgId/users')
  @HasPermissions(PermissionName.UPDATE_ORGANIZATION)
  addUserToOrganization(
    @Param('orgId') orgId: string,
    @Body(ValidationPipe) addUserDto: AddUserToOrganizationDto,
  ) {
    return this.organizationsService.addUser(orgId, addUserDto.userId);
  }
}
