import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    JoinColumn,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  import { Organization } from './organization.entity';
  
  export enum TaskStatus {
    OPEN = 'open',
    IN_PROGRESS = 'in_progress',
    DONE = 'done',
    ARCHIVED = 'archived',
  }
  
  @Entity('tasks')
  export class Task {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column()
    title!: string;
  
    @Column({ nullable: true })
    description?: string;
  
    @Column({ enum: TaskStatus, default: TaskStatus.OPEN })
    status!: TaskStatus;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  
    // --- Relationships ---
  
    // Many tasks belong to one organization
    @ManyToOne(() => Organization, (organization) => organization.tasks, {
      onDelete: 'CASCADE', // If organization is deleted, delete its tasks
    })
    @JoinColumn({ name: 'organizationId' })
    organization!: Organization;
  
    @Column()
    organizationId!: string; // Foreign key column for organization
  
    // Many tasks can be created by one user
    @ManyToOne(() => User, (user) => user.createdTasks, {
      nullable: true,
      onDelete: 'SET NULL', // If creator is deleted, set creatorId to NULL
    })
    @JoinColumn({ name: 'creatorId' })
    creator?: User;
  
    @Column({ nullable: true })
    creatorId?: string; // Foreign key column for creator
  
    // Many tasks can be assigned to one user
    @ManyToOne(() => User, (user) => user.assignedTasks, {
      nullable: true,
      onDelete: 'SET NULL', // If assignee is deleted, set assigneeId to NULL
    })
    @JoinColumn({ name: 'assigneeId' })
    assignee?: User;
  
    @Column({ nullable: true })
    assigneeId?: string; // Foreign key column for assignee
  }