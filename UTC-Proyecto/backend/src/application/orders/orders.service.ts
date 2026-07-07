import { Inject, Injectable } from '@nestjs/common';
import type { IOrderRepository } from '../../domain/order/order.repository';
import { ORDER_REPOSITORY } from '../../domain/order/order.repository';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { AuditLogService } from '../../shared/logging/audit-log.service';
import type { CongestionResponse } from './dto/order-response';
import type { OrderMetrics } from './dto/order-metrics';
import { OrderStatus } from '../../infrastructure/database/entities/enums';
import { CreateOrderDto } from './dto/create-order.dto';
import type { JwtUser } from '../../infrastructure/auth/jwt.strategy';

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
    private readonly auditLog: AuditLogService,
  ) {}

  async create(dto: CreateOrderDto, user: JwtUser): Promise<OrderEntity> {
    return this.orders.createWithItemsAndPayment(dto, user);
  }

  async findMine(user: JwtUser): Promise<OrderEntity[]> {
    return this.orders.findMine(user);
  }

  async findAll(branchId?: string): Promise<OrderEntity[]> {
    return this.orders.findAll(branchId);
  }

  async findOneOwned(id: string, profileId: string): Promise<OrderEntity> {
    return this.orders.findOneOwned(id, profileId);
  }

  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    return this.orders.transitionStatus(id, status);
  }

  async cancelOwn(id: string, user: JwtUser): Promise<OrderEntity> {
    return this.orders.cancelOwn(id, user);
  }

  async extendOwn(id: string, user: JwtUser): Promise<OrderEntity> {
    return this.orders.extendOwn(id, user);
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
