import { OrderEntity } from '../../../../infrastructure/database/entities/order.entity';
import { OrderStatus as PersistedStatus } from '../../../../infrastructure/database/entities/enums';
import { Order, OrderStatus } from '../../domain/entities/Order';

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
