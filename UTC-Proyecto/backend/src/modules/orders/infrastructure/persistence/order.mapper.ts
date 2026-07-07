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
    });
  }

  /** Vuelca el estado del agregado sobre la fila cargada, lista para save(). */
  static applyToEntity(order: Order, entity: OrderEntity): OrderEntity {
    entity.status = order.status as unknown as PersistedStatus;
    return entity;
  }
}
