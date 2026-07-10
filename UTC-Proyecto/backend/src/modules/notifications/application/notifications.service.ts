import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationEntity } from '../../../infrastructure/database/entities/notification.entity';
import { NotificationType } from '../domain/notification-type';
import { renderNotification } from '../domain/notification-content';
import type { NotificationResponse } from '../contracts/notification-response';

/** Cuántas notificaciones recientes devuelve GET /mine (las más nuevas primero). */
const RECENT_LIMIT = 50;

/**
 * Lectura del outbox de notificaciones. Slice FINO (D-045): el outbox es append-only y la
 * lectura es trivial, así que usa el Repository de TypeORM directo (sin puerto/adapter; regla
 * 46, mismo criterio que products). La ESCRITURA la hace el handler dentro de la tx del pedido.
 */
@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(NotificationEntity)
    private readonly notifications: Repository<NotificationEntity>,
  ) {}

  /** Notificaciones del usuario del JWT (BR-014), renderizadas y ordenadas por más recientes. */
  async findMine(recipientUserId: string): Promise<NotificationResponse[]> {
    const rows = await this.notifications.find({
      where: { recipientUserId },
      order: { occurredAt: 'DESC' },
      take: RECENT_LIMIT,
    });
    return rows.map((row) => {
      const { title, body } = renderNotification(
        row.eventType as NotificationType,
        row.orderNumber,
      );
      return {
        id: row.id,
        orderId: row.orderId,
        orderNumber: row.orderNumber,
        type: row.eventType,
        title,
        body,
        occurredAt: row.occurredAt.toISOString(),
      };
    });
  }
}
