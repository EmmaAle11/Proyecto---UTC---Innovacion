import { DomainError } from '../../../../kernel/domain/DomainError';
import {
  Order,
  OrderStatus,
  OrderSnapshot,
} from '../../domain/entities/Order';

const NOW = new Date('2026-07-08T12:00:00.000Z');

function make(status: OrderStatus, over: Partial<OrderSnapshot> = {}): Order {
  return Order.rehydrate({
    id: 'o1',
    orderNumber: 42,
    status,
    items: [{ productId: 'p1', quantity: 2 }],
    acceptedAt: null,
    readyAt: null,
    pickupDeadline: null,
    pickedUpAt: null,
    scheduledFor: null,
    ...over,
  });
}

describe('Order.cancelByOwner (§3.8/§3.9)', () => {
  it('cancela un PENDING → cancelled, sin liberar stock', () => {
    const o = make(OrderStatus.PENDING);
    expect(o.cancelByOwner()).toBe('none');
    expect(o.status).toBe(OrderStatus.CANCELLED);
  });

  it('cancela un READY → cancelled y LIBERA stock (excedente reofertable, D-037)', () => {
    const o = make(OrderStatus.READY);
    expect(o.cancelByOwner()).toBe('release');
    expect(o.status).toBe(OrderStatus.CANCELLED);
  });

  it('cancela un READY_LATER → release', () => {
    expect(make(OrderStatus.READY_LATER).cancelByOwner()).toBe('release');
  });

  it('RECHAZA cancelar en PREPARING (no cancelable) y no muta', () => {
    const o = make(OrderStatus.PREPARING);
    expect(() => o.cancelByOwner()).toThrow(DomainError);
    expect(o.status).toBe(OrderStatus.PREPARING);
  });

  it('RECHAZA cancelar un terminal (picked_up)', () => {
    expect(() => make(OrderStatus.PICKED_UP).cancelByOwner()).toThrow(
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
  it('PENDING → PREPARING: reserva stock y fija acceptedAt', () => {
    const o = make(OrderStatus.PENDING);
    expect(o.applyAdminTransition(OrderStatus.PREPARING, NOW)).toBe('reserve');
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

  it('READY → NOT_PICKED_UP: libera stock (D-037)', () => {
    expect(
      make(OrderStatus.READY).applyAdminTransition(
        OrderStatus.NOT_PICKED_UP,
        NOW,
      ),
    ).toBe('release');
  });

  it('PENDING → CANCELLED (admin): sin efecto de stock (nunca reservó)', () => {
    expect(
      make(OrderStatus.PENDING).applyAdminTransition(
        OrderStatus.CANCELLED,
        NOW,
      ),
    ).toBe('none');
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
