import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AppSettingsEntity } from '../entities/app-settings.entity';
import { ISettingsRepository } from '../../../application/settings/settings.repository.port';

@Injectable()
export class TypeOrmSettingsRepository implements ISettingsRepository {
  constructor(
    @InjectRepository(AppSettingsEntity)
    private readonly repo: Repository<AppSettingsEntity>,
  ) {}

  async get(): Promise<AppSettingsEntity> {
    const found = await this.repo.findOne({ where: { id: 1 } });
    return found ?? this.repo.save(this.repo.create({ id: 1 }));
  }

  save(settings: AppSettingsEntity): Promise<AppSettingsEntity> {
    return this.repo.save(settings);
  }
}
