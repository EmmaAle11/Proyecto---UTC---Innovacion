import { Order, OrderStatus } from '../entities/Order';

/**
 * PUERTO del repositorio de pedidos. Habla en tipos de DOMINIO (Order), nunca en
 * OrderEntity (TypeORM). Ésta es la diferencia con el domain/order/order.repository.ts
 * VIEJO, que importaba OrderEntity y violaba dependency-rules §2.
 *
 * ponytail: Decisión pragmática — el lock pesimista + la transacción viven en el ADAPTER
 * que implementa este puerto (cancelOwn/extendOwn/adminTransition envuelven load-under-lock
 * + tx + applyStockDelta y delegan la DECISIÓN al agregado Order). NO se mete un
 * unit-of-work / tx en la capa de aplicación: a esta escala agrega maquinaria que no paga.
 * Upgrade path: si aparece una operación que cruza varios agregados en una sola tx, se
 * promueve a un unit-of-work explícito en application/.
 */
export interface OrderRepositoryPort {
  // --- Escritura (el adapter envuelve lock + tx + stock; el agregado decide) ---
  cancelOwn(id: string, ownerUserId: string): Promise<Order>;
  extendOwn(id: string, ownerUserId: string): Promise<Order>;
  adminTransition(id: string, target: OrderStatus): Promise<Order>;
  /** Barrido periódico: vence los `ready` con deadline pasado (batch atómico). Devuelve cuántos. */
  expireOverdue(): Promise<number>;

  // --- Lectura mínima para casos de uso de escritura ---
  findOwned(orderId: string, ownerUserId: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

export const ORDER_REPOSITORY_PORT = Symbol('OrderRepositoryPort');
