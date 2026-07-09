import { DomainError } from '../../../../kernel/domain/DomainError';
import {
  Order,
  OrderStatus,
  PlaceOrderInput,
  ProductSnapshot,
} from '../../domain/entities/Order';

const NOW = new Date('2026-07-09T12:00:00.000Z');

function snap(over: Partial<ProductSnapshot> = {}): ProductSnapshot {
  return {
    id: 'p1',
    name: 'Torta',
    price: 38,
    isAvailable: true,
    basePrepTimeSeconds: 600,
    ...over,
  };
}

function input(over: Partial<PlaceOrderInput> = {}): PlaceOrderInput {
  return {
    items: [{ productId: 'p1', quantity: 2 }],
    products: [snap()],
    avgPrepByProductId: {},
    scheduledForRaw: null,
    now: NOW,
    ...over,
  };
}

describe('Order.place (BR-015 / spec #4)', () => {
  it('congela precio del catálogo y calcula subtotal + total (ignora precio del cliente)', () => {
    const plan = Order.place(
      input({
        items: [
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 1 },
        ],
        products: [snap({ id: 'p1', price: 38 }), snap({ id: 'p2', price: 65 })],
      }),
    );
    expect(plan.status).toBe(OrderStatus.PENDING);
    expect(plan.lines[0]).toMatchObject({ unitPrice: 38, subtotal: 76 });
    expect(plan.lines[1]).toMatchObject({ unitPrice: 65, subtotal: 65 });
    expect(plan.total).toBe(141); // 38*2 + 65*1
  });

  it('rechaza producto inexistente', () => {
    expect(() =>
      Order.place(input({ items: [{ productId: 'fantasma', quantity: 1 }] })),
    ).toThrow(DomainError);
  });

  it('rechaza producto no disponible', () => {
    expect(() =>
      Order.place(input({ products: [snap({ isAvailable: false })] })),
    ).toThrow(DomainError);
  });

  it('J5: usa el promedio real si hay muestras; si no, el tiempo base', () => {
    const conAvg = Order.place(input({ avgPrepByProductId: { p1: 420 } }));
    expect(conAvg.lines[0].prepTimeSeconds).toBe(420);
    const sinAvg = Order.place(input());
    expect(sinAvg.lines[0].prepTimeSeconds).toBe(600); // base
  });

  it('horario: null = inmediato', () => {
    expect(Order.place(input({ scheduledForRaw: null })).scheduledFor).toBeNull();
  });

  it('horario: rechaza < 30 min de anticipación', () => {
    const en10min = new Date(NOW.getTime() + 10 * 60 * 1000).toISOString();
    expect(() =>
      Order.place(input({ scheduledForRaw: en10min })),
    ).toThrow(DomainError);
  });

  it('horario: rechaza otro día', () => {
    const manana = new Date(NOW.getTime() + 26 * 60 * 60 * 1000).toISOString();
    expect(() =>
      Order.place(input({ scheduledForRaw: manana })),
    ).toThrow(DomainError);
  });

  it('horario: acepta ≥30 min el mismo día', () => {
    const en45min = new Date(NOW.getTime() + 45 * 60 * 1000).toISOString();
    const plan = Order.place(input({ scheduledForRaw: en45min }));
    expect(plan.scheduledFor).toEqual(new Date(en45min));
  });
});
