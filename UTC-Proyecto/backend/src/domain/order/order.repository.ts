import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { OrderStatus } from '../../infrastructure/database/entities/enums';
import type { CongestionResponse } from '../../application/orders/dto/order-response';
import type { OrderMetrics } from '../../application/orders/dto/order-metrics';
import type { CreateOrderDto } from '../../application/orders/dto/create-order.dto';
import type { JwtUser } from '../../infrastructure/auth/jwt.strategy';

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
