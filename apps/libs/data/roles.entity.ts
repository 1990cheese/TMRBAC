import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    ManyToMany,
    JoinTable,
    CreateDateColumn,
    UpdateDateColumn,
  } from 'typeorm';
  import { User } from './user.entity';
  import { Permission } from './permissions.entity';
  
  export enum RoleName {
        OWNER = 'OWNER',
        ADMIN = 'ADMIN',
        USER = 'USER'
    }

  @Entity('roles')
  export class Role {
    @PrimaryGeneratedColumn('uuid')
    id!: string;
  
    @Column({ unique: true, enum: RoleName })
    name!: RoleName; // Using an enum for predefined role names
  
    @Column({ nullable: true })
    description?: string;
  
    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  
    // --- Relationships ---
  
    // Many-to-many relationship with users
    @ManyToMany(() => User, (user) => user.roles)
    users!: User[];
  
    // Many-to-many relationship with permissions
    @ManyToMany(() => Permission, (permission) => permission.roles, {
      cascade: true,
    })
    @JoinTable({
      name: 'role_permissions', // Junction table name
      joinColumn: {
        name: 'roleId',
        referencedColumnName: 'id',
      },
      inverseJoinColumn: {
        name: 'permissionId',
        referencedColumnName: 'id',
      },
    })
    permissions!: Permission[];
  }
  