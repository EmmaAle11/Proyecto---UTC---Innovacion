import { Body, Controller, Get, Patch } from '@nestjs/common';
import { SettingsService } from '../../application/settings/settings.service';
import { UpdateCongestionDto } from '../../application/settings/dto/update-congestion.dto';
import { Roles } from '../auth/decorators/roles.decorator';

interface CongestionThresholds {
  yellow: number;
  red: number;
}

/**
 * Ajustes de la cooperativa. `GET` protegido por el guard JWT global (cualquier
 * usuario autenticado lee los umbrales; el alumno los usa para el semáforo). El
 * `PATCH` exige rol **admin** (`@Roles('admin')`, RolesGuard global → 403 si `user`).
 */
@Controller('settings')
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  /** GET /settings/congestion → umbrales actuales del semáforo (G2/§3.14). */
  @Get('congestion')
  async getCongestion(): Promise<CongestionThresholds> {
    const s = await this.settings.get();
    return { yellow: s.congestionYellow, red: s.congestionRed };
  }

  /** PATCH /settings/congestion → ajusta los umbrales (admin). */
  @Patch('congestion')
  @Roles('admin')
  async updateCongestion(
    @Body() dto: UpdateCongestionDto,
  ): Promise<CongestionThresholds> {
    const s = await this.settings.updateCongestion(dto);
    return { yellow: s.congestionYellow, red: s.congestionRed };
  }
}
