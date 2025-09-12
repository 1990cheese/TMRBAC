import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  
  export enum AuditLogAction {
    CREATE = 'create',
    UPDATE = 'update',
    DELETE = 'delete',
    LOGIN = 'login',
    LOGOUT = 'logout',
    ASSIGN_ROLE = 'assign_role',
    REMOVE_ROLE = 'remove_role',
  }
  
  @Entity('audit_logs')
  export class AuditLog {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ enum: AuditLogAction })
    action!: AuditLogAction;
  
    @Column()
    entityType!: string; // e.g., 'User', 'Task', 'Organization'
  
    @Column({ nullable: true })
    entityId?: string; // The ID of the entity that was affected
  
    @Column('json', { nullable: true }) // Store old and new values as JSON
    oldValue?: object;
  
    @Column('json', { nullable: true })
    newValue?: object;
  
    @Column({ nullable: true })
    ipAddress?: string;
  
    @Column({ nullable: true })
    userAgent?: string;
  
    @CreateDateColumn()
    timestamp!: Date;
  
    @Column({ nullable: true })
    userId?: string; // Foreign key for the user who performed the action
  }
  