import { AggregateRoot } from '../../../../kernel/domain/AggregateRoot';
import { DomainError } from '../../../../kernel/domain/DomainError';

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

/** Efecto que una transición tiene sobre el inventario (D-037). El agregado decide el
 *  efecto (intención); el adapter ejecuta el SQL sobre las filas de Product. */
export type StockEffect = 'reserve' | 'release' | 'none';

/** Línea del pedido — lo mínimo que las reglas de stock necesitan (productId + cantidad). */
export interface OrderLine {
  readonly productId: string;
  readonly quantity: number;
}

export interface OrderSnapshot {
  id: string;
  orderNumber: number;
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

/** Snapshot del producto que el adapter trae de la BD para que el dominio decida (BR-015). */
export interface ProductSnapshot {
  readonly id: string;
  readonly name: string;
  readonly price: number;
  /** Precio de reoferta (§3.11 "Pon tu precio"); si está puesto, es el que se cobra. */
  readonly reofferPrice: number | null;
  readonly isAvailable: boolean;
  readonly basePrepTimeSeconds: number;
}

/** Entrada de creación: el adapter provee productos + promedios; el dominio valida y calcula. */
export interface PlaceOrderInput {
  readonly items: readonly OrderLine[];
  readonly products: readonly ProductSnapshot[];
  readonly avgPrepByProductId: Readonly<Record<string, number>>;
  readonly scheduledForRaw?: string | null;
  readonly now: Date;
}

/** Línea ya valorada (precio congelado + subtotal + tiempo de prep). El adapter la persiste. */
export interface PlacedLine {
  readonly productId: string;
  readonly quantity: number;
  readonly unitPrice: number;
  readonly subtotal: number;
  readonly prepTimeSeconds: number;
}

/** Plan de un pedido nuevo, ya validado y calculado por el dominio. Sin id (lo asigna la BD). */
export interface OrderPlan {
  readonly status: OrderStatus;
  readonly scheduledFor: Date | null;
  readonly total: number;
  readonly lines: readonly PlacedLine[];
}

/**
 * Agregado Order. Dueño de las REGLAS de transición y de su efecto sobre el stock
 * (la INTENCIÓN). El CÓMO (lock pesimista, transacción, SQL de stock) vive en el adapter.
 * `now` se inyecta (hora del servidor, BR-005) para mantener el dominio determinista.
 */
export class Order extends AggregateRoot<string> {
  private constructor(
    id: string,
    public readonly orderNumber: number,
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
   * del catálogo, calcula subtotales + total, y valida la hora programada — TODO regla de
   * dominio. Devuelve un plan sin id (la BD asigna id/orderNumber; el pago lo autoriza el
   * adapter). Lanza DomainError; la presentación lo mapea a 400 (D-039).
   */
  static place(input: PlaceOrderInput): OrderPlan {
    const byId = new Map(input.products.map((p) => [p.id, p]));
    let total = 0;
    const lines = input.items.map((it) => {
      const product = byId.get(it.productId);
      if (!product) {
        throw new DomainError(`Producto no encontrado: ${it.productId}`);
      }
      if (!product.isAvailable) {
        throw new DomainError(`Producto no disponible: ${product.name}`);
      }
      // §3.11 "Pon tu precio": si el producto está reofertado (reofferPrice puesto) se cobra
      // ese precio menor; si no, el de catálogo. Precio congelado al momento de compra (BR-015).
      const unitPrice = product.reofferPrice ?? product.price;
      const subtotal = Math.round(unitPrice * it.quantity * 100) / 100;
      total += subtotal;
      return {
        productId: product.id,
        quantity: it.quantity,
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
      total: Math.round(total * 100) / 100,
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
    if (
      target.getFullYear() !== now.getFullYear() ||
      target.getMonth() !== now.getMonth() ||
      target.getDate() !== now.getDate()
    ) {
      throw new DomainError('Solo puedes programar la recogida para hoy');
    }
    return target;
  }

  /** Reconstruye desde persistencia (el mapper la llama; sin eventos de creación). */
  static rehydrate(s: OrderSnapshot): Order {
    return new Order(
      s.id,
      s.orderNumber,
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
   * Transición del ADMIN (BR-004): valida contra ALLOWED_TRANSITIONS, fija timestamps y
   * devuelve el efecto de stock. Idempotente: mismo estado → no-op ('none').
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
    switch (target) {
      case OrderStatus.PREPARING:
        this._acceptedAt = now;
        return 'reserve'; // D-037: aparta del almacén
      case OrderStatus.READY:
        this._readyAt = now;
        this._pickupDeadline = new Date(now.getTime() + READY_WINDOW_MS);
        return 'none';
      case OrderStatus.PICKED_UP:
        this._pickedUpAt = now;
        return 'none';
      case OrderStatus.NOT_PICKED_UP:
        return 'release'; // D-037: excedente reofertable
      default:
        return 'none'; // ready_later / cancelled (pending nunca reservó)
    }
  }

  /** Cancelación del CLIENTE (§3.8/§3.9). Libera stock solo si ya estaba preparado. */
  cancelByOwner(): StockEffect {
    if (!CLIENT_CANCELLABLE.includes(this._status)) {
      throw new DomainError(
        'Solo puedes cancelar un pedido pendiente o uno listo que aún no recogiste',
      );
    }
    const wasPrepared =
      this._status === OrderStatus.READY ||
      this._status === OrderStatus.READY_LATER;
    this._status = OrderStatus.CANCELLED;
    return wasPrepared ? 'release' : 'none';
  }

  /** Extender un pedido listo para recogerlo después (§3.10: ready → ready_later). */
  extendByOwner(): StockEffect {
    if (this._status !== OrderStatus.READY) {
      throw new DomainError(
        'Solo puedes extender un pedido que está listo para recoger',
      );
    }
    this._status = OrderStatus.READY_LATER;
    return 'none';
  }
}
