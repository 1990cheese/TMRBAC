import { Injectable, NotFoundException } from '@nestjs/common';
import { Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User, Organization, CreateOrganizationDto } from '../../../../libs/data/';

@Injectable()
export class OrganizationsService {
  private readonly logger = new Logger(OrganizationsService.name);
  constructor(
      @InjectRepository(Organization)
      private readonly orgRepository:
      Repository<Organization>,

      @InjectRepository(User)
      private readonly userRepository:
      Repository<User>
    ) {}
  
  async findAll(): Promise<Organization[]> {
    return this.orgRepository.find();
  }

  async create(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
    const newOrganization = this.orgRepository.create(createOrganizationDto);
    return this.orgRepository.save(newOrganization);
  }

  async addUser(organizationId: string, userId: string): Promise<User> {
    const organization = await this.orgRepository.findOneBy({ id: organizationId });
    if (!organization) {
      throw new NotFoundException(`Organization with ID "${organizationId}" not found`);
    }

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`User with ID "${userId}" not found`);
    }

  user.organizationId = organization.id;
  const updatedUser = await this.userRepository.save(user);
  this.logger.log(`User added to organization: userId=${userId}, organizationId=${organizationId}`);
  return updatedUser;
  }
}
