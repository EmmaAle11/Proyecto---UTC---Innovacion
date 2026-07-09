// Puerto de persistencia de pedidos. Habla SOLO en tipos de dominio/contratos: devuelve
// OrderResponse (el DTO de la API; el mapeo OrderEntity->DTO vive en el adapter) y recibe
// el `ownerUserId` (keycloak sub) en vez de JwtUser (auth vive en presentation). CERO infra.
import { OrderStatus } from '../entities/Order';
import type { CongestionResponse, OrderResponse } from '../../contracts/order-response';
import type { OrderMetrics } from '../../contracts/order-metrics';
import type { CreateOrderDto } from '../../contracts/create-order.dto';

export interface IOrderRepository {
  createWithItemsAndPayment(
    input: CreateOrderDto,
    ownerUserId: string,
  ): Promise<OrderResponse>;
  transitionStatus(id: string, status: OrderStatus): Promise<OrderResponse>;
  cancelOwn(id: string, ownerUserId: string): Promise<OrderResponse>;
  extendOwn(id: string, ownerUserId: string): Promise<OrderResponse>;
  expireOverdue(): Promise<number>;
  findMine(ownerUserId: string): Promise<OrderResponse[]>;
  findAll(branchId?: string): Promise<OrderResponse[]>;
  findOneOwned(id: string, ownerUserId: string): Promise<OrderResponse>;
  congestion(): Promise<CongestionResponse>;
  metrics(): Promise<OrderMetrics>;
  avgPrepByProduct(
    productIds: string[],
  ): Promise<Array<{ product_id: string; avg_seconds: number }>>;
}

export const ORDER_REPOSITORY = Symbol('IOrderRepository');
