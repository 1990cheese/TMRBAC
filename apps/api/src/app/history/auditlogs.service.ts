import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog, User } from '../../../../libs/data'; // Import entities

@Injectable()
export class AuditLogsService {
  constructor(
    @InjectRepository(AuditLog)
    private auditLogRepository: Repository<AuditLog>,
    @InjectRepository(User)
    private usersRepository: Repository<User>, // For populating user details
  ) {}

  /**
   * Retrieves audit logs based on filters for authorized users.
   * Managers/Admins can view logs across their organization.
   * Regular users might only see their own related logs (this logic will be enforced by RBAC guards).
   * @param requestingUser The user requesting the audit logs.
   * @returns Array of AuditLog entities.
   */
  async getAuditLogs(requestingUser: User): Promise<AuditLog[]> {
    const query = this.auditLogRepository.createQueryBuilder('auditLog');
    query.leftJoinAndSelect('auditLog.user', 'user'); // Eager load the user who performed the action

    // Important: Filter logs by organization ID.
    // Assuming audit logs are related to the organization where the action occurred.
    // For simplicity, we'll only show logs from the requesting user's organization.
    if (!requestingUser.organizationId) {
      throw new BadRequestException('User must belong to an organization to view audit logs.');
    }
    query.andWhere('user.organizationId = :organizationId', { organizationId: requestingUser.organizationId });

    // Note: Further filtering by specific user, entityType, action, or date ranges
    // can be added here, similar to TaskFilterDto, if a DTO for AuditLog filters is created.

    return query.getMany();
  }
}