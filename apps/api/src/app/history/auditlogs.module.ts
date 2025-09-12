import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { AuditLogsController } from './auditlogs.controller';
import { AuditLogsService } from './auditlogs.service';
import { AuditLog, User } from '../../../../libs/data'; // Import relevant entities
import { AuthModule } from '../auth/auth.module'; // Import AuthModule for AuthGuard, GetUser, RolesGuard

@Module({
  imports: [
    // Make these repositories available within the AuditLogsModule
    TypeOrmModule.forFeature([AuditLog, User]),
    AuthModule, // Important: Import AuthModule because AuditLogsController uses AuthGuard, GetUser, RolesGuard
  ],
  controllers: [AuditLogsController],
  providers: [AuditLogsService],
})
export class AuditLogsModule {}