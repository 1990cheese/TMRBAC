import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    OneToMany,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Tree,
    TreeChildren,
    TreeParent
  } from 'typeorm';
  import { User } from './user.entity';
  import { Task } from './tasks.entity';
  
  @Entity('organizations')
  @Tree("closure-table")
  export class Organization {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ unique: true })
    name!: string;
  
    @Column({ nullable: true })
    description?: string;
  
    @Column({ default: 1 })
    level!: number;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  
    // --- Relationships ---
  
    // Parent-child relationship
    @TreeChildren()
    children!: Organization[];
  
    @TreeParent()
    @JoinColumn({ name: 'parentId' })
    parent!: Organization | null;
  
    @Column({ nullable: true })
    parentId?: string;
  
    // One organization can have many users
    @OneToMany(() => User, (user) => user.organization)
    users!: User[];
  
    // One organization can have many tasks
    @OneToMany(() => Task, (task) => task.organization)
    tasks!: Task[];
  }