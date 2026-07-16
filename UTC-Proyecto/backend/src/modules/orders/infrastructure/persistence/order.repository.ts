import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
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
import { FinishedGoodEntity } from '../../../../infrastructure/database/entities/finished-good.entity';
import { StockMovementEntity } from '../../../../infrastructure/database/entities/stock-movement.entity';
import {
  FinishedGoodSource,
  StockMovementReason,
  StockMovementType,
} from '../../../../infrastructure/database/entities/enums';
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
import type { OrderResponse } from '../../contracts/order-response';
import { PaymentGatewayService } from '../../../../application/payments/payment-gateway.service';
import { CircuitOpenError } from '../../../../shared/resilience/circuit-breaker';
import { DomainError } from '../../../../kernel/domain/DomainError';
import { Order } from '../../domain/entities/Order';
import type { StockEffect, PlacedLine } from '../../domain/entities/Order';
import { OrderId } from '../../domain/value-objects/ids';
import {
  OrderNotPickedUp,
  OrderCancelled,
} from '../../domain/events/order-events';
import { AuditLogService } from '../../../../shared/logging/audit-log.service';
import { DomainEventDispatcher } from '../../../../shared/events/domain-event-dispatcher';
import { OrderMapper, toOrderResponse } from './order.mapper';

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
/** ponytail: TTL (min) de un pedido PENDING sin aceptar antes de vencerlo y LIBERAR su reserva
 *  (D-052 — sin esto, "reservar al pedir" fugaría stock por abandono). Knob: 30 min por defecto;
 *  si necesitara ser por sucursal → app_settings. En PROGRAMADOS el reloj corre desde
 *  scheduled_for (retienen hasta su hora), no desde created_at. */
const PENDING_TTL_MIN = 30;
/** ponytail: vida (horas) de una unidad rescatada a reoferta antes de caducar y MERMARSE (D-052,
 *  Plan 08). 4 h = comida del día, no cruza al día siguiente. Si necesitara ser por producto/sucursal
 *  → app_settings. Es lo que hace que el ciclo de reoferta TERMINE (rompe el bucle infinito). */
const REOFFER_TTL_HOURS = 4;
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
  private readonly logger = new Logger(TypeOrmOrderRepository.name);

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(OrderEntity)
    private readonly orders: Repository<OrderEntity>,
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
    @InjectRepository(UserProfileEntity)
    private readonly profiles: Repository<UserProfileEntity>,
    private readonly paymentGateway: PaymentGatewayService,
    private readonly auditLog: AuditLogService,
    private readonly events: DomainEventDispatcher,
  ) {}

  // --- Creación (snapshot de precio + pago + circuit breaker), atómica ---------------------

  async createWithItemsAndPayment(
    input: CreateOrderDto,
    ownerUserId: string,
  ): Promise<OrderResponse> {
    const profile = await this.ensureProfile(ownerUserId);
    const ids = input.items.map((i) => i.productId);
    const avgPrepRows = await this.avgPrepByProduct(ids);
    const avgPrepByProductId: Record<string, number> = {};
    for (const r of avgPrepRows) avgPrepByProductId[r.product_id] = r.avg_seconds;

    // Traer productos y decidir el plan FUERA de la tx (el precio es un snapshot, BR-015).
    const prods = await this.products.findBy({ id: In(ids) });
    const byId = new Map(prods.map((p) => [p.id, p]));
    // D-052 Plan 08 (bug 2): las líneas de RESCATE traen `finishedGoodId` → traer esas unidades para
    // cobrar su precio DE LA UNIDAD (no del producto). Snapshot fuera de la tx; la reserva atómica gatea.
    const fgIds = input.items
      .map((i) => i.finishedGoodId)
      .filter((x): x is string => Boolean(x));
    const fgRows = fgIds.length
      ? await this.dataSource.getRepository(FinishedGoodEntity).find({
          where: { id: In(fgIds), isReoffer: true },
          relations: { product: true },
        })
      : [];
    const reofferUnits = fgRows.map((fg) => ({
      id: fg.id,
      productId: fg.product?.id ?? '',
      reofferPrice: fg.reofferPrice != null ? Number(fg.reofferPrice) : null,
      qty: fg.qty,
    }));
    const plan = this.decide(() =>
      Order.place({
        items: input.items,
        products: prods.map((p) => ({
          id: p.id,
          name: p.name,
          price: Number(p.price),
          isAvailable: p.isAvailable,
          basePrepTimeSeconds: p.basePrepTimeSeconds,
        })),
        reofferUnits,
        avgPrepByProductId,
        scheduledForRaw: input.scheduledFor,
        now: new Date(), // BR-005: hora del servidor
      }),
    );

    // D-052 — Saga "reservar → cobrar → confirmar/compensar" (revierte D-037).
    // Tx1 CORTA (sin I/O de red, C4): RESERVA el stock condicionalmente y persiste el pedido en
    // PENDING con el pago aún PENDING. Si no alcanza → 409 y la tx se revierte entera. La reserva
    // queda SIEMPRE con dueño (la fila orders): si el proceso muere antes de cobrar, no hay stock
    // fantasma sin pedido.
    const orderId = await this.dataSource.transaction(async (manager) => {
      await this.reserveStockOrThrow(manager, plan.lines, byId);

      const order = await manager.getRepository(OrderEntity).save(
        manager.getRepository(OrderEntity).create({
          user: profile,
          status: plan.status, // PENDING
          totalAmount: plan.total.toString(),
          scheduledFor: plan.scheduledFor,
          branchId: input.branchId ?? null,
          branchName: input.branchName ?? null,
        }),
      );

      await manager.getRepository(OrderItemEntity).save(
        plan.lines.map((l) =>
          manager.getRepository(OrderItemEntity).create({
            order,
            // El dominio ya validó que cada producto existe → byId.get es seguro.
            product: byId.get(l.productId)!,
            quantity: l.quantity.value,
            unitPrice: l.unitPrice.toString(),
            subtotal: l.subtotal.toString(),
            prepTimeSeconds: l.prepTimeSeconds,
            finishedGoodId: l.finishedGoodId, // Plan 08 bug 2: rastro de la compra de rescate
          }),
        ),
      );

      await manager.getRepository(PaymentEntity).save(
        manager.getRepository(PaymentEntity).create({
          order,
          method: input.payMethod,
          // Aún sin autorizar: efectivo se cobra en mostrador; tarjeta se autoriza tras esta tx.
          status: PaymentStatus.PENDING,
          amount: plan.total.toString(),
        }),
      );

      return order.id;
    });

    // BR-009: el efectivo se cobra en el mostrador → el pago queda PENDING (la reserva ya está hecha).
    // La tarjeta se AUTORIZA ahora, FUERA de la tx (no sostener la conexión durante el I/O de red, C4).
    if (input.payMethod !== PaymentMethod.EFECTIVO) {
      let authorized: PaymentStatus;
      try {
        authorized = await this.authorizeCardPayment(plan.total.amount);
      } catch (e) {
        // §9: no dejar un pedido con reserva si el pago falló → liberar el stock y cancelar el
        // pedido (compensación), luego re-lanzar el error original (400) al cliente.
        await this.compensateFailedPayment(orderId);
        throw e;
      }
      await this.dataSource.transaction(async (manager) => {
        // P2: bajo lock, capturar solo si el pedido sigue "vivo por cobrar" (PENDING o PREPARING),
        // simétrico con compensateFailedPayment. Si el admin lo ACEPTÓ (PREPARING) mientras se
        // autorizaba, el cobro autorizado DEBE registrarse igual, o el pedido se cocina y entrega
        // marcado como "no pagado" (hueco de ingresos). Si el admin/cliente lo CANCELÓ, su transición
        // ya liberó el stock; marcar PAID dejaría un cobro sobre un cancelado sin reembolso → se salta.
        // Con pasarela real ese salto iría con un void del cargo; con pagos simulados no hay captura.
        const orderRepo = manager.getRepository(OrderEntity);
        const locked = await orderRepo.findOne({
          where: { id: orderId },
          lock: { mode: 'pessimistic_write' },
        });
        if (
          !locked ||
          (locked.status !== OrderStatus.PENDING &&
            locked.status !== OrderStatus.PREPARING)
        ) {
          return;
        }
        const payments = manager.getRepository(PaymentEntity);
        const payment = await payments.findOne({
          where: { order: { id: orderId } },
        });
        if (payment) {
          payment.status = authorized; // PAID
          await payments.save(payment);
        }
      });
    }

    return toOrderResponse(await this.loadOwned(orderId, profile.id));
  }

  /**
   * D-052: RESERVA el stock en la creación (revierte D-037 "cocina al momento si no alcanza"). Es el
   * ÚNICO gate de inventario (P4#6): el dominio ya no pre-valida el agotado sobre un snapshot rancio.
   * UPDATE condicional `stock = stock − qty WHERE id = :id AND stock >= :qty`: si no alcanza,
   * `affected = 0` → 409 NOMBRANDO el producto, y la tx que la envuelve se revierte entera. Orden
   * estable por productId (anti-deadlock, igual que applyStockDelta) y bump de `version` (optimistic
   * lock del admin). `byId` (traído fuera de la tx) solo se usa para el mensaje del 409.
   */
  private async reserveStockOrThrow(
    manager: EntityManager,
    lines: readonly PlacedLine[],
    byId: Map<string, ProductEntity>,
  ): Promise<void> {
    const repo = manager.getRepository(ProductEntity);
    const fgRepo = manager.getRepository(FinishedGoodEntity);
    const now = new Date(); // BR-005: hora del servidor (gate de caducidad del rescate)
    const nameOf = (l: PlacedLine) =>
      byId.get(l.productId)?.name ?? 'un producto de tu pedido';

    // RESCATE primero, ordenado por finishedGoodId (MISMO orden de lock que returnReofferUnits →
    // sin deadlock; el sort por productId no basta: dos unidades del mismo producto empatan). El
    // UPDATE gatea qty>=:q Y `expires_at > now`: una unidad ya CADUCADA pero aún no barrida NO se
    // vende (el barrido de merma corre ~cada minuto; sin este gate habría una ventana de ~60s).
    const rescue = lines
      .filter((l) => l.finishedGoodId && l.quantity.value > 0)
      .sort((a, b) => (a.finishedGoodId ?? '').localeCompare(b.finishedGoodId ?? ''));
    for (const line of rescue) {
      const r = await fgRepo
        .createQueryBuilder()
        .update()
        .set({ qty: () => '"qty" - :q' })
        .where('id = :id AND qty >= :q AND expires_at > :now', {
          id: line.finishedGoodId,
        })
        .setParameter('q', line.quantity.value)
        .setParameter('now', now)
        .execute();
      if (!r.affected) {
        throw new ConflictException(
          `La unidad en reoferta de ${nameOf(line)} ya no está disponible`,
        );
      }
    }

    // FRESCAS después, ordenadas por productId (bump de version por el optimistic lock del admin).
    const fresh = lines
      .filter((l) => !l.finishedGoodId && l.quantity.value > 0)
      .sort((a, b) => a.productId.localeCompare(b.productId));
    for (const line of fresh) {
      const result = await repo
        .createQueryBuilder()
        .update()
        .set({ stock: () => '"stock" - :qty', version: () => '"version" + 1' })
        .where('id = :id AND stock >= :qty', { id: line.productId })
        .setParameter('qty', line.quantity.value)
        .execute();
      if (!result.affected) {
        throw new ConflictException(
          `Ya no queda suficiente inventario de ${nameOf(line)}`,
        );
      }
    }
  }

  /**
   * D-052: compensa un pago de tarjeta rechazado. El pedido nació PENDING con la reserva hecha
   * (Tx1); si la autorización falla, se libera el stock y el pedido pasa a CANCELLED.
   * P3/P5: carga bajo lock y solo compensa si el pedido sigue "vivo por cobrar" (PENDING o PREPARING).
   * Si el admin ya lo CANCELÓ en la ventana de autorización, su transición YA liberó → volver a
   * liberar sería doble release (stock fantasma): se salta. Si el admin lo ACEPTÓ (PREPARING, que
   * retiene la reserva), un pago que después truena debe ganar: se cancela y se libera igual (un
   * pedido con la tarjeta rechazada no se cocina). Estados más avanzados (ready/terminal) no se tocan.
   * BR-012/P4: AUDITA siempre (observabilidad) pero NOTIFICA (OrderCancelled) solo si venía de PREPARING
   * — ahí el admin ya cocinaba y la cancelación no puede ser muda. En PENDING el cliente solo vio el 400
   * del throw; un push "cancelado" de un pedido que para él nunca se confirmó sería un doble-signal.
   */
  private async compensateFailedPayment(orderId: string): Promise<void> {
    let from: OrderStatus | null = null;
    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const locked = await repo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });
      // ya lo movieron a un estado no-compensable (cancelado → no doble-release; ready/terminal → tarde)
      if (
        !locked ||
        (locked.status !== OrderStatus.PENDING &&
          locked.status !== OrderStatus.PREPARING)
      ) {
        return;
      }
      const order = await repo.findOne({
        where: { id: orderId },
        relations: ORDER_RELATIONS,
      });
      if (!order) return;
      from = order.status;
      order.status = OrderStatus.CANCELLED;
      await this.applyStock(manager, order, 'release'); // devuelve la reserva
      await repo.save(order);
      // BR-012: notifica SOLO si venía de PREPARING (el admin cocinaba → no puede ser muda). En
      // PENDING el cliente ya recibió el 400 del throw; emitir "cancelado" sería un doble-signal.
      if (from === OrderStatus.PREPARING) {
        await this.events.dispatch(
          [
            new OrderCancelled(
              OrderId.of(order.id),
              order.orderNumber,
              order.user?.keycloakId ?? '',
              new Date(),
            ),
          ],
          manager,
        );
      }
    });
    if (from !== null) {
      this.auditLog.logOrderStateChange(
        orderId,
        from,
        OrderStatus.CANCELLED,
        'system',
        'system',
      );
    }
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
    actor: string,
  ): Promise<OrderResponse> {
    let from: OrderStatus | null = null;
    const res = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const locked = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Pedido no encontrado');
      const order = await repo.findOne({ where: { id }, relations: ORDER_RELATIONS });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      if (order.status === status) return toOrderResponse(order); // idempotente: mismo estado, no-op

      from = order.status; // BR-004: estado VIEJO capturado bajo lock (antes lo perdía el controller)
      const now = new Date(); // BR-005: hora del servidor, nunca del frontend
      const domain = OrderMapper.toDomain(order);
      const effect = this.decide(() =>
        domain.applyAdminTransition(status, now),
      );
      OrderMapper.applyToEntity(domain, order);
      await this.applyStock(manager, order, effect); // D-037
      await repo.save(order);
      if (status === OrderStatus.READY) {
        await this.recordPrepTimes(manager, order, now); // BR-007
      }
      // BR-012: materializa el/los evento(s) del agregado en el outbox, en ESTA tx (atómico).
      await this.events.dispatch(domain.pullEvents(), manager);
      return toOrderResponse(order);
    });
    if (from !== null) {
      this.auditLog.logOrderStateChange(id, from, status, actor, 'admin');
    }
    return res;
  }

  /**
   * Cancelación del CLIENTE (§3.8/§3.9). Propiedad por JWT (BR-014). Re-carga la fila FRESCA
   * bajo lock y deja que el agregado decida sobre ese estado (cierra el TOCTOU).
   */
  async cancelOwn(id: string, ownerUserId: string): Promise<OrderResponse> {
    await this.findOwnedByUser(id, ownerUserId); // BR-014: propiedad por JWT (o NotFound)
    let from: OrderStatus | null = null;
    const res = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const locked = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Pedido no encontrado');
      // Relaciones aparte: el `release` necesita las líneas (items+product) para el stock.
      const order = await repo.findOne({ where: { id }, relations: ORDER_RELATIONS });
      if (!order) throw new NotFoundException('Pedido no encontrado');

      from = order.status;
      const now = new Date(); // BR-005: hora del servidor (sella el evento de cancelación)
      const domain = OrderMapper.toDomain(order);
      const effect = this.decide(() => domain.cancelByOwner(now));
      OrderMapper.applyToEntity(domain, order);
      await this.applyStock(manager, order, effect); // D-037: excedente si ya estaba preparado
      await repo.save(order);
      // BR-012: evento de cancelación al outbox, en ESTA tx (atómico con el cambio de estado).
      await this.events.dispatch(domain.pullEvents(), manager);
      return toOrderResponse(order);
    });
    if (from !== null) {
      this.auditLog.logOrderStateChange(id, from, OrderStatus.CANCELLED, ownerUserId, 'client');
    }
    return res;
  }

  /**
   * Extender un pedido PROPIO listo (§3.10: ready → ready_later). Propiedad por JWT (BR-014).
   * El agregado valida sobre la fila FRESCA bajo lock (no revive un terminal concurrente).
   */
  async extendOwn(id: string, ownerUserId: string): Promise<OrderResponse> {
    await this.findOwnedByUser(id, ownerUserId); // BR-014: propiedad por JWT (o NotFound)
    let from: OrderStatus | null = null;
    const res = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const locked = await repo.findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!locked) throw new NotFoundException('Pedido no encontrado');
      // Valida el estado FRESCO ya bloqueado ANTES de cargar relaciones (extender no toca stock).
      from = locked.status;
      const domain = OrderMapper.toDomain(locked);
      this.decide(() => domain.extendByOwner());
      const order = await repo.findOne({ where: { id }, relations: ORDER_RELATIONS });
      if (!order) throw new NotFoundException('Pedido no encontrado');
      OrderMapper.applyToEntity(domain, order);
      await repo.save(order);
      return toOrderResponse(order);
    });
    if (from !== null) {
      this.auditLog.logOrderStateChange(id, from, OrderStatus.READY_LATER, ownerUserId, 'client');
    }
    return res;
  }

  /**
   * E6 (§3.8): vence la ventana de recogida. Flip ATÓMICO y condicional (solo READY con
   * deadline pasado). D-052/Plan 08: la comida vencida SE HIZO → NACE como `finished_good` por
   * pedido (reoferta con caducidad), NO vuelve a `products.stock` como fresca (rompe el bucle 1).
   */
  async expireOverdue(): Promise<number> {
    const now = new Date(); // BR-005: hora del servidor
    const expiredIds = await this.dataSource.transaction(async (manager) => {
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
        // Cada pedido vencido se asienta como 'to_reoffer' en ESTA tx: líneas frescas → nace una
        // finished_good; líneas de rescate → vuelven a su unidad (Plan 08). No toca products.stock.
        for (const order of orders) {
          await this.applyStock(manager, order, 'to_reoffer');
        }
        // BR-012: este flip NO pasa por el agregado (es masivo por SQL), así que se construyen
        // los eventos OrderNotPickedUp desde las filas vencidas y se despachan en ESTA tx.
        const events = orders.map(
          (o) =>
            new OrderNotPickedUp(
              OrderId.of(o.id),
              o.orderNumber,
              o.user?.keycloakId ?? '',
              now,
            ),
        );
        await this.events.dispatch(events, manager);
      }
      return ids;
    });
    // Auditoría del vencimiento (barredor del sistema): ready -> not_picked_up.
    for (const id of expiredIds) {
      this.auditLog.logOrderStateChange(
        id,
        OrderStatus.READY,
        OrderStatus.NOT_PICKED_UP,
        'system',
        'system',
      );
    }
    return expiredIds.length;
  }

  /**
   * D-052: vence los pedidos PENDING abandonados (nadie los aceptó ni canceló) y LIBERA su
   * reserva — sin esto, "reservar al pedir" fugaría stock por abandono. Simétrico a
   * `expireOverdue`: flip atómico y condicional, release agregado en orden GLOBAL de productId
   * (anti-deadlock con las transiciones de un solo pedido), eventos y auditoría. El reloj corre
   * desde `scheduled_for` si el pedido es programado (retiene hasta su hora), o desde `created_at`
   * si es inmediato — `COALESCE` lo resuelve en una sola expresión.
   */
  async expireStalePending(): Promise<number> {
    // ponytail (P4#5): asume BD nacida de migraciones + semilla (sin pedidos previos). Si algún día
    // se desplegara sobre datos pre-D-052 (PENDING sin reserva), drenar esos PENDING antes del deploy
    // o el release inflaría stock. No hay flag "tenía reserva"; añadirlo para 0 filas sería especular.
    const now = new Date(); // BR-005: hora del servidor
    const cutoff = new Date(now.getTime() - PENDING_TTL_MIN * 60 * 1000);
    const expiredIds = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(OrderEntity);
      const flipped = await repo
        .createQueryBuilder()
        .update()
        .set({ status: OrderStatus.CANCELLED })
        .where('status = :pending', { pending: OrderStatus.PENDING })
        .andWhere('COALESCE(scheduled_for, created_at) < :cutoff', { cutoff })
        // P1/P3/P4: NO barrer un pedido con pago YA PAID (tarjeta autorizada cuyo estado mueve el
        // admin) — auto-cancelarlo sin reembolso sería peor que esperar. SÍ se barre todo lo demás:
        // efectivo abandonado Y tarjeta con pago PENDING (nunca autorizada, o proceso muerto entre
        // Tx1 y la captura) → su reserva DEBE liberarse o se fuga. El discriminador es el ESTADO del
        // pago, NO el método: con pagos simulados un pago PENDING significa "nunca cobrado", así que
        // liberar es seguro (con pasarela real, aquí iría una conciliación previa del intento).
        .andWhere(
          'NOT EXISTS (SELECT 1 FROM payments p WHERE p.order_id = orders.id AND p.status = :paid)',
          { paid: PaymentStatus.PAID },
        )
        .returning(['id'])
        .execute();
      const ids = ((flipped.raw as Array<{ id: string }>) ?? []).map(
        (r) => r.id,
      );
      if (ids.length) {
        const orders = await repo.find({
          where: { id: In(ids) },
          relations: ORDER_RELATIONS,
        });
        // P1 (Plan 08 bug 2): liberar la reserva de cada pedido con applyStock('release') — así una
        // línea de RESCATE vuelve a SU finished_good y no infla products.stock (el byProduct plano
        // anterior ignoraba finishedGoodId → fuga + sobreventa). Una línea fresca vuelve a stock.
        for (const order of orders) {
          await this.applyStock(manager, order, 'release');
        }
        // BR-012: el flip masivo NO pasa por el agregado → se construyen los OrderCancelled y se
        // despachan en ESTA tx (atómico con el cambio de estado y la liberación de stock).
        const events = orders.map(
          (o) =>
            new OrderCancelled(
              OrderId.of(o.id),
              o.orderNumber,
              o.user?.keycloakId ?? '',
              now,
            ),
        );
        await this.events.dispatch(events, manager);
      }
      return ids;
    });
    // Auditoría del vencimiento (barredor del sistema): pending -> cancelled.
    for (const id of expiredIds) {
      this.auditLog.logOrderStateChange(
        id,
        OrderStatus.PENDING,
        OrderStatus.CANCELLED,
        'system',
        'system',
      );
    }
    return expiredIds.length;
  }

  /**
   * D-052/Plan 08: vence las `finished_goods` cuyo `expires_at` ya pasó → registra una MERMA en
   * `stock_movements` (motivo `caducado`) y ELIMINA la fila, todo en una tx. Es lo que hace que el
   * ciclo de reoferta TERMINE (la comida de ayer no se revende para siempre). Junto a los otros
   * barridos, cada minuto. NO toca `products.stock`: el stock ya se consumió al producir la unidad;
   * la pérdida se registra como merma (Plan 04 la usará para el costeo real).
   */
  async expireFinishedGoods(): Promise<number> {
    const now = new Date(); // BR-005: hora del servidor
    return this.dataSource.transaction(async (manager) => {
      const fgRepo = manager.getRepository(FinishedGoodEntity);
      // Claim ATÓMICO: DELETE ... RETURNING (mismo espíritu que el UPDATE...RETURNING de expireOverdue
      // /expireStalePending). Bajo READ COMMITTED, dos barridos solapados no pueden borrar la MISMA fila:
      // el segundo re-evalúa el WHERE y borra 0 → sin doble merma en stock_movements (que no tiene UNIQUE).
      const deleted = await fgRepo
        .createQueryBuilder()
        .delete()
        .where('expires_at < :now', { now })
        .returning(['id', 'qty', 'product_id'])
        .execute();
      const rows =
        (deleted.raw as Array<{
          id: string;
          qty: number;
          product_id: string;
        }>) ?? [];
      if (!rows.length) return 0;
      const movRepo = manager.getRepository(StockMovementEntity);
      const movements = rows
        .filter((r) => r.product_id && r.qty > 0)
        .map((r) =>
          movRepo.create({
            // La finished_good ya se borró en el mismo statement; el movimiento conserva su id suelto.
            product: { id: r.product_id } as ProductEntity,
            qty: r.qty,
            type: StockMovementType.MERMA,
            reason: StockMovementReason.CADUCADO,
            finishedGoodId: r.id,
          }),
        );
      if (movements.length) await movRepo.save(movements);
      // Devuelve UNIDADES mermadas (Σ qty), no filas: el scheduler lo loguea como "N unidad(es)".
      return rows.reduce((sum, r) => sum + (r.qty > 0 ? r.qty : 0), 0);
    });
  }

  // --- Lectura -----------------------------------------------------------------------------

  async findMine(ownerUserId: string): Promise<OrderResponse[]> {
    const profile = await this.profiles.findOne({
      where: { keycloakId: ownerUserId },
    });
    if (!profile) return [];
    const rows = await this.orders.find({
      where: { user: { id: profile.id } },
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return rows.map(toOrderResponse);
  }

  async findAll(branchId?: string): Promise<OrderResponse[]> {
    const rows = await this.orders.find({
      where: branchId ? { branchId } : {},
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
    return rows.map(toOrderResponse);
  }

  async findOneOwned(id: string, ownerUserId: string): Promise<OrderResponse> {
    const profile = await this.profiles.findOne({
      where: { keycloakId: ownerUserId },
    });
    // Sin perfil no puede haber pedido propio: NotFound (no revela existencia, BR-014).
    if (!profile) throw new NotFoundException('Pedido no encontrado');
    return toOrderResponse(await this.loadOwned(id, profile.id));
  }

  /** Carga la fila propia por PK de perfil (uso interno; el efecto y el mapeo van aparte). */
  private async loadOwned(id: string, profileId: string): Promise<OrderEntity> {
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
  private async avgPrepByProduct(
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

  /**
   * Aplica el efecto de stock que decidió el agregado (D-037/D-052/Plan 08). 'release' y 'to_reoffer'
   * DEVUELVEN inventario, pero por TIPO de línea: las de RESCATE (finishedGoodId) vuelven SIEMPRE a su
   * misma `finished_good` (conserva su `expires_at` → sin nuevo bucle); las FRESCAS difieren — 'release'
   * → `products.stock`, 'to_reoffer' (comida hecha no entregada) → nace una `finished_good` nueva.
   */
  private async applyStock(
    manager: EntityManager,
    order: OrderEntity,
    effect: StockEffect,
  ): Promise<void> {
    if (effect === 'reserve') {
      // D-052: la reserva ocurre SOLO en la creación (reserveStockOrThrow). Ninguna transición
      // debe pedir 'reserve'; si llega aquí es una regresión → fallar ruidoso, no fugar stock.
      throw new Error(
        'StockEffect "reserve" inesperado en transición (regresión D-052)',
      );
    }
    if (effect === 'none') return;
    const items = order.items ?? [];
    await this.returnReofferUnits(
      manager,
      items.filter((it) => it.finishedGoodId),
    );
    const fresh = items.filter((it) => !it.finishedGoodId);
    if (effect === 'release') {
      await this.applyStockDelta(manager, fresh);
    } else {
      await this.produceFinishedGoods(manager, order, fresh);
    }
  }

  /**
   * D-052 Plan 08 (bug 2): al cancelar / no recoger una compra de RESCATE, devuelve la qty a SU MISMA
   * `finished_good` (conserva su `expires_at` original → NO reinicia el reloj, el bucle sigue roto).
   * P5: si la unidad ya se mermó (caducó) mientras el pedido la retenía, el UPDATE no afecta filas —
   * la comida ya no existe y NO debe revivir; se registra la MERMA de esa qty retenida para que el
   * ledger de costeo (Plan 04) no la subcuente. Orden estable por finishedGoodId (anti-deadlock).
   */
  private async returnReofferUnits(
    manager: EntityManager,
    items: OrderItemEntity[],
  ): Promise<void> {
    const fgRepo = manager.getRepository(FinishedGoodEntity);
    const movRepo = manager.getRepository(StockMovementEntity);
    const sorted = [...items]
      .filter((it) => it.finishedGoodId && it.quantity > 0)
      .sort((a, b) =>
        (a.finishedGoodId ?? '').localeCompare(b.finishedGoodId ?? ''),
      );
    for (const it of sorted) {
      const r = await fgRepo
        .createQueryBuilder()
        .update()
        .set({ qty: () => '"qty" + :q' })
        .where('id = :id', { id: it.finishedGoodId })
        .setParameter('q', it.quantity)
        .execute();
      if (!r.affected && it.product?.id) {
        // La unidad caducó y ya se barrió mientras el pedido la retenía: no revive → se merma la qty
        // retenida (si no, esa comida perdida no queda en ningún libro, P5).
        await movRepo.save(
          movRepo.create({
            product: { id: it.product.id } as ProductEntity,
            qty: it.quantity,
            type: StockMovementType.MERMA,
            reason: StockMovementReason.CADUCADO,
            finishedGoodId: it.finishedGoodId,
          }),
        );
      }
    }
  }

  /**
   * D-052/Plan 08 ('to_reoffer'): la comida FRESCA se hizo y no se entregó (no recogida o cancelada ya
   * lista) → NACE una `finished_good` por línea (reoferta con caducidad `now + REOFFER_TTL_HOURS`,
   * `reoffer_price` = null hasta que el admin lo ponga). NO toca `products.stock`: el stock ya se
   * consumió al reservar en `place()`; devolverlo como fresco es justo el bucle infinito (bug 1). Al
   * caducar, `expireFinishedGoods` la merma y el ciclo TERMINA. `items` es el SUBCONJUNTO fresco (las
   * líneas de rescate ya volvieron a su unidad en `returnReofferUnits`).
   */
  private async produceFinishedGoods(
    manager: EntityManager,
    order: OrderEntity,
    items: OrderItemEntity[],
  ): Promise<void> {
    const repo = manager.getRepository(FinishedGoodEntity);
    const expiresAt = new Date(Date.now() + REOFFER_TTL_HOURS * 60 * 60 * 1000);
    // Provenance de la pérdida (para el costeo/auditoría de Plan 04): una cancelación ya lista es
    // 'cancelado'; una recogida vencida es 'no_recogido'. Se deriva del estado NUEVO del pedido.
    const source =
      order.status === OrderStatus.CANCELLED
        ? FinishedGoodSource.CANCELADO
        : FinishedGoodSource.NO_RECOGIDO;
    const rows = items
      .filter((it) => it.product?.id && it.quantity > 0)
      .map((it) =>
        repo.create({
          branchId: order.branchId ?? null,
          product: it.product,
          qty: it.quantity,
          isReoffer: true,
          reofferPrice: null,
          source,
          expiresAt,
        }),
      );
    if (rows.length) await repo.save(rows);
  }

  /**
   * DEVUELVE inventario FRESCO al catálogo (release, D-037/D-052): `stock = stock + cantidad`. Lo usan
   * la cancelación desde pending (cliente/admin) y la compensación de pago. La RESERVA ya NO vive aquí:
   * se hace en la creación con `reserveStockOrThrow`. `items` es el subconjunto fresco (sin rescate).
   * Orden estable por productId → dos operaciones concurrentes lockean filas en el MISMO orden (sin deadlock).
   */
  private async applyStockDelta(
    manager: EntityManager,
    items: OrderItemEntity[],
  ): Promise<void> {
    const repo = manager.getRepository(ProductEntity);
    const sorted = [...items].sort((a, b) =>
      (a.product?.id ?? '').localeCompare(b.product?.id ?? ''),
    );
    for (const it of sorted) {
      const productId = it.product?.id;
      if (!productId || it.quantity <= 0) continue;
      await repo
        .createQueryBuilder()
        .update()
        // Bump de `version`: el flujo de stock (QueryBuilder) NO pasa por save(), así que sin
        // esto el @VersionColumn del admin no vería el cambio → lost-update. Al subir version,
        // un edit concurrente del admin (optimistic lock) recibe 409 en vez de pisar.
        .set({ stock: () => '"stock" + :qty', version: () => '"version" + 1' })
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

  private async authorizeCardPayment(amount: number): Promise<PaymentStatus> {
    try {
      return await this.paymentGateway.authorize(amount);
    } catch (e) {
      // Un error que NO es el circuito abierto es inesperado (bug/gateway caído): se loguea
      // antes de re-mapearlo al 400 genérico, para no perder la causa raíz.
      if (!(e instanceof CircuitOpenError)) {
        this.logger.error(
          `Fallo inesperado autorizando pago de ${amount}: ${e instanceof Error ? e.message : String(e)}`,
        );
      }
      throw new BadRequestException(
        e instanceof CircuitOpenError
          ? e.message
          : 'El pago con tarjeta fue rechazado, intenta de nuevo',
      );
    }
  }

  /** Carga un pedido propio resolviendo el perfil desde el keycloak sub (BR-014). */
  private async findOwnedByUser(
    id: string,
    ownerUserId: string,
  ): Promise<OrderEntity> {
    const profile = await this.profiles.findOne({
      where: { keycloakId: ownerUserId },
    });
    // No filtrar por perfil inexistente revelaría pedidos ajenos: tratamos como no encontrado.
    if (!profile) throw new NotFoundException('Pedido no encontrado');
    return this.loadOwned(id, profile.id);
  }

  /**
   * Asegura el `user_profile` del keycloak sub (lo crea si no existe). El registro (auth.service)
   * ya siembra el perfil con el correo real; esta rama es un fallback y, al recibir solo el sub,
   * sintetiza el correo `<sub>@edu.utc.mx` (ponytail: JwtUser vive en presentation, el puerto solo
   * habla el sub — el correo del token no llega aquí; upgrade path si algún día importa el correo real).
   */
  private async ensureProfile(ownerUserId: string): Promise<UserProfileEntity> {
    const existing = await this.profiles.findOne({
      where: { keycloakId: ownerUserId },
    });
    if (existing) return existing;
    const email = `${ownerUserId}@edu.utc.mx`;
    const { firstName, lastName } = deriveName(email);
    try {
      return await this.profiles.save(
        this.profiles.create({
          keycloakId: ownerUserId,
          email,
          firstName,
          lastName,
          role: UserRole.USER,
        }),
      );
    } catch (err) {
      // Carrera (dos pedidos casi simultáneos del mismo usuario nuevo): re-leer.
      const again = await this.profiles.findOne({
        where: { keycloakId: ownerUserId },
      });
      if (again) return again;
      throw err;
    }
  }
}
