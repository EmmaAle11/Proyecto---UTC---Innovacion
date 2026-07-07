import { AggregateRoot } from '../../../../kernel/domain/AggregateRoot';
import { DomainError } from '../../../../kernel/domain/DomainError';
import { OrderCancelled } from '../events/OrderCancelled';

/**
 * Estados del pedido — concepto de DOMINIO (el infra `enums.ts` comparte los
 * mismos valores string; el mapper traduce). Migrar el enum a este archivo y
 * que infra lo importe es trabajo del turno completo, no del spike.
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

export interface OrderSnapshot {
  id: string;
  orderNumber: number;
  status: OrderStatus;
}

/**
 * Agregado Order. El spike sólo modela la regla de `cancelByOwner`; el resto de
 * transiciones (aceptar/entregar/vencer + stock) se migran en Semana 1 completa.
 */
export class Order extends AggregateRoot<string> {
  private constructor(
    id: string,
    public readonly orderNumber: number,
    private _status: OrderStatus,
  ) {
    super(id);
  }

  /** Reconstruye desde persistencia (sin disparar eventos ni validaciones de creación). */
  static rehydrate(snapshot: OrderSnapshot): Order {
    return new Order(snapshot.id, snapshot.orderNumber, snapshot.status);
  }

  get status(): OrderStatus {
    return this._status;
  }

  /** Regla de negocio: el dueño sólo puede cancelar un pedido PENDING. */
  cancelByOwner(): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new DomainError('Solo puedes cancelar pedidos pendientes');
    }
    this._status = OrderStatus.CANCELLED;
    this.record(new OrderCancelled(this.id));
  }
}
