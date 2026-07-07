import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Repository,
  DataSource,
  In,
  IsNull,
  type EntityManager,
  MoreThanOrEqual,
} from 'typeorm';
import { OrderEntity } from '../entities/order.entity';
import { OrderItemEntity } from '../entities/order-item.entity';
import { PaymentEntity } from '../entities/payment.entity';
import { ProductEntity } from '../entities/product.entity';
import { UserProfileEntity } from '../entities/user-profile.entity';
import { PreparationTimeEntity } from '../entities/preparation-time.entity';
import { AppSettingsEntity } from '../entities/app-settings.entity';
import { IOrderRepository } from '../../../domain/order/order.repository';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../entities/enums';
import type { CongestionResponse } from '../../../application/orders/dto/order-response';
import type { OrderMetrics } from '../../../application/orders/dto/order-metrics';
import type { CreateOrderDto } from '../../../application/orders/dto/create-order.dto';
import type { JwtUser } from '../../../infrastructure/auth/jwt.strategy';
import { PaymentGatewayService } from '../../../application/payments/payment-gateway.service';
import { CircuitOpenError } from '../../../shared/resilience/circuit-breaker';

const ORDER_RELATIONS = {
  items: { product: true },
  payment: true,
  user: true,
} as const;

const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [
    OrderStatus.PICKED_UP,
    OrderStatus.NOT_PICKED_UP,
    OrderStatus.READY_LATER,
  ],
  [OrderStatus.READY_LATER]: [OrderStatus.PICKED_UP, OrderStatus.NOT_PICKED_UP],
  [OrderStatus.PICKED_UP]: [],
  [OrderStatus.NOT_PICKED_UP]: [],
  [OrderStatus.CANCELLED]: [],
};

const CONGESTION_YELLOW = 5;
const CONGESTION_RED = 10;
const QUEUE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];
const MAX_PREP_SAMPLES = 20;
const MIN_PREP_SAMPLES = 3;
const SCHEDULE_WINDOW_MIN = 20;

function deriveName(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0] ?? '';
  const parts = local
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (parts.length === 0) return { firstName: 'Cliente', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

@Injectable()
export class TypeOrmOrderRepository implements IOrderRepository {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profiles: Repository<UserProfileEntity>,
    private readonly paymentGateway: PaymentGatewayService,
  ) {}

  async createWithItemsAndPayment(
    input: CreateOrderDto,
    user: JwtUser,
  ): Promise<OrderEntity> {
    const profile = await this.ensureProfile(user);
    const scheduledFor = this.validateSchedule(input.scheduledFor);
    const avgPrepRows = await this.avgPrepByProduct(
      input.items.map((i) => i.productId),
    );
    const avgPrep = new Map(
      avgPrepRows.map((r) => [r.product_id, r.avg_seconds]),
    );

    const orderId = await this.dataSource.transaction(async (manager) => {
      const ids = input.items.map((i) => i.productId);
      const prods = await manager
        .getRepository(ProductEntity)
        .findBy({ id: In(ids) });
      const byId = new Map(prods.map((p) => [p.id, p]));

      let total = 0;
      const lines = input.items.map((i) => {
        const product = byId.get(i.productId);
        if (!product) {
          throw new BadRequestException(
            `Producto no encontrado: ${i.productId}`,
          );
        }
        if (!product.isAvailable) {
          throw new BadRequestException(
            `Producto no disponible: ${product.name}`,
          );
        }
        const unit = Number(product.price);
        const subtotal = Math.round(unit * i.quantity * 100) / 100;
        total += subtotal;
        return {
          product,
          quantity: i.quantity,
          unitPrice: unit.toFixed(2),
          subtotal: subtotal.toFixed(2),
          prepTimeSeconds:
            avgPrep.get(product.id) ?? product.basePrepTimeSeconds,
        };
      });
      total = Math.round(total * 100) / 100;

      const order = await manager.getRepository(OrderEntity).save(
        manager.getRepository(OrderEntity).create({
          user: profile,
          status: OrderStatus.PENDING,
          totalAmount: total.toFixed(2),
          scheduledFor,
          branchId: input.branchId ?? null,
          branchName: input.branchName ?? null,
        }),
      );

      await manager.getRepository(OrderItemEntity).save(
        lines.map((l) =>
          manager.getRepository(OrderItemEntity).create({
            order,
            product: l.product,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            subtotal: l.subtotal,
            prepTimeSeconds: l.prepTimeSeconds,
          }),
        ),
      );

      const payStatus =
        input.payMethod === PaymentMethod.EFECTIVO
          ? PaymentStatus.PENDING
          : await this.authorizeCardPayment(total);

      await manager.getRepository(PaymentEntity).save(
        manager.getRepository(PaymentEntity).create({
          order,
          method: input.payMethod,
          status: payStatus,
          amount: total.toFixed(2),
        }),
      );

      return order.id;
    });

    return this.findOneOwned(orderId, profile.id);
  }

  async transitionStatus(
    id: string,
    status: OrderStatus,
  ): Promise<OrderEntity> {
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const locked = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Pedido no encontrado');

      const order = await repo.findOne({
        where: { id },
        relations: ORDER_RELATIONS,
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status === status) return order;

      const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(status)) {
        throw new BadRequestException(
          `Transición no permitida: ${order.status} → ${status}`,
        );
      }

      const now = new Date();
      order.status = status;
      if (status === OrderStatus.PREPARING) {
        order.acceptedAt = now;
        await this.applyStockDelta(manager, order, 'reserve');
      }
      if (status === OrderStatus.READY) {
        order.readyAt = now;
        order.pickupDeadline = new Date(now.getTime() + 20 * 60 * 1000);
      }
      if (status === OrderStatus.PICKED_UP) order.pickedUpAt = now;
      if (status === OrderStatus.NOT_PICKED_UP) {
        await this.applyStockDelta(manager, order, 'release');
      }

      await repo.save(order);
      if (status === OrderStatus.READY) {
        await this.recordPrepTimes(manager, order, now);
      }
      return order;
    });
  }

  async cancelOwn(id: string, user: JwtUser): Promise<OrderEntity> {
    const profile = await this.ensureProfile(user);
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const order = await repo.findOne({
        where: { id, user: { id: profile.id } },
        relations: ORDER_RELATIONS,
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status !== OrderStatus.PENDING) {
        throw new BadRequestException(
          'Solo puedes cancelar pedidos pendientes',
        );
      }
      order.status = OrderStatus.CANCELLED;
      await repo.save(order);
      return order;
    });
  }

  async extendOwn(id: string, user: JwtUser): Promise<OrderEntity> {
    const profile = await this.ensureProfile(user);
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const order = await repo.findOne({
        where: { id, user: { id: profile.id } },
        relations: ORDER_RELATIONS,
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status !== OrderStatus.READY) {
        throw new BadRequestException(
          'Solo puedes posponer pedidos listos',
        );
      }
      order.status = OrderStatus.READY_LATER;
      await repo.save(order);
      return order;
    });
  }

  async expireOverdue(): Promise<number> {
    const now = new Date();
    const result = await this.dataSource
      .getRepository(OrderEntity)
      .update(
        {
          status: OrderStatus.NOT_PICKED_UP,
          pickupDeadline: MoreThanOrEqual(now),
        },
        { status: OrderStatus.NOT_PICKED_UP },
      );
    return result.affected ?? 0;
  }

  async findMine(user: JwtUser): Promise<OrderEntity[]> {
    const profile = await this.ensureProfile(user);
    if (!profile) return [];
    return this.orders.find({
      where: { user: { id: profile.id } },
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  findAll(branchId?: string): Promise<OrderEntity[]> {
    return this.orders.find({
      where: branchId ? { branchId } : {},
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  async findOneOwned(id: string, profileId: string): Promise<OrderEntity> {
    const order = await this.orders.findOne({
      where: { id, user: { id: profileId } },
      relations: ORDER_RELATIONS,
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  async congestion(): Promise<CongestionResponse> {
    const settings = await this.dataSource
      .getRepository(AppSettingsEntity)
      .findOne({ where: { id: 1 } });
    const yellow = settings?.congestionYellow ?? CONGESTION_YELLOW;
    const red = settings?.congestionRed ?? CONGESTION_RED;

    const now = new Date();
    const openWindowStart = new Date(
      now.getTime() - SCHEDULE_WINDOW_MIN * 60 * 1000,
    );

    const immediateCount = await this.orders.count({
      where: { status: In(QUEUE_STATUSES), scheduledFor: IsNull() },
    });

    const scheduledCount = await this.orders.count({
      where: {
        status: In(QUEUE_STATUSES),
        scheduledFor: MoreThanOrEqual(openWindowStart),
      },
    });

    const queued = immediateCount + scheduledCount;

    return {
      count: queued,
      level:
        queued < yellow ? 'verde' : queued < red ? 'amarillo' : 'rojo',
      yellow,
      red,
    };
  }

  async metrics(): Promise<OrderMetrics> {
    const topRows = (await this.dataSource.query(
      `SELECT p.id AS "productId", p.name, COUNT(*) AS qty
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
        GROUP BY p.id, p.name
        ORDER BY qty DESC
        LIMIT 5`,
    )) as Array<{ productId: string; name: string; qty: number }>;

    const peakRows = (await this.dataSource.query(
      `SELECT EXTRACT(HOUR FROM o.created_at) AS hour, COUNT(*) AS cnt
         FROM orders o
        WHERE o.status NOT IN ($1, $2)
        GROUP BY hour
        ORDER BY cnt DESC
        LIMIT 1`,
      [OrderStatus.CANCELLED, OrderStatus.NOT_PICKED_UP],
    )) as Array<{ hour: number; cnt: number }>;

    return {
      topProducts: topRows.map((r) => ({
        productId: r.productId,
        name: r.name,
        qty: r.qty,
      })),
      peakHour: peakRows[0]
        ? { hour: Math.floor(peakRows[0].hour), count: peakRows[0].cnt }
        : null,
    };
  }

  async avgPrepByProduct(
    productIds: string[],
  ): Promise<Array<{ product_id: string; avg_seconds: number }>> {
    if (productIds.length === 0) return [];
    return this.dataSource.query(
      `SELECT product_id, ROUND(AVG(duration_seconds))::int AS avg_seconds
         FROM (
           SELECT product_id, duration_seconds,
                  ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY recorded_at DESC) AS rn
             FROM preparation_times
            WHERE product_id = ANY($1::uuid[])
         ) t
        WHERE rn <= $2
        GROUP BY product_id
       HAVING COUNT(*) >= $3`,
      [productIds, MAX_PREP_SAMPLES, MIN_PREP_SAMPLES],
    );
  }

  private async applyStockDelta(
    manager: EntityManager,
    order: OrderEntity,
    action: 'reserve' | 'release',
  ): Promise<void> {
    const repo = manager.getRepository(ProductEntity);
    const items = [...(order.items ?? [])].sort((a, b) =>
      (a.product?.id ?? '').localeCompare(b.product?.id ?? ''),
    );
    for (const it of items) {
      const productId = it.product?.id;
      if (!productId || it.quantity <= 0) continue;
      const expr =
        action === 'reserve'
          ? 'GREATEST(0, "stock" - :qty)'
          : '"stock" + :qty';
      await repo
        .createQueryBuilder()
        .update()
        .set({ stock: () => expr })
        .where('id = :id', { id: productId })
        .setParameter('qty', it.quantity)
        .execute();
    }
  }

  private async recordPrepTimes(
    manager: EntityManager,
    order: OrderEntity,
    readyAt: Date,
  ): Promise<void> {
    const started = order.acceptedAt ?? order.createdAt;
    const duration = Math.max(
      1,
      Math.round((readyAt.getTime() - new Date(started).getTime()) / 1000),
    );
    const repo = manager.getRepository(PreparationTimeEntity);
    const rows = (order.items ?? []).map((it) =>
      repo.create({
        product: it.product,
        orderItem: it,
        durationSeconds: duration,
      }),
    );
    if (rows.length) await repo.save(rows);
  }

  private validateSchedule(raw?: string): Date | null {
    if (!raw) return null;
    const target = new Date(raw);
    if (Number.isNaN(target.getTime())) {
      throw new BadRequestException('Fecha de recogida inválida');
    }
    const now = new Date();
    const MIN_SCHEDULE_AHEAD_MS = 30 * 60 * 1000;
    if (target.getTime() - now.getTime() < MIN_SCHEDULE_AHEAD_MS) {
      throw new BadRequestException(
        'La recogida debe programarse con al menos 30 minutos de anticipación',
      );
    }
    if (
      target.getFullYear() !== now.getFullYear() ||
      target.getMonth() !== now.getMonth() ||
      target.getDate() !== now.getDate()
    ) {
      throw new BadRequestException(
        'Solo puedes programar la recogida para hoy',
      );
    }
    return target;
  }

  private async authorizeCardPayment(amount: number): Promise<PaymentStatus> {
    try {
      return await this.paymentGateway.authorize(amount);
    } catch (e) {
      throw new BadRequestException(
        e instanceof CircuitOpenError
          ? e.message
          : 'El pago con tarjeta fue rechazado, intenta de nuevo',
      );
    }
  }

  private async ensureProfile(user: JwtUser): Promise<UserProfileEntity> {
    const existing = await this.profiles.findOne({
      where: { keycloakId: user.sub },
    });
    if (existing) return existing;
    const email = user.email ?? `${user.sub}@edu.utc.mx`;
    const { firstName, lastName } = deriveName(email);
    try {
      return await this.profiles.save(
        this.profiles.create({
          keycloakId: user.sub,
          email,
          firstName,
          lastName,
        }),
      );
    } catch (err) {
      const retry = await this.profiles.findOne({
        where: { keycloakId: user.sub },
      });
      if (retry) return retry;
      throw err;
    }
  }
}
