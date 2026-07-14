import { AggregateRoot } from '../../../../kernel/domain/AggregateRoot';
import { DomainError } from '../../../../kernel/domain/DomainError';
import { Money } from '../value-objects/money';
import { Quantity } from '../value-objects/quantity';
import { OrderId, ProductId } from '../value-objects/ids';
import {
  OrderAccepted,
  OrderReadied,
  OrderCancelled,
  OrderNotPickedUp,
} from '../events/order-events';

/**
 * Estados del pedido — concepto de DOMINIO (el infra `enums.ts` comparte los mismos
 * valores string; el mapper traduce). Migrar el enum a este archivo y que infra lo
 * importe es un ripple aparte, no de esta migración.
 */
export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  NOT_PICKED_UP = 'not_picked_up',
  CANCELLED = 'cancelled',
  READY_LATER = 'ready_later',
}

/** Efecto que una transición tiene sobre el inventario (D-037/D-052). El agregado decide el
 *  efecto (intención); el adapter ejecuta el SQL sobre las filas de Product.
 *  ⚠️ D-052: 'reserve' YA NO lo emite ninguna transición — la reserva ocurre en la creación
 *  (`place()` → `reserveStockOrThrow`). Las transiciones solo devuelven ('release') o no-op ('none').
 *  Se conserva 'reserve' en el type por simetría del ciclo de vida. */
export type StockEffect = 'reserve' | 'release' | 'none';

/** Línea del pedido con sus VOs de dominio (productId tipado + cantidad validada). */
export interface OrderLine {
  readonly productId: ProductId;
  readonly quantity: Quantity;
}

export interface OrderSnapshot {
  id: OrderId;
  orderNumber: number;
  /** Keycloak sub del DUEÑO — receptor de las notificaciones (BR-014/BR-012). */
  ownerUserId: string;
  status: OrderStatus;
  items: OrderLine[];
  acceptedAt: Date | null;
  readyAt: Date | null;
  pickupDeadline: Date | null;
  pickedUpAt: Date | null;
  scheduledFor: Date | null;
}

/** Ventana de recogida tras marcar "listo" (D-005): 20 min. */
const READY_WINDOW_MS = 20 * 60 * 1000;

/** Política del ADMIN (BR-004). Un estado terminal no tiene salidas. */
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

/** Política del CLIENTE (§3.8/§3.9) — separada a propósito de la del admin.
 *  Cancela antes de prepararse (pending) o ya listo pero no recogido (ready/ready_later,
 *  en cuyo caso el alimento queda para reoferta). NO en preparación ni terminal. */
const CLIENT_CANCELLABLE: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.READY,
  OrderStatus.READY_LATER,
];

/** Anticipación mínima para programar una recogida (30 min, hora del servidor; spec #4). */
const MIN_SCHEDULE_AHEAD_MS = 30 * 60 * 1000;

/** Zona horaria del negocio (la cooperativa). El "día" se evalúa aquí, NO en la TZ del proceso
 *  (un contenedor en UTC evaluaría mal el corte de medianoche). Coherente con el `AT TIME ZONE
 *  'America/Mexico_City'` de las métricas en el adapter. */
const COOP_TZ = 'America/Mexico_City';

/** Día calendario (YYYY-MM-DD) de una fecha EN la zona de la cooperativa. */
function coopDay(d: Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: COOP_TZ }).format(d);
}

/** Snapshot del producto que el adapter trae de la BD para que el dominio decida (BR-015). */
export interface ProductSnapshot {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  /** Precio de reoferta (§3.11 "Pon tu precio"); si está puesto, es el que se cobra. */
  readonly reofferPrice: number | null;
  readonly isAvailable: boolean;
  readonly basePrepTimeSeconds: number;
  /** Unidades disponibles (D-052). `place()` valida cantidad ≤ stock como pre-check amable;
   *  el guardia atómico real es el UPDATE condicional del adapter (`reserveStockOrThrow`). */
  readonly stock: number;
}

/** Línea CRUDA de entrada (viene del DTO ya validado por class-validator). */
export interface RawOrderLine {
  readonly productId: string;
  readonly quantity: number;
}

/** Entrada de creación: el adapter provee productos + promedios; el dominio valida y calcula. */
export interface PlaceOrderInput {
  readonly items: readonly RawOrderLine[];
  readonly products: readonly ProductSnapshot[];
  readonly avgPrepByProductId: Readonly<Record<string, number>>;
  readonly scheduledForRaw?: string | null;
  readonly now: Date;
}

/** Línea ya valorada (VOs de dominio: precio congelado + subtotal + cantidad). El adapter la persiste. */
export interface PlacedLine {
  readonly productId: ProductId;
  readonly quantity: Quantity;
  readonly unitPrice: Money;
  readonly subtotal: Money;
  readonly prepTimeSeconds: number;
}

/** Plan de un pedido nuevo, ya validado y calculado por el dominio. Sin id (lo asigna la BD). */
export interface OrderPlan {
  readonly status: OrderStatus;
  readonly scheduledFor: Date | null;
  readonly total: Money;
  readonly lines: readonly PlacedLine[];
}

/**
 * Agregado Order. Dueño de las REGLAS de transición y de su efecto sobre el stock
 * (la INTENCIÓN). El CÓMO (lock pesimista, transacción, SQL de stock) vive en el adapter.
 * `now` se inyecta (hora del servidor, BR-005) para mantener el dominio determinista.
 *
 * Además EMITE Domain Events (BR-012) en sus transiciones notificables; el adapter los extrae
 * con `pullEvents()` tras persistir y los despacha en la misma tx (bounded context notifications).
 */
export class Order extends AggregateRoot<OrderId> {
  private constructor(
    id: OrderId,
    public readonly orderNumber: number,
    private readonly _ownerUserId: string,
    private _status: OrderStatus,
    public readonly items: readonly OrderLine[],
    private _acceptedAt: Date | null,
    private _readyAt: Date | null,
    private _pickupDeadline: Date | null,
    private _pickedUpAt: Date | null,
    public readonly scheduledFor: Date | null,
  ) {
    super(id);
  }

  /**
   * Factory de creación (BR-015/BR-006/spec #4). Valida disponibilidad, congela el precio
   * del catálogo, calcula subtotales + total con VOs Money/Quantity (centavos exactos, sin
   * float drift), y valida la hora programada — TODO regla de dominio. Devuelve un plan sin
   * id (la BD asigna id/orderNumber; el pago lo autoriza el adapter). Lanza DomainError.
   */
  static place(input: PlaceOrderInput): OrderPlan {
    const byId = new Map(input.products.map((p) => [p.id, p]));
    let total = Money.zero();
    const lines = input.items.map((it) => {
      const product = byId.get(it.productId);
      if (!product) {
        throw new DomainError(`Producto no encontrado: ${it.productId}`);
      }
      if (!product.isAvailable) {
        throw new DomainError(`Producto no disponible: ${product.name}`);
      }
      const quantity = Quantity.of(it.quantity);
      // Pre-check amable (D-052): rechaza NOMBRANDO el producto antes de abrir la tx. El guardia
      // atómico real es el UPDATE condicional del adapter (reserveStockOrThrow): este snapshot se
      // leyó FUERA de la tx y puede quedar rancio si otro pedido corre en paralelo.
      if (quantity.value > product.stock) {
        throw new DomainError(`Solo quedan ${product.stock} de ${product.name}`);
      }
      // §3.11 "Pon tu precio": si el producto está reofertado (reofferPrice puesto) se cobra
      // ese precio menor; si no, el de catálogo. Precio congelado al momento de compra (BR-015).
      const unitPrice = Money.of(product.reofferPrice ?? product.price);
      const subtotal = unitPrice.times(quantity);
      total = total.add(subtotal);
      return {
        productId: ProductId.of(product.id),
        quantity,
        unitPrice,
        subtotal,
        // J5: promedio real si hay muestras suficientes; si no, el tiempo base del producto.
        prepTimeSeconds:
          input.avgPrepByProductId[product.id] ?? product.basePrepTimeSeconds,
      };
    });
    return {
      status: OrderStatus.PENDING,
      scheduledFor: Order.validateSchedule(input.scheduledForRaw, input.now),
      total,
      lines,
    };
  }

  /** Regla de programación (spec #4): ≥30 min de anticipación y mismo día (hora del servidor). */
  private static validateSchedule(
    raw: string | null | undefined,
    now: Date,
  ): Date | null {
    if (!raw) return null;
    const target = new Date(raw);
    if (Number.isNaN(target.getTime())) {
      throw new DomainError('Fecha de recogida inválida');
    }
    if (target.getTime() - now.getTime() < MIN_SCHEDULE_AHEAD_MS) {
      throw new DomainError(
        'La recogida debe programarse con al menos 30 minutos de anticipación',
      );
    }
    // "Mismo día" en la zona de la cooperativa, no en la TZ del proceso (P4: un contenedor
    // en UTC cruzaría mal la medianoche mexicana y aceptaría/rechazaría el día equivocado).
    if (coopDay(target) !== coopDay(now)) {
      throw new DomainError('Solo puedes programar la recogida para hoy');
    }
    return target;
  }

  /** Reconstruye desde persistencia (el mapper la llama; sin eventos de creación). */
  static rehydrate(s: OrderSnapshot): Order {
    return new Order(
      s.id,
      s.orderNumber,
      s.ownerUserId,
      s.status,
      s.items,
      s.acceptedAt,
      s.readyAt,
      s.pickupDeadline,
      s.pickedUpAt,
      s.scheduledFor,
    );
  }

  get status(): OrderStatus {
    return this._status;
  }
  get acceptedAt(): Date | null {
    return this._acceptedAt;
  }
  get readyAt(): Date | null {
    return this._readyAt;
  }
  get pickupDeadline(): Date | null {
    return this._pickupDeadline;
  }
  get pickedUpAt(): Date | null {
    return this._pickedUpAt;
  }

  /**
   * Transición del ADMIN (BR-004): valida contra ALLOWED_TRANSITIONS, fija timestamps,
   * EMITE el evento notificable (BR-012) y devuelve el efecto de stock. Idempotente:
   * mismo estado → no-op ('none', sin evento).
   */
  applyAdminTransition(target: OrderStatus, now: Date): StockEffect {
    if (this._status === target) return 'none'; // idempotente
    const allowed = ALLOWED_TRANSITIONS[this._status] ?? [];
    if (!allowed.includes(target)) {
      throw new DomainError(
        `Transición no permitida: ${this._status} → ${target}`,
      );
    }
    this._status = target;
    this.recordEventFor(target, now);
    switch (target) {
      case OrderStatus.PREPARING:
        this._acceptedAt = now;
        // D-052: el stock YA se reservó en place(); reservar aquí sería DOBLE reserva.
        return 'none';
      case OrderStatus.READY:
        this._readyAt = now;
        this._pickupDeadline = new Date(now.getTime() + READY_WINDOW_MS);
        return 'none';
      case OrderStatus.PICKED_UP:
        this._pickedUpAt = now;
        return 'none'; // la reserva se vuelve consumo permanente: NO se libera
      case OrderStatus.NOT_PICKED_UP:
        return 'release'; // el excedente vuelve al stock (Plan 08 lo mandará a finished_goods)
      case OrderStatus.CANCELLED:
        // D-052: el pending cancelado por el admin TENÍA reserva desde place() → liberar, o fuga.
        return 'release';
      default:
        return 'none'; // ready_later: la reserva continúa (la comida sigue prometida)
    }
  }

  /** Cancelación del CLIENTE (§3.8/§3.9). Libera SIEMPRE: con reserva-en-place (D-052) los tres
   *  estados cancelables (pending/ready/ready_later) retienen stock desde que se pidió. Emite evento. */
  cancelByOwner(now: Date): StockEffect {
    if (!CLIENT_CANCELLABLE.includes(this._status)) {
      throw new DomainError(
        'Solo puedes cancelar un pedido pendiente o uno listo que aún no recogiste',
      );
    }
    this._status = OrderStatus.CANCELLED;
    this.record(
      new OrderCancelled(this.id, this.orderNumber, this._ownerUserId, now),
    );
    return 'release';
  }

  /** Extender un pedido listo para recogerlo después (§3.10: ready → ready_later). Sin notificación (BR-012). */
  extendByOwner(): StockEffect {
    if (this._status !== OrderStatus.READY) {
      throw new DomainError(
        'Solo puedes extender un pedido que está listo para recoger',
      );
    }
    this._status = OrderStatus.READY_LATER;
    return 'none';
  }

  /**
   * Mapea el estado destino al Domain Event notificable (BR-012). picked_up / ready_later
   * NO notifican → sin evento. Se llama YA con el estado nuevo aplicado.
   */
  private recordEventFor(target: OrderStatus, now: Date): void {
    switch (target) {
      case OrderStatus.PREPARING:
        this.record(
          new OrderAccepted(this.id, this.orderNumber, this._ownerUserId, now),
        );
        break;
      case OrderStatus.READY:
        this.record(
          new OrderReadied(this.id, this.orderNumber, this._ownerUserId, now),
        );
        break;
      case OrderStatus.NOT_PICKED_UP:
        this.record(
          new OrderNotPickedUp(
            this.id,
            this.orderNumber,
            this._ownerUserId,
            now,
          ),
        );
        break;
      case OrderStatus.CANCELLED:
        this.record(
          new OrderCancelled(this.id, this.orderNumber, this._ownerUserId, now),
        );
        break;
      default:
        break; // picked_up / ready_later → sin notificación
    }
  }
}
