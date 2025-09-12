import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // Import TypeOrmModule
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { Task, User, Organization, AuditLog} from '../../../../libs/data'; // Import relevant entities
import { AuthModule } from '../auth/auth.module'; // Import AuthModule to make PassportModule and JwtModule available
//AuditLog 

@Module({
  imports: [
    // Make these repositories available within the TasksModule
    TypeOrmModule.forFeature([Task, User, Organization, AuditLog]),
    AuthModule, // Important: Import AuthModule because TasksController uses AuthGuard, GetUser, RolesGuard
  ],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}