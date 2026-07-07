import { DomainError } from '../../../../kernel/domain/DomainError';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderCancelled } from '../../domain/events/OrderCancelled';

describe('Order.cancelByOwner (spike vertical slice)', () => {
  const make = (status: OrderStatus) =>
    Order.rehydrate({ id: 'o1', orderNumber: 42, status });

  it('cancela un pedido PENDING y registra OrderCancelled', () => {
    const order = make(OrderStatus.PENDING);

    order.cancelByOwner();

    expect(order.status).toBe(OrderStatus.CANCELLED);
    const events = order.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OrderCancelled);
    expect((events[0] as OrderCancelled).orderId).toBe('o1');
  });

  it('rechaza cancelar si NO está PENDING y no muta el estado', () => {
    const order = make(OrderStatus.READY);

    expect(() => order.cancelByOwner()).toThrow(DomainError);
    expect(order.status).toBe(OrderStatus.READY);
    expect(order.pullEvents()).toHaveLength(0);
  });
});
