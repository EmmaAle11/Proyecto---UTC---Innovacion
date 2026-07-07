import { AppSettingsEntity } from '../../infrastructure/database/entities/app-settings.entity';

export interface ISettingsRepository {
  get(): Promise<AppSettingsEntity>;
  save(settings: AppSettingsEntity): Promise<AppSettingsEntity>;
}

export const SETTINGS_REPOSITORY = Symbol('ISettingsRepository');
