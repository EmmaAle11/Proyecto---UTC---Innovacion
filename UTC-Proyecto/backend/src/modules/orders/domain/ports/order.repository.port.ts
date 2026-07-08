// ponytail: puerto transicional -- aun tipa contra infra (fuga domain->infra): OrderEntity
// (retorno), OrderStatus (enum de infra) y JwtUser (auth). Limpieza a un puerto Order-typed
// (dominio puro) = rebanada posterior; deuda diferida D-040. NO tocar hasta esa rebanada:
// los 85 tests asertan sobre OrderEntity.
import { OrderEntity } from '../../../../infrastructure/database/entities/order.entity';
import { OrderStatus } from '../../../../infrastructure/database/entities/enums';
import type { CongestionResponse } from '../../contracts/order-response';
import type { OrderMetrics } from '../../contracts/order-metrics';
import type { CreateOrderDto } from '../../contracts/create-order.dto';
import type { JwtUser } from '../../../../infrastructure/auth/jwt.strategy';

export interface IOrderRepository {
  createWithItemsAndPayment(
    input: CreateOrderDto,
    user: JwtUser,
  ): Promise<OrderEntity>;
  transitionStatus(id: string, status: OrderStatus): Promise<OrderEntity>;
  cancelOwn(id: string, user: JwtUser): Promise<OrderEntity>;
  extendOwn(id: string, user: JwtUser): Promise<OrderEntity>;
  expireOverdue(): Promise<number>;
  findMine(user: JwtUser): Promise<OrderEntity[]>;
  findAll(branchId?: string): Promise<OrderEntity[]>;
  findOneOwned(id: string, profileId: string): Promise<OrderEntity>;
  congestion(): Promise<CongestionResponse>;
  metrics(): Promise<OrderMetrics>;
  avgPrepByProduct(
    productIds: string[],
  ): Promise<Array<{ product_id: string; avg_seconds: number }>>;
}

export const ORDER_REPOSITORY = Symbol('IOrderRepository');
