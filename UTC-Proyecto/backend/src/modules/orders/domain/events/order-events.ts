import { DomainEvent } from '../../../../kernel/domain/DomainEvent';
import type { OrderId } from '../value-objects/ids';

/**
 * Eventos de dominio del contexto ORDERS — los CUATRO que BR-012 declara notificables:
 * aceptado / listo / cancelado / no recogido. Son el CONTRATO DE INTEGRACIÓN publicado del
 * agregado: el bounded context `notifications` (aguas abajo) los consume (Context Map:
 * orders ▷ notifications). El agregado los emite (`record`); el adapter los despacha en la tx.
 *
 * Cada evento lleva el `recipientUserId` (keycloak sub del DUEÑO del pedido) para que la
 * notificación se pueda scoped al cliente correcto (BR-014) sin una consulta extra.
 */
export abstract class OrderEvent extends DomainEvent {
  constructor(
    readonly orderId: OrderId,
    readonly orderNumber: number,
    readonly recipientUserId: string,
    occurredAt: Date,
  ) {
    super(occurredAt);
  }
}

/** pending → preparing: la cocina aceptó el pedido. */
export class OrderAccepted extends OrderEvent {
  readonly eventType = 'order.accepted';
}

/** preparing → ready: el pedido está listo para recoger. */
export class OrderReadied extends OrderEvent {
  readonly eventType = 'order.readied';
}

/** → cancelled: cancelado (por el cliente o por el admin). */
export class OrderCancelled extends OrderEvent {
  readonly eventType = 'order.cancelled';
}

/** ready → not_picked_up: venció la ventana de recogida. */
export class OrderNotPickedUp extends OrderEvent {
  readonly eventType = 'order.not_picked_up';
}
