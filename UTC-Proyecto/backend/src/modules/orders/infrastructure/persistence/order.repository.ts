import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In, type EntityManager } from 'typeorm';
import { OrderEntity } from '../../../../infrastructure/database/entities/order.entity';
import { OrderItemEntity } from '../../../../infrastructure/database/entities/order-item.entity';
import { PaymentEntity } from '../../../../infrastructure/database/entities/payment.entity';
import { ProductEntity } from '../../../../infrastructure/database/entities/product.entity';
import { UserProfileEntity } from '../../../../infrastructure/database/entities/user-profile.entity';
import { PreparationTimeEntity } from '../../../../infrastructure/database/entities/preparation-time.entity';
import { AppSettingsEntity } from '../../../../infrastructure/database/entities/app-settings.entity';
import { IOrderRepository } from '../../domain/ports/order.repository.port';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '../../../../infrastructure/database/entities/enums';
import type { CongestionResponse } from '../../contracts/order-response';
import type {
  OrderMetrics,
  PeakHour,
  TopProduct,
} from '../../contracts/order-metrics';
import type { CreateOrderDto } from '../../contracts/create-order.dto';
import type { JwtUser } from '../../../../infrastructure/auth/jwt.strategy';
import { PaymentGatewayService } from '../../../../application/payments/payment-gateway.service';
import { CircuitOpenError } from '../../../../shared/resilience/circuit-breaker';
import { DomainError } from '../../../../kernel/domain/DomainError';
import { OrderStatus as DomainStatus } from '../../domain/entities/Order';
import { OrderMapper } from './order.mapper';

/**
 * ponytail: Decisión pragmática — el lock pesimista + la transacción viven en el ADAPTER
 * (cancelOwn/extendOwn/transitionStatus envuelven load-under-lock + tx + applyStockDelta y
 * delegan la DECISIÓN al agregado Order). NO se mete un unit-of-work / tx en la capa de
 * aplicación: a esta escala agrega maquinaria que no paga. Upgrade path: si aparece una
 * operación que cruza varios agregados en una sola tx, se promueve a un unit-of-work
 * explícito en application/.
 */
const ORDER_RELATIONS = {
  items: { product: true },
  payment: true,
  user: true,
} as const;

/** Umbrales del semáforo de congestión (D-019), calculado en el servidor. */
const CONGESTION_YELLOW = 5;
const CONGESTION_RED = 10;
/** Estados que cuentan como "en cola" para el semáforo (no terminales). */
const QUEUE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];
/** Ventana (min) antes de la hora de recogida en la que un pedido programado "abre". */
const SCHEDULE_WINDOW_MIN = 20;
/** Anticipación mínima para programar una recogida (30 min, hora del servidor). */
const MIN_SCHEDULE_AHEAD_MS = 30 * 60 * 1000;
/** Promedio de preparación (BR-007/J5): últimas N muestras; con menos de MIN → tiempo base. */
const MAX_PREP_SAMPLES = 20;
const MIN_PREP_SAMPLES = 3;

/** Deriva nombre/apellido del correo institucional (perfiles creados sin registro previo). */
function deriveName(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0] ?? '';
  const parts = local
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (parts.length === 0) return { firstName: 'Cliente', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Adaptador TypeORM de pedidos (D-038). La MECÁNICA (lock pesimista, transacción, SQL de
 * inventario D-037, circuit breaker) vive aquí; las REGLAS de estado las decide el agregado
 * Order (applyAdminTransition / cancelByOwner / extendByOwner). El mapper traduce ambos mundos.
 */
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

  // --- Creación (snapshot de precio + pago + circuit breaker), atómica ---------------------

  async createWithItemsAndPayment(
    input: CreateOrderDto,
    user: JwtUser,
  ): Promise<OrderEntity> {
    const profile = await this.ensureProfile(user);
    const scheduledFor = this.validateSchedule(input.scheduledFor); // spec #4
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
        const unit = Number(product.price); // snapshot del precio (BR-015)
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

      // BR-009: efectivo no pasa por pasarela (queda pendiente). Tarjeta/online se
      // AUTORIZAN por el gateway simulado protegido con circuit breaker (C4).
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

  // --- Escritura: el adapter envuelve lock + tx + stock; el agregado decide ----------------

  /**
   * Transición del ADMIN (BR-004). Lock pesimista (FOR UPDATE) para serializar transiciones
   * concurrentes del mismo pedido; las relaciones se cargan aparte (Postgres no permite
   * FOR UPDATE con joins). El agregado valida la transición y devuelve el efecto de stock.
   */
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
      const order = await repo.findOne({ where: { id }, relations: ORDER_RELATIONS });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status === status) return order; // idempotente: mismo estado, no-op

      const now = new Date(); // BR-005: hora del servidor, nunca del frontend
      const domain = OrderMapper.toDomain(order);
      const effect = this.decide(() =>
        domain.applyAdminTransition(status as unknown as DomainStatus, now),
      );
      OrderMapper.applyToEntity(domain, order);
      await this.applyStock(manager, order, effect); // D-037
      await repo.save(order);
      if (status === OrderStatus.READY) {
        await this.recordPrepTimes(manager, order, now); // BR-007
      }
      return order;
    });
  }

  /**
   * Cancelación del CLIENTE (§3.8/§3.9). Propiedad por JWT (BR-014). Re-carga la fila FRESCA
   * bajo lock y deja que el agregado decida sobre ese estado (cierra el TOCTOU).
   */
  async cancelOwn(id: string, user: JwtUser): Promise<OrderEntity> {
    await this.findOwnedByUser(id, user); // BR-014: propiedad por JWT (o NotFound)
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const locked = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Pedido no encontrado');
      // Relaciones aparte: el `release` necesita las líneas (items+product) para el stock.
      const order = await repo.findOne({ where: { id }, relations: ORDER_RELATIONS });
      if (!order) throw new NotFoundException('Pedido no encontrado');

      const domain = OrderMapper.toDomain(order);
      const effect = this.decide(() => domain.cancelByOwner());
      OrderMapper.applyToEntity(domain, order);
      await this.applyStock(manager, order, effect); // D-037: excedente si ya estaba preparado
      await repo.save(order);
      return order;
    });
  }

  /**
   * Extender un pedido PROPIO listo (§3.10: ready → ready_later). Propiedad por JWT (BR-014).
   * El agregado valida sobre la fila FRESCA bajo lock (no revive un terminal concurrente).
   */
  async extendOwn(id: string, user: JwtUser): Promise<OrderEntity> {
    await this.findOwnedByUser(id, user); // BR-014: propiedad por JWT (o NotFound)
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const locked = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Pedido no encontrado');
      // Valida el estado FRESCO ya bloqueado ANTES de cargar relaciones (extender no toca stock).
      const domain = OrderMapper.toDomain(locked);
      this.decide(() => domain.extendByOwner());
      const order = await repo.findOne({ where: { id }, relations: ORDER_RELATIONS });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      OrderMapper.applyToEntity(domain, order);
      await repo.save(order);
      return order;
    });
  }

  /**
   * E6 (§3.8): vence la ventana de recogida. Flip ATÓMICO y condicional (solo READY con
   * deadline pasado); devuelve el inventario de TODAS las órdenes vencidas agregado y en
   * orden GLOBAL de productId (anti-deadlock con las transiciones de un solo pedido, D-037).
   */
  async expireOverdue(): Promise<number> {
    const now = new Date(); // BR-005: hora del servidor
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const flipped = await repo
        .createQueryBuilder()
        .update()
        .set({ status: OrderStatus.NOT_PICKED_UP })
        .where('status = :ready', { ready: OrderStatus.READY })
        .andWhere('pickup_deadline IS NOT NULL')
        .andWhere('pickup_deadline < :now', { now })
        .returning(['id'])
        .execute();
      const ids = ((flipped.raw as Array<{ id: string }>) ?? []).map((r) => r.id);
      if (ids.length) {
        const orders = await repo.find({
          where: { id: In(ids) },
          relations: ORDER_RELATIONS,
        });
        const byProduct = new Map<string, number>();
        for (const order of orders) {
          for (const it of order.items ?? []) {
            const pid = it.product?.id;
            if (!pid || it.quantity <= 0) continue;
            byProduct.set(pid, (byProduct.get(pid) ?? 0) + it.quantity);
          }
        }
        const productRepo = manager.getRepository(ProductEntity);
        for (const pid of [...byProduct.keys()].sort((a, b) => a.localeCompare(b))) {
          await productRepo
            .createQueryBuilder()
            .update()
            .set({ stock: () => '"stock" + :qty' })
            .where('id = :id', { id: pid })
            .setParameter('qty', byProduct.get(pid))
            .execute();
        }
      }
      return ids.length;
    });
  }

  // --- Lectura -----------------------------------------------------------------------------

  async findMine(user: JwtUser): Promise<OrderEntity[]> {
    const profile = await this.profiles.findOne({
      where: { keycloakId: user.sub },
    });
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

  /**
   * Semáforo de congestión (D-019), calculado en el SERVIDOR. Los pedidos PROGRAMADOS solo
   * cuentan cuando "abren" (dentro de los 20 min previos a su hora de recogida, spec #4).
   */
  async congestion(): Promise<CongestionResponse> {
    const settings = await this.dataSource
      .getRepository(AppSettingsEntity)
      .findOne({ where: { id: 1 } });
    const yellow = settings?.congestionYellow ?? CONGESTION_YELLOW;
    const red = settings?.congestionRed ?? CONGESTION_RED;

    const cutoff = new Date(Date.now() + SCHEDULE_WINDOW_MIN * 60 * 1000);
    const count = await this.orders
      .createQueryBuilder('o')
      .where('o.status IN (:...statuses)', { statuses: QUEUE_STATUSES })
      .andWhere('(o.scheduledFor IS NULL OR o.scheduledFor <= :cutoff)', {
        cutoff,
      })
      .getCount();
    const level = count < yellow ? 'verde' : count <= red ? 'amarillo' : 'rojo';
    return { count, level, yellow, red };
  }

  /**
   * F5 (§3.1): métricas del negocio para el admin — unidades por producto y hora pico
   * (hora LOCAL de la cooperativa). Excluye cancelados.
   */
  async metrics(): Promise<OrderMetrics> {
    const topProducts = (await this.dataSource.query(
      `SELECT p.id AS "productId", p.name AS "name", SUM(oi.quantity)::int AS "qty"
         FROM order_items oi
         JOIN orders o   ON o.id = oi.order_id
         JOIN products p ON p.id = oi.product_id
        WHERE o.status <> 'cancelled'
        GROUP BY p.id, p.name
        ORDER BY "qty" DESC
        LIMIT 5`,
    )) as TopProduct[];

    const peaks = (await this.dataSource.query(
      `SELECT EXTRACT(HOUR FROM created_at AT TIME ZONE 'America/Mexico_City')::int AS "hour",
              COUNT(*)::int AS "count"
         FROM orders
        WHERE status <> 'cancelled'
        GROUP BY "hour"
        ORDER BY "count" DESC, "hour" ASC
        LIMIT 1`,
    )) as PeakHour[];

    return { topProducts, peakHour: peaks[0] ?? null };
  }

  /**
   * J5 (§2/§3.7, BR-007): promedio REAL de preparación por producto (últimas MAX_PREP_SAMPLES
   * muestras; con menos de MIN_PREP_SAMPLES un producto NO aparece → el caller usa el base).
   */
  async avgPrepByProduct(
    productIds: string[],
  ): Promise<Array<{ product_id: string; avg_seconds: number }>> {
    if (productIds.length === 0) return [];
    const rows = (await this.dataSource.query(
      `SELECT product_id AS "productId", AVG(duration_seconds)::float AS "avg"
         FROM (
           SELECT product_id, duration_seconds,
                  ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY recorded_at DESC) AS rn
             FROM preparation_times
            WHERE product_id = ANY($1::uuid[])
         ) t
        WHERE rn <= ${MAX_PREP_SAMPLES}
        GROUP BY product_id
       HAVING COUNT(*) >= ${MIN_PREP_SAMPLES}`,
      [productIds],
    )) as { productId: string; avg: number }[];
    return rows.map((r) => ({
      product_id: r.productId,
      avg_seconds: Math.round(r.avg),
    }));
  }

  // --- Helpers -----------------------------------------------------------------------------

  /** Ejecuta una decisión del agregado traduciendo DomainError → 400 (D-039). */
  private decide<T>(fn: () => T): T {
    try {
      return fn();
    } catch (e) {
      if (e instanceof DomainError) throw new BadRequestException(e.message);
      throw e;
    }
  }

  /** Aplica el efecto de stock que decidió el agregado (D-037). */
  private applyStock(
    manager: EntityManager,
    order: OrderEntity,
    effect: 'reserve' | 'release' | 'none',
  ): Promise<void> {
    if (effect === 'none') return Promise.resolve();
    return this.applyStockDelta(manager, order, effect);
  }

  /**
   * Ciclo de vida del INVENTARIO (D-037). Atómico vía SQL (respeta el CHECK stock >= 0):
   *  - reserve: `stock = GREATEST(0, stock − cantidad)` (aparta; cocina al momento si no alcanza).
   *  - release: `stock = stock + cantidad` (excedente reofertable).
   * Orden estable por productId → dos pedidos concurrentes lockean filas en el MISMO orden
   * (sin deadlock).
   */
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

  /**
   * Registra el tiempo REAL de preparación por línea (BR-007), al pasar a "listo".
   * duration = ready_at − accepted_at (hora del servidor). Alimenta los promedios.
   */
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

  /**
   * Valida la hora de recogida programada (spec #4): ≥30 min de anticipación y mismo día
   * (hora del SERVIDOR, BR-005). Devuelve `null` si el pedido es inmediato.
   */
  private validateSchedule(raw?: string): Date | null {
    if (!raw) return null;
    const target = new Date(raw);
    if (Number.isNaN(target.getTime())) {
      throw new BadRequestException('Fecha de recogida inválida');
    }
    const now = new Date();
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
      throw new BadRequestException('Solo puedes programar la recogida para hoy');
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

  /** Carga un pedido propio resolviendo el perfil desde el JWT (BR-014). */
  private async findOwnedByUser(id: string, user: JwtUser): Promise<OrderEntity> {
    const profile = await this.profiles.findOne({
      where: { keycloakId: user.sub },
    });
    // No filtrar por perfil inexistente revelaría pedidos ajenos: tratamos como no encontrado.
    if (!profile) throw new NotFoundException('Pedido no encontrado');
    return this.findOneOwned(id, profile.id);
  }

  /** Asegura el `user_profile` del JWT (lo crea desde el token si no existe). */
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
          role: UserRole.USER,
        }),
      );
    } catch (err) {
      // Carrera (dos pedidos casi simultáneos del mismo usuario nuevo): re-leer.
      const again = await this.profiles.findOne({
        where: { keycloakId: user.sub },
      });
      if (again) return again;
      throw err;
    }
  }
}
