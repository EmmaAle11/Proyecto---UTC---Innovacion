import { OrderEntity } from '../../../../infrastructure/database/entities/order.entity';
import { OrderStatus as PersistedStatus } from '../../../../infrastructure/database/entities/enums';
import { Order, OrderStatus } from '../../domain/entities/Order';
import type { OrderResponse } from '../../contracts/order-response';

/** Mapea la entidad persistida (con `items.product`, `payment`, `user`) al contrato de API.
 *  Vive en el adapter: el mapeo OrderEntity -> DTO es responsabilidad de infraestructura
 *  (el puerto habla en OrderResponse, no en OrderEntity). */
export function toOrderResponse(o: OrderEntity): OrderResponse {
  const fullName = [o.user?.firstName, o.user?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  // spec #4: hora sugerida de inicio = recogida − prep estimada (máx de las líneas).
  const scheduledFor = o.scheduledFor
    ? new Date(o.scheduledFor).toISOString()
    : null;
  const prepSeconds = (o.items ?? []).reduce(
    (max, it) => Math.max(max, it.prepTimeSeconds ?? 0),
    0,
  );
  const startBy = o.scheduledFor
    ? new Date(
        new Date(o.scheduledFor).getTime() - prepSeconds * 1000,
      ).toISOString()
    : null;
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: Number(o.totalAmount),
    customer: fullName || 'Cliente',
    email: o.user?.email ?? '',
    items: (o.items ?? []).map((it) => ({
      productId: it.product?.id ?? '',
      name: it.product?.name ?? '',
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      subtotal: Number(it.subtotal),
    })),
    payment: o.payment
      ? { method: o.payment.method, status: o.payment.status }
      : null,
    createdAt: o.createdAt.toISOString(),
    readyAt: o.readyAt ? o.readyAt.toISOString() : null,
    scheduledFor,
    startBy,
    branchId: o.branchId ?? null,
    branchName: o.branchName ?? null,
  };
}

/**
 * Traduce Order (dominio) <-> OrderEntity (TypeORM). Aquí vive el ÚNICO punto que
 * conoce ambos mundos. Como ambos enums comparten los mismos valores string, el
 * puente es un cast directo (friction medida: dos enums en paralelo hasta unificar).
 */
export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    return Order.rehydrate({
      id: entity.id,
      orderNumber: entity.orderNumber,
      status: entity.status as unknown as OrderStatus,
      items: (entity.items ?? []).map((it) => ({
        productId: it.product?.id ?? '',
        quantity: it.quantity,
      })),
      acceptedAt: entity.acceptedAt,
      readyAt: entity.readyAt,
      pickupDeadline: entity.pickupDeadline,
      pickedUpAt: entity.pickedUpAt,
      scheduledFor: entity.scheduledFor,
    });
  }

  /** Vuelca el estado del agregado sobre la fila cargada, lista para save(). */
  static applyToEntity(order: Order, entity: OrderEntity): OrderEntity {
    entity.status = order.status as unknown as PersistedStatus;
    entity.acceptedAt = order.acceptedAt;
    entity.readyAt = order.readyAt;
    entity.pickupDeadline = order.pickupDeadline;
    entity.pickedUpAt = order.pickedUpAt;
    return entity;
  }
}
