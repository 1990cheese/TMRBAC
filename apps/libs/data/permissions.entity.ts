import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Role } from './roles.entity';
  
  export enum PermissionName {
    // User Permissions
    CREATE_USER = 'create_user',
    READ_USER = 'read_user',
    UPDATE_USER = 'update_user',
    DELETE_USER = 'delete_user',
    ASSIGN_ROLES = 'assign_roles',
  
    // Organization Permissions
    CREATE_ORGANIZATION = 'create_organization',
    READ_ORGANIZATION = 'read_organization',
    UPDATE_ORGANIZATION = 'update_organization',
    DELETE_ORGANIZATION = 'delete_organization',
  
    // Task Permissions
    CREATE_TASK = 'create_task',
    READ_TASK = 'read_task',
    UPDATE_TASK = 'update_task',
    DELETE_TASK = 'delete_task',
  
    // Audit Log Permissions
    READ_AUDIT_LOG = 'read_audit_log',
  
    // Self Permissions (user can manage their own data)
    READ_OWN_TASK = 'read_own_task',
    UPDATE_OWN_TASK = 'update_own_task',
    DELETE_OWN_TASK = 'delete_own_task',
    READ_OWN_PROFILE = 'read_own_profile',
    UPDATE_OWN_PROFILE = 'update_own_profile',
  }
  
  @Entity('permissions')
  export class Permission {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ unique: true, enum: PermissionName })
    name!: PermissionName; // Using an enum for predefined permission names
  
    @Column({ nullable: true })
    description?: string;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  
    // --- Relationships ---
  
    // Many-to-many relationship with roles
    @ManyToMany(() => Role, (role) => role.permissions)
    roles!: Role[];
  }
  