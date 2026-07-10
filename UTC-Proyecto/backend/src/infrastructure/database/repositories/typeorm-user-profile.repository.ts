import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserProfileEntity } from '../entities/user-profile.entity';
import { IUserProfileRepository } from '../../../application/auth/user-profile.repository.port';
import { UserRole } from '../entities/enums';

@Injectable()
export class TypeOrmUserProfileRepository implements IUserProfileRepository {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly repo: Repository<UserProfileEntity>,
  ) {}

  findByKeycloakId(keycloakId: string): Promise<UserProfileEntity | null> {
    return this.repo.findOne({ where: { keycloakId } });
  }

  async create(data: {
    keycloakId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }): Promise<UserProfileEntity> {
    const entity = this.repo.create(data);
    return this.repo.save(entity);
  }
}
