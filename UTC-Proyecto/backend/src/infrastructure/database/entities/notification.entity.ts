import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';

/**
 * OUTBOX de notificaciones (bounded context `notifications`). Cada fila es un Domain Event de
 * pedido (BR-012) materializado DENTRO de la tx del cambio de estado (atomicidad: no hay
 * notificación sin cambio, ni cambio sin notificación). Es la fuente de verdad del servidor
 * para las notificaciones; el cliente la lee por `GET /notifications/mine`.
 *
 * `UNIQUE(order_id, event_type)` fuerza el "no duplicados" de BR-012 a nivel BD; el handler
 * inserta con ON CONFLICT DO NOTHING, así que un evento repetido nunca aborta la tx del pedido.
 */
@Entity('notifications')
@Unique('UQ_notifications_order_event', ['orderId', 'eventType'])
@Index('IDX_notifications_recipient', ['recipientUserId', 'occurredAt'])
export class NotificationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'order_id', type: 'uuid' })
  orderId: string;

  @Column({ name: 'order_number', type: 'int' })
  orderNumber: number;

  /** Keycloak sub del destinatario (dueño del pedido, BR-014). Scope de GET /mine. */
  @Column({ name: 'recipient_user_id', type: 'varchar' })
  recipientUserId: string;

  /** Tipo de notificación (vocabulario de este contexto, no el nombre del evento de orders). */
  @Column({ name: 'event_type', type: 'varchar' })
  eventType: string;

  /** Hora del suceso (hora del servidor, BR-005). */
  @Column({ name: 'occurred_at', type: 'timestamptz' })
  occurredAt: Date;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
