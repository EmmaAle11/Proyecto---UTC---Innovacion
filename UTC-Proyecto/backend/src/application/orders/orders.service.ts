import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, type EntityManager } from 'typeorm';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { OrderItemEntity } from '../../infrastructure/database/entities/order-item.entity';
import { PaymentEntity } from '../../infrastructure/database/entities/payment.entity';
import { ProductEntity } from '../../infrastructure/database/entities/product.entity';
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import { PreparationTimeEntity } from '../../infrastructure/database/entities/preparation-time.entity';
import { AppSettingsEntity } from '../../infrastructure/database/entities/app-settings.entity';
import { PaymentGatewayService } from '../payments/payment-gateway.service';
import { CircuitOpenError } from '../../shared/resilience/circuit-breaker';
import type { CongestionResponse } from './dto/order-response';
import type {
  OrderMetrics,
  PeakHour,
  TopProduct,
} from './dto/order-metrics';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '../../infrastructure/database/entities/enums';
import { CreateOrderDto } from './dto/create-order.dto';
import type { JwtUser } from '../../infrastructure/auth/jwt.strategy';

/** Relaciones que necesita el mapper `toOrderResponse`. */
const ORDER_RELATIONS = {
  items: { product: true },
  payment: true,
  user: true,
} as const;

/**
 * Transiciones de estado válidas (BR-004). Un estado terminal no tiene salidas;
 * la validación vive en el backend (el frontend solo ofrece botones).
 */
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

/** Umbrales del semáforo de congestión (D-019), calculado en el servidor. */
const CONGESTION_YELLOW = 5;
const CONGESTION_RED = 10;
/** Estados que cuentan como "en cola" para el semáforo (no terminales). */
const QUEUE_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.PREPARING,
  OrderStatus.READY,
];

/** Anticipación mínima para programar una recogida (30 min, hora del servidor). */
const MIN_SCHEDULE_AHEAD_MS = 30 * 60 * 1000;
/**
 * Ventana (min) antes de la hora de recogida en la que un pedido programado
 * "abre": entra a la cola/semáforo y se avisa al negocio para empezar (spec #4).
 */
const SCHEDULE_WINDOW_MIN = 20;

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
 * Pedidos del cliente (BR-005, BR-014, BR-015). El backend es la fuente de verdad:
 * snapshotea el precio del catálogo, recalcula el total y crea orden+líneas+pago en
 * una TRANSACCIÓN. La propiedad se resuelve por el `keycloak_id` del JWT.
 */
@Injectable()
export class OrdersService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly paymentGateway: PaymentGatewayService,
  ) {}

  /**
   * C4: autoriza el cobro con tarjeta/online por la pasarela (protegida con circuit
   * breaker). Traduce cualquier rechazo/corte a un 400 con mensaje claro.
   */
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

  /**
   * Valida la hora de recogida programada (spec #4): ≥30 min de anticipación y
   * mismo día (hora del SERVIDOR, BR-005). Devuelve `null` si el pedido es inmediato.
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
    // "Mismo día" en la zona horaria del SERVIDOR. Supuesto del despliegue: servidor y
    // clientes en el mismo locale (cooperativa escolar). En un despliegue multi-TZ habría
    // que fijar la zona de la cooperativa explícitamente (limitación conocida).
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

  /** Crea un pedido del usuario autenticado (atómico). Devuelve el pedido con relaciones. */
  async create(dto: CreateOrderDto, user: JwtUser): Promise<OrderEntity> {
    const profile = await this.ensureProfile(user);
    const scheduledFor = this.validateSchedule(dto.scheduledFor); // spec #4
    // J5: estimación adaptativa por el PROMEDIO real de preparación (fallback al base).
    const avgPrep = await this.avgPrepByProduct(dto.items.map((i) => i.productId));

    const orderId = await this.dataSource.transaction(async (manager) => {
      const ids = dto.items.map((i) => i.productId);
      const products = await manager
        .getRepository(ProductEntity)
        .findBy({ id: In(ids) });
      const byId = new Map(products.map((p) => [p.id, p]));

      let total = 0;
      const lines = dto.items.map((i) => {
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
          // J5: promedio real si hay muestras suficientes; si no, el tiempo base del producto.
          prepTimeSeconds: avgPrep.get(product.id) ?? product.basePrepTimeSeconds,
        };
      });
      total = Math.round(total * 100) / 100;

      const order = await manager.getRepository(OrderEntity).save(
        manager.getRepository(OrderEntity).create({
          user: profile,
          status: OrderStatus.PENDING,
          totalAmount: total.toFixed(2),
          scheduledFor, // null = inmediato (spec #4)
          branchId: dto.branchId ?? null, // sucursal de recogida (§3.12)
          branchName: dto.branchName ?? null,
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
        dto.payMethod === PaymentMethod.EFECTIVO
          ? PaymentStatus.PENDING
          : await this.authorizeCardPayment(total);

      await manager.getRepository(PaymentEntity).save(
        manager.getRepository(PaymentEntity).create({
          order,
          method: dto.payMethod,
          status: payStatus,
          amount: total.toFixed(2),
        }),
      );

      return order.id;
    });

    return this.findOneOwned(orderId, profile.id);
  }

  /**
   * Pedidos para el admin (cola/dashboard), más recientes primero. Si se pasa
   * `branchId`, filtra por la cooperativa (§3.12): así el admin de una cooperativa
   * NO ve ni responde los pedidos de otra. Sin `branchId` devuelve todos.
   */
  findAll(branchId?: string): Promise<OrderEntity[]> {
    return this.dataSource.getRepository(OrderEntity).find({
      where: branchId ? { branchId } : {},
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cambia el estado de un pedido validando la transición (BR-004) y fijando los
   * timestamps con la hora del SERVIDOR (BR-005). Operación de una sola tabla (atómica).
   */
  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    // Transacción: cambio de estado + (si pasa a "listo") registro de tiempos, atómico.
    return this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const order = await repo.findOne({
        where: { id },
        relations: ORDER_RELATIONS,
      });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status === status) return order; // idempotente: mismo estado, no-op

      const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
      if (!allowed.includes(status)) {
        throw new BadRequestException(
          `Transición no permitida: ${order.status} → ${status}`,
        );
      }

      const now = new Date(); // BR-005: hora del servidor, nunca del frontend
      order.status = status;
      if (status === OrderStatus.PREPARING) order.acceptedAt = now;
      if (status === OrderStatus.READY) {
        order.readyAt = now;
        order.pickupDeadline = new Date(now.getTime() + 20 * 60 * 1000); // +20 min (D-005)
      }
      if (status === OrderStatus.PICKED_UP) order.pickedUpAt = now;

      await repo.save(order);
      if (status === OrderStatus.READY) {
        await this.recordPrepTimes(manager, order, now); // BR-007
      }
      return order;
    });
  }

  /**
   * J5 (§2/§3.7, BR-007): promedio REAL de preparación por producto, con las últimas
   * MAX_PREP_SAMPLES muestras de `preparation_times`. Un producto con menos de
   * MIN_PREP_SAMPLES muestras NO aparece (el caller usa `basePrepTimeSeconds`).
   * Devuelve Map productId → segundos (redondeado). Hora/estadística del servidor.
   */
  async avgPrepByProduct(productIds: string[]): Promise<Map<string, number>> {
    if (productIds.length === 0) return new Map();
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
    return new Map(rows.map((r) => [r.productId, Math.round(r.avg)]));
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
   * Semáforo de congestión (D-019), calculado en el SERVIDOR: cola = pending+preparing+ready.
   * Los pedidos PROGRAMADOS solo cuentan cuando "abren" (dentro de los 20 min previos a
   * su hora de recogida, spec #4): antes de eso no inflan la congestión.
   */
  async congestion(): Promise<CongestionResponse> {
    // G2: umbrales ajustables por el admin (fila única app_settings); fallback a los
    // defaults si aún no existe. Así el semáforo del ALUMNO refleja el ajuste.
    const settings = await this.dataSource
      .getRepository(AppSettingsEntity)
      .findOne({ where: { id: 1 } });
    const yellow = settings?.congestionYellow ?? CONGESTION_YELLOW;
    const red = settings?.congestionRed ?? CONGESTION_RED;

    const cutoff = new Date(Date.now() + SCHEDULE_WINDOW_MIN * 60 * 1000);
    const count = await this.dataSource
      .getRepository(OrderEntity)
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
   * F5 (§3.1): métricas del negocio para el admin — qué se vende más (unidades por
   * producto) y a qué hora pega el pico (hora del servidor). Excluye pedidos
   * cancelados. Alimenta compras y refuerzo de la hora pico.
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

    // Hora pico en la hora LOCAL de la cooperativa (no UTC): `created_at` es timestamptz,
    // así que sin `AT TIME ZONE` EXTRACT(HOUR) daría la hora UTC (p. ej. 14:00 CDMX → 20:00).
    // Despliegue single-locale (ver nota TZ en D-026).
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
   * E6 (§3.8): vence la ventana de recogida. Un pedido `ready` cuyo `pickup_deadline`
   * ya pasó se marca `not_picked_up` (el alimento queda para reoferta / manejo interno;
   * el dinero se mantiene cobrado, §3.10). Lo llama el barredor periódico. Hora del
   * servidor (`now()`). Devuelve cuántos pedidos venció.
   */
  async expireOverdue(): Promise<number> {
    const res = await this.dataSource
      .getRepository(OrderEntity)
      .createQueryBuilder()
      .update()
      .set({ status: OrderStatus.NOT_PICKED_UP })
      .where('status = :ready', { ready: OrderStatus.READY })
      .andWhere('pickup_deadline IS NOT NULL')
      .andWhere('pickup_deadline < now()')
      .execute();
    return res.affected ?? 0;
  }

  // Nota: cancelOwn/extendOwn NO reusan ALLOWED_TRANSITIONS (esa es la política del
  // ADMIN). La del cliente es explícita y separada a propósito.

  /** Estados desde los que el cliente puede cancelar su propio pedido (§3.8/§3.9):
   *  antes de prepararse (`pending`) o cuando ya está listo pero no lo recogió
   *  (`ready`/`ready_later`) — en ese caso el alimento queda para reoferta. NO se
   *  cancela un pedido en preparación ni ya recogido/terminal. */
  private static readonly CLIENT_CANCELLABLE: OrderStatus[] = [
    OrderStatus.PENDING,
    OrderStatus.READY,
    OrderStatus.READY_LATER,
  ];

  /**
   * Cancela un pedido PROPIO (§3.8/§3.9). Propiedad por JWT (BR-014). Atómica.
   */
  async cancelOwn(id: string, user: JwtUser): Promise<OrderEntity> {
    const order = await this.findOwnedByUser(id, user);
    if (!OrdersService.CLIENT_CANCELLABLE.includes(order.status)) {
      throw new BadRequestException(
        'Solo puedes cancelar un pedido pendiente o uno listo que aún no recogiste',
      );
    }
    order.status = OrderStatus.CANCELLED;
    await this.dataSource.getRepository(OrderEntity).save(order);
    return order;
  }

  /**
   * Extiende un pedido PROPIO para recogerlo después (§3.10: `ready → ready_later`).
   * Propiedad por JWT (BR-014). Una sola tabla (atómica).
   */
  async extendOwn(id: string, user: JwtUser): Promise<OrderEntity> {
    const order = await this.findOwnedByUser(id, user);
    if (order.status !== OrderStatus.READY) {
      throw new BadRequestException(
        'Solo puedes extender un pedido que está listo para recoger',
      );
    }
    order.status = OrderStatus.READY_LATER;
    await this.dataSource.getRepository(OrderEntity).save(order);
    return order;
  }

  /** Pedidos del usuario autenticado, más recientes primero (BR-014). */
  async findMine(user: JwtUser): Promise<OrderEntity[]> {
    const profile = await this.dataSource
      .getRepository(UserProfileEntity)
      .findOne({ where: { keycloakId: user.sub } });
    if (!profile) return [];
    return this.dataSource.getRepository(OrderEntity).find({
      where: { user: { id: profile.id } },
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  /** Carga un pedido garantizando que pertenece al perfil dado (BR-014). */
  private async findOneOwned(
    id: string,
    profileId: string,
  ): Promise<OrderEntity> {
    const order = await this.dataSource.getRepository(OrderEntity).findOne({
      where: { id, user: { id: profileId } },
      relations: ORDER_RELATIONS,
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  /** Carga un pedido propio resolviendo el perfil desde el JWT (BR-014). */
  private async findOwnedByUser(
    id: string,
    user: JwtUser,
  ): Promise<OrderEntity> {
    const profile = await this.dataSource
      .getRepository(UserProfileEntity)
      .findOne({ where: { keycloakId: user.sub } });
    // No filtrar por perfil inexistente revelaría pedidos ajenos: tratamos como no encontrado.
    if (!profile) throw new NotFoundException('Pedido no encontrado');
    return this.findOneOwned(id, profile.id);
  }

  /** Asegura el `user_profile` del JWT (lo crea desde el token si no existe). */
  private async ensureProfile(user: JwtUser): Promise<UserProfileEntity> {
    const repo = this.dataSource.getRepository(UserProfileEntity);
    const existing = await repo.findOne({ where: { keycloakId: user.sub } });
    if (existing) return existing;
    const email = user.email ?? `${user.sub}@edu.utc.mx`;
    const { firstName, lastName } = deriveName(email);
    try {
      return await repo.save(
        repo.create({
          keycloakId: user.sub,
          email,
          firstName,
          lastName,
          role: UserRole.USER,
        }),
      );
    } catch (err) {
      // Carrera (dos pedidos casi simultáneos del mismo usuario nuevo): re-leer.
      const again = await repo.findOne({ where: { keycloakId: user.sub } });
      if (again) return again;
      throw err;
    }
  }
}
