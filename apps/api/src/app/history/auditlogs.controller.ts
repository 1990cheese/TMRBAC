import { Controller, Get, UseGuards, Query, UsePipes, ValidationPipe } from '@nestjs/common';
import { AuditLogsService } from './auditlogs.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard' // We will create this
import { RoleName, HasRoles, GetUser, User } from '../../../../libs/data';

@Controller('auditlogs') // Base route for audit logs (e.g., /api/audit-logs)
@UseGuards(AuthGuard('jwt'), RolesGuard) // Protect with JWT and then apply RolesGuard
@HasRoles(RoleName.ADMIN, RoleName.OWNER) // Only Admins and Managers can view audit logs
export class AuditLogsController {
  constructor(private auditLogsService: AuditLogsService) {}

  @Get()
  @UsePipes(new ValidationPipe({ transform: true }))
  async getAuditLogs(@GetUser() user: User): Promise<any[]> {
    // The service already handles organization-level filtering.
    return this.auditLogsService.getAuditLogs(user);
  }
}