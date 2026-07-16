import { DomainError } from '../../../../kernel/domain/DomainError';
import { Order, OrderStatus, OrderSnapshot } from '../../domain/entities/Order';
import { OrderId, ProductId } from '../../domain/value-objects/ids';
import { Quantity } from '../../domain/value-objects/quantity';
import {
  OrderAccepted,
  OrderReadied,
  OrderCancelled,
  OrderNotPickedUp,
} from '../../domain/events/order-events';

const NOW = new Date('2026-07-08T12:00:00.000Z');
const OWNER = 'owner-sub-1';

function make(status: OrderStatus, over: Partial<OrderSnapshot> = {}): Order {
  return Order.rehydrate({
    id: OrderId.of('o1'),
    orderNumber: 42,
    ownerUserId: OWNER,
    status,
    items: [{ productId: ProductId.of('p1'), quantity: Quantity.of(2) }],
    acceptedAt: null,
    readyAt: null,
    pickupDeadline: null,
    pickedUpAt: null,
    scheduledFor: null,
    ...over,
  });
}

describe('Order.cancelByOwner (§3.8/§3.9)', () => {
  it('cancela un PENDING → cancelled y LIBERA la reserva (reservó en place, D-052)', () => {
    const o = make(OrderStatus.PENDING);
    expect(o.cancelByOwner(NOW)).toBe('release');
    expect(o.status).toBe(OrderStatus.CANCELLED);
  });

  it('cancela un READY → cancelled y la comida hecha va A REOFERTA (to_reoffer, D-052 Plan 08)', () => {
    const o = make(OrderStatus.READY);
    expect(o.cancelByOwner(NOW)).toBe('to_reoffer');
    expect(o.status).toBe(OrderStatus.CANCELLED);
  });

  it('cancela un READY_LATER → to_reoffer (la comida ya estaba hecha)', () => {
    expect(make(OrderStatus.READY_LATER).cancelByOwner(NOW)).toBe('to_reoffer');
  });

  it('RECHAZA cancelar en PREPARING (no cancelable) y no muta', () => {
    const o = make(OrderStatus.PREPARING);
    expect(() => o.cancelByOwner(NOW)).toThrow(DomainError);
    expect(o.status).toBe(OrderStatus.PREPARING);
  });

  it('RECHAZA cancelar un terminal (picked_up)', () => {
    expect(() => make(OrderStatus.PICKED_UP).cancelByOwner(NOW)).toThrow(
      DomainError,
    );
  });
});

describe('Order.extendByOwner (§3.10)', () => {
  it('extiende un READY → ready_later, sin efecto de stock', () => {
    const o = make(OrderStatus.READY);
    expect(o.extendByOwner()).toBe('none');
    expect(o.status).toBe(OrderStatus.READY_LATER);
  });

  it('RECHAZA extender si no está READY', () => {
    const o = make(OrderStatus.PENDING);
    expect(() => o.extendByOwner()).toThrow(DomainError);
    expect(o.status).toBe(OrderStatus.PENDING);
  });
});

describe('Order.applyAdminTransition (BR-004)', () => {
  it('PENDING → PREPARING: NO reserva (ya se reservó en place, D-052) y fija acceptedAt', () => {
    const o = make(OrderStatus.PENDING);
    expect(o.applyAdminTransition(OrderStatus.PREPARING, NOW)).toBe('none');
    expect(o.status).toBe(OrderStatus.PREPARING);
    expect(o.acceptedAt).toEqual(NOW);
  });

  it('PREPARING → READY: fija readyAt y pickupDeadline (+20 min), sin stock', () => {
    const o = make(OrderStatus.PREPARING);
    expect(o.applyAdminTransition(OrderStatus.READY, NOW)).toBe('none');
    expect(o.readyAt).toEqual(NOW);
    expect(o.pickupDeadline).toEqual(new Date(NOW.getTime() + 20 * 60 * 1000));
  });

  it('READY → PICKED_UP: fija pickedUpAt', () => {
    const o = make(OrderStatus.READY);
    expect(o.applyAdminTransition(OrderStatus.PICKED_UP, NOW)).toBe('none');
    expect(o.pickedUpAt).toEqual(NOW);
  });

  it('READY → NOT_PICKED_UP: la comida hecha va A REOFERTA (to_reoffer, D-052 Plan 08)', () => {
    expect(
      make(OrderStatus.READY).applyAdminTransition(
        OrderStatus.NOT_PICKED_UP,
        NOW,
      ),
    ).toBe('to_reoffer');
  });

  it('PENDING → CANCELLED (admin): LIBERA la reserva (el pending reservó en place, D-052)', () => {
    expect(
      make(OrderStatus.PENDING).applyAdminTransition(
        OrderStatus.CANCELLED,
        NOW,
      ),
    ).toBe('release');
  });

  it('idempotente: mismo estado → none, sin cambios', () => {
    const o = make(OrderStatus.READY);
    expect(o.applyAdminTransition(OrderStatus.READY, NOW)).toBe('none');
    expect(o.status).toBe(OrderStatus.READY);
  });

  it('RECHAZA transición inválida (PENDING → READY)', () => {
    const o = make(OrderStatus.PENDING);
    expect(() => o.applyAdminTransition(OrderStatus.READY, NOW)).toThrow(
      DomainError,
    );
    expect(o.status).toBe(OrderStatus.PENDING);
  });
});

describe('Order Domain Events (BR-012)', () => {
  it('PENDING → PREPARING emite OrderAccepted (con receptor y hora)', () => {
    const o = make(OrderStatus.PENDING);
    o.applyAdminTransition(OrderStatus.PREPARING, NOW);
    const events = o.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OrderAccepted);
    expect(events[0].occurredAt).toEqual(NOW);
    const accepted = events[0] as OrderAccepted;
    expect(accepted.recipientUserId).toBe(OWNER);
    expect(accepted.orderNumber).toBe(42);
    expect(accepted.eventType).toBe('order.accepted');
  });

  it('PREPARING → READY emite OrderReadied', () => {
    const o = make(OrderStatus.PREPARING);
    o.applyAdminTransition(OrderStatus.READY, NOW);
    expect(o.pullEvents()[0]).toBeInstanceOf(OrderReadied);
  });

  it('READY → NOT_PICKED_UP emite OrderNotPickedUp', () => {
    const o = make(OrderStatus.READY);
    o.applyAdminTransition(OrderStatus.NOT_PICKED_UP, NOW);
    expect(o.pullEvents()[0]).toBeInstanceOf(OrderNotPickedUp);
  });

  it('cancelByOwner emite OrderCancelled', () => {
    const o = make(OrderStatus.PENDING);
    o.cancelByOwner(NOW);
    expect(o.pullEvents()[0]).toBeInstanceOf(OrderCancelled);
  });

  it('READY → PICKED_UP y READY → READY_LATER NO emiten (BR-012)', () => {
    const pickedUp = make(OrderStatus.READY);
    pickedUp.applyAdminTransition(OrderStatus.PICKED_UP, NOW);
    expect(pickedUp.pullEvents()).toHaveLength(0);

    const later = make(OrderStatus.READY);
    later.applyAdminTransition(OrderStatus.READY_LATER, NOW);
    expect(later.pullEvents()).toHaveLength(0);
  });

  it('pullEvents es idempotente: la 2ª llamada da []', () => {
    const o = make(OrderStatus.PENDING);
    o.applyAdminTransition(OrderStatus.PREPARING, NOW);
    o.pullEvents();
    expect(o.pullEvents()).toHaveLength(0);
  });
});
