import {
  Controller,
  Get,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { NotificationsService } from '../application/notifications.service';
import type { NotificationResponse } from '../contracts/notification-response';
import type { JwtUser } from '../../../infrastructure/auth/jwt.strategy';

/**
 * Notificaciones del cliente. Exige JWT (guard global); sin `@Roles`, cualquier usuario
 * autenticado ve LAS SUYAS: el scope sale del token (`sub`), nunca del query (BR-014).
 */
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  /** GET /notifications/mine → mis notificaciones (outbox del servidor, BR-012). */
  @Get('mine')
  findMine(
    @Req() req: Request & { user?: JwtUser },
  ): Promise<NotificationResponse[]> {
    if (!req.user) throw new UnauthorizedException();
    return this.notifications.findMine(req.user.sub);
  }
}
