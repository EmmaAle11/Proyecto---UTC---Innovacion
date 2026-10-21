import {
  BadRequestException,
  Inject,
  Injectable,
  Optional,
} from '@nestjs/common';
import type { IOrderRepository } from '../domain/ports/order.repository.port';
import { ORDER_REPOSITORY } from '../domain/ports/order.repository.port';
import { COOPERATIVA_CATALOG } from '../../organization/domain/ports/cooperativa.catalog.port';
import type { ICooperativaCatalog } from '../../organization/domain/ports/cooperativa.catalog.port';
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
    // Catálogo de cooperativas (contexto organization). @Optional: mientras el catálogo no exista
    // o no esté cableado, se preserva el comportamiento single-tenant (no se valida la sucursal).
    @Optional()
    @Inject(COOPERATIVA_CATALOG)
    private readonly coops?: ICooperativaCatalog,
  ) {}

  async create(
    dto: CreateOrderDto,
    ownerUserId: string,
  ): Promise<OrderResponse> {
    await this.assertBranchResolvable(dto.branchId);
    return this.orders.createWithItemsAndPayment(dto, ownerUserId);
  }

  /**
   * UTC-F1-002 (Zero Trust, fail-closed): si el cliente eligió una sucursal de recogida, debe
   * existir y estar activa en el catálogo. Sin `branchId` (pick-up de arranque) o sin catálogo
   * cableado/poblado, NO se valida: se preserva el single-tenant vigente (misma política que
   * `findAll` con el claim `branch_id` ausente). Solo `not_found` bloquea (→ 400).
   */
  private async assertBranchResolvable(branchId?: string): Promise<void> {
    if (!branchId || !this.coops) return;
    const resolution = await this.coops.resolveBranch(branchId);
    if (resolution === 'not_found') {
      throw new BadRequestException('Sucursal de recogida inválida');
    }
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

  async expireStalePending(): Promise<number> {
    return this.orders.expireStalePending();
  }

  async expireFinishedGoods(): Promise<number> {
    return this.orders.expireFinishedGoods();
  }

  async congestion(): Promise<CongestionResponse> {
    return this.orders.congestion();
  }

  async metrics(): Promise<OrderMetrics> {
    return this.orders.metrics();
  }
}
