import { OrderEntity } from '../../../../infrastructure/database/entities/order.entity';
import { Order } from '../../domain/entities/Order';
import { OrderId, ProductId } from '../../domain/value-objects/ids';
import { Quantity } from '../../domain/value-objects/quantity';
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
 * Traduce Order (dominio) <-> OrderEntity (TypeORM). Aquí vive el ÚNICO punto que conoce
 * ambos mundos. `OrderStatus` es dueño del dominio y la infra lo re-exporta (D-039/A+B), así
 * que el status cruza sin cast (mismo enum).
 */
export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    return Order.rehydrate({
      id: OrderId.of(entity.id),
      orderNumber: entity.orderNumber,
      // Receptor de las notificaciones (BR-014). Vacío si la relación `user` no se cargó
      // (p. ej. el load-under-lock de extendOwn, que no emite eventos → no lo necesita).
      ownerUserId: entity.user?.keycloakId ?? '',
      status: entity.status,
      // Solo líneas con producto cargado (relación items.product); las demás no aportan al
      // dominio y sus VOs no deben construirse a ciegas.
      items: (entity.items ?? [])
        .filter((it) => it.product?.id)
        .map((it) => ({
          productId: ProductId.of(it.product!.id),
          quantity: Quantity.of(it.quantity),
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
    entity.status = order.status;
    entity.acceptedAt = order.acceptedAt;
    entity.readyAt = order.readyAt;
    entity.pickupDeadline = order.pickupDeadline;
    entity.pickedUpAt = order.pickedUpAt;
    return entity;
  }
}
