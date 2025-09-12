import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User, Role, RoleName } from '../../../../libs/data';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(Role)
    private rolesRepository: Repository<Role>, // Inject Role repository
  ) {}

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['roles'] });
  }

  async updateUserRole(userId: string, roleName: RoleName): Promise<User> {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

    const newRole = await this.rolesRepository.findOneBy({ name: roleName });
    if (!newRole) {
      throw new NotFoundException(`Role "${roleName}" not found`);
    }

    user.roles = [newRole]; // Replace existing roles with the new one
    await this.usersRepository.save(user);
    return user;
  }
}
