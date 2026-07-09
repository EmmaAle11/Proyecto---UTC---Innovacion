import { Inject, Injectable } from '@nestjs/common';
import type { IOrderRepository } from '../domain/ports/order.repository.port';
import { ORDER_REPOSITORY } from '../domain/ports/order.repository.port';
import type {
  CongestionResponse,
  OrderResponse,
} from '../contracts/order-response';
import type { OrderMetrics } from '../contracts/order-metrics';
import { OrderStatus } from '../domain/entities/Order';
import { CreateOrderDto } from '../contracts/create-order.dto';

/**
 * Orquestación de lógica de negocio de pedidos. Persistencia delegada a IOrderRepository.
 * Lógica: validación de transiciones, cálculo de totales, auditoría.
 * Persistencia: todas las operaciones transaccionales, locks, SQL crudo viven en el adapter.
 */
@Injectable()
export class OrdersService {
  constructor(
    @Inject(ORDER_REPOSITORY)
    private readonly orders: IOrderRepository,
  ) {}

  async create(
    dto: CreateOrderDto,
    ownerUserId: string,
  ): Promise<OrderResponse> {
    return this.orders.createWithItemsAndPayment(dto, ownerUserId);
  }

  async findMine(ownerUserId: string): Promise<OrderResponse[]> {
    return this.orders.findMine(ownerUserId);
  }

  async findAll(branchId?: string): Promise<OrderResponse[]> {
    return this.orders.findAll(branchId);
  }

  async findOneOwned(id: string, ownerUserId: string): Promise<OrderResponse> {
    return this.orders.findOneOwned(id, ownerUserId);
  }

  async updateStatus(
    id: string,
    status: OrderStatus,
    actor: string,
  ): Promise<OrderResponse> {
    return this.orders.transitionStatus(id, status, actor);
  }

  async cancelOwn(id: string, ownerUserId: string): Promise<OrderResponse> {
    return this.orders.cancelOwn(id, ownerUserId);
  }

  async extendOwn(id: string, ownerUserId: string): Promise<OrderResponse> {
    return this.orders.extendOwn(id, ownerUserId);
  }

  async expireOverdue(): Promise<number> {
    return this.orders.expireOverdue();
  }

  async congestion(): Promise<CongestionResponse> {
    return this.orders.congestion();
  }

  async metrics(): Promise<OrderMetrics> {
    return this.orders.metrics();
  }

  async avgPrepByProduct(
    productIds: string[],
  ): Promise<Map<string, number>> {
    const rows = await this.orders.avgPrepByProduct(productIds);
    return new Map(rows.map((r) => [r.product_id, r.avg_seconds]));
  }
}
