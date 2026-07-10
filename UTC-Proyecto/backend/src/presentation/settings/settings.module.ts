import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppSettingsEntity } from '../../infrastructure/database/entities/app-settings.entity';
import { SettingsService } from '../../application/settings/settings.service';
import { SettingsController } from './settings.controller';
import { SETTINGS_REPOSITORY } from '../../application/settings/settings.repository.port';
import { TypeOrmSettingsRepository } from '../../infrastructure/database/repositories/typeorm-settings.repository';

@Module({
  imports: [TypeOrmModule.forFeature([AppSettingsEntity])],
  controllers: [SettingsController],
  providers: [
    SettingsService,
    { provide: SETTINGS_REPOSITORY, useClass: TypeOrmSettingsRepository },
  ],
  exports: [SettingsService],
})
export class SettingsModule {}
