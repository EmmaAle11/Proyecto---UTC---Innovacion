import { Order } from '../entities/Order';

/**
 * PUERTO. Habla en tipos de DOMINIO (Order), nunca en OrderEntity (TypeORM).
 * Ésta es la diferencia con el `domain/order/order.repository.ts` viejo, que
 * importaba OrderEntity y por eso violaba dependency-rules §2.
 */
export interface OrderRepositoryPort {
  findOwned(orderId: string, ownerUserId: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

export const ORDER_REPOSITORY_PORT = Symbol('OrderRepositoryPort');
