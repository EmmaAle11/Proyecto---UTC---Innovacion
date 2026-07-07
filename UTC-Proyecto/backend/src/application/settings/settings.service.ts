import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import type { ISettingsRepository } from '../../domain/settings/settings.repository';
import { SETTINGS_REPOSITORY } from '../../domain/settings/settings.repository';
import { AppSettingsEntity } from '../../infrastructure/database/entities/app-settings.entity';
import { UpdateCongestionDto } from './dto/update-congestion.dto';

/**
 * Ajustes globales de la cooperativa (fila única). Hoy: umbrales del semáforo (G2).
 * El backend es la fuente de verdad: valida `red > yellow` y persiste.
 */
@Injectable()
export class SettingsService {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly repo: ISettingsRepository,
  ) {}

  /** Devuelve la fila única (la crea con defaults si por algún motivo no existe). */
  async get(): Promise<AppSettingsEntity> {
    return this.repo.get();
  }

  /** Actualiza los umbrales del semáforo (admin). */
  async updateCongestion(dto: UpdateCongestionDto): Promise<AppSettingsEntity> {
    if (dto.red <= dto.yellow) {
      throw new BadRequestException(
        'El umbral rojo debe ser mayor al amarillo',
      );
    }
    const settings = await this.get();
    settings.congestionYellow = dto.yellow;
    settings.congestionRed = dto.red;
    return this.repo.save(settings);
  }
}
