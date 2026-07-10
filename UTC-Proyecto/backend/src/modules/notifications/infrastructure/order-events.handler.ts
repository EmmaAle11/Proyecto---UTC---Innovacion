import { Injectable, OnModuleInit } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { DomainEvent } from '../../../kernel/domain/DomainEvent';
import {
  DomainEventDispatcher,
  type DomainEventHandler,
} from '../../../shared/events/domain-event-dispatcher';
import { OrderEvent } from '../../orders/domain/events/order-events';
import { NotificationEntity } from '../../../infrastructure/database/entities/notification.entity';
import { notificationTypeForEvent } from '../domain/notification-type';

/**
 * Handler del contexto `notifications` que reacciona a los Domain Events de ORDERS (Context
 * Map: orders ▷ notifications). Materializa el evento como una fila del OUTBOX, en la MISMA
 * transacción del cambio de estado (recibe el `EntityManager` del productor → atomicidad).
 *
 * De-dup (BR-012): inserta con ON CONFLICT DO NOTHING sobre UNIQUE(order_id, event_type), así
 * un evento repetido se ignora sin abortar la tx del pedido. Se AUTO-registra en el dispatcher
 * al iniciar (OCP: orders no sabe que notifications existe).
 */
@Injectable()
export class OrderEventsHandler implements DomainEventHandler, OnModuleInit {
  constructor(private readonly dispatcher: DomainEventDispatcher) {}

  onModuleInit(): void {
    this.dispatcher.register(this);
  }

  async handle(event: DomainEvent, manager: EntityManager): Promise<void> {
    // Solo eventos de pedido; los demás no son de este contexto.
    if (!(event instanceof OrderEvent)) return;
    const type = notificationTypeForEvent(event.eventType);
    if (!type) return; // evento de pedido no notificable (BR-012)

    await manager
      .createQueryBuilder()
      .insert()
      .into(NotificationEntity)
      .values({
        orderId: event.orderId,
        orderNumber: event.orderNumber,
        recipientUserId: event.recipientUserId,
        eventType: type,
        occurredAt: event.occurredAt,
      })
      .orIgnore() // ON CONFLICT (order_id, event_type) DO NOTHING → de-dup BR-012
      .execute();
  }
}
