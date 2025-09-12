import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToOne,
    OneToMany,
    ManyToMany,
    JoinColumn,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { Organization } from './organization.entity';
  import { Role } from './roles.entity';
  import { Task } from './tasks.entity';
  
  @Entity('users') // Specifies the table name in the database
  export class User {
    @PrimaryGeneratedColumn('uuid') // Automatically generates a UUID for the primary key
    id!: string; // Using '!' to assert that it will be initialized by TypeORM
  
    @Column({ unique: true }) // Ensures email is unique
    email!: string;
  
    @Column({ select: false }) // Password will not be selected by default when querying
    password!: string;
  
    @Column({ default: 'user' }) // Default role if not explicitly set
    firstName!: string;
  
    @Column( { default: 'user' }) // Default role if not explicitly set
    lastName!: string;
  
    @CreateDateColumn() // Automatically sets the creation timestamp
    createdAt!: Date;
  
    @UpdateDateColumn() // Automatically updates the timestamp on entity updates
    updatedAt!: Date;
  
    // --- Relationships ---
  
    // Many users belong to one organization
    @ManyToOne(() => Organization, (organization) => organization.users, {
      nullable: true,
      onDelete: 'SET NULL', // If an organization is deleted, set organizationId to NULL for its users
    })
    @JoinColumn({ name: 'organizationId' }) // Specify the foreign key column name
    organization?: Organization; // Optional: A user might not belong to an organization initially
  
    @Column({ nullable: true })
    organizationId?: string; // Foreign key column for organization
  
    // Many-to-many relationship with roles
    @ManyToMany(() => Role, (role) => role.users, { cascade: true })
    @JoinTable({
      name: 'user_roles', // Junction table name
      joinColumn: {
        name: 'userId',
        referencedColumnName: 'id',
      },
      inverseJoinColumn: {
        name: 'roleId',
        referencedColumnName: 'id',
      },
    })
    roles!: Role[];
  
    // One user can have many tasks (as assignee or creator)
    @OneToMany(() => Task, (task) => task.assignee)
    assignedTasks!: Task[];
  
    @OneToMany(() => Task, (task) => task.creator)
    createdTasks!: Task[];
  }
  