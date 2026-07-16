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
        products: [
          snap({ id: 'p1', price: 38 }),
          snap({ id: 'p2', price: 65 }),
        ],
      }),
    );
    expect(plan.status).toBe(OrderStatus.PENDING);
    expect(plan.lines[0].unitPrice.amount).toBe(38);
    expect(plan.lines[0].subtotal.amount).toBe(76);
    expect(plan.lines[1].unitPrice.amount).toBe(65);
    expect(plan.lines[1].subtotal.amount).toBe(65);
    expect(plan.total.amount).toBe(141); // 38*2 + 65*1
  });

  it('§3.11 (bug 2): una línea de RESCATE cobra el precio DE LA UNIDAD, no el del producto', () => {
    const plan = Order.place(
      input({
        items: [{ productId: 'p1', quantity: 2, finishedGoodId: 'fg1' }],
        products: [snap({ price: 38 })],
        reofferUnits: [
          { id: 'fg1', productId: 'p1', reofferPrice: 20, qty: 5 },
        ],
      }),
    );
    expect(plan.lines[0].unitPrice.amount).toBe(20); // 20 * 2, precio de la unidad
    expect(plan.lines[0].subtotal.amount).toBe(40);
    expect(plan.lines[0].finishedGoodId).toBe('fg1');
  });

  it('bug 2: una línea FRESCA NO se descuenta aunque exista una reoferta del producto', () => {
    // Antes `product.reofferPrice` contaminaba TODA venta; ahora la reoferta es de la unidad.
    const plan = Order.place(
      input({
        items: [{ productId: 'p1', quantity: 1 }], // sin finishedGoodId = fresca
        products: [snap({ price: 38 })],
        reofferUnits: [
          { id: 'fg1', productId: 'p1', reofferPrice: 20, qty: 5 },
        ],
      }),
    );
    expect(plan.lines[0].unitPrice.amount).toBe(38); // precio de catálogo, NO 20
    expect(plan.lines[0].finishedGoodId).toBeNull();
  });

  it('bug 2: rescate de una unidad SIN precio de reoferta → DomainError', () => {
    expect(() =>
      Order.place(
        input({
          items: [{ productId: 'p1', quantity: 1, finishedGoodId: 'fg1' }],
          reofferUnits: [
            { id: 'fg1', productId: 'p1', reofferPrice: null, qty: 5 },
          ],
        }),
      ),
    ).toThrow(DomainError);
  });

  it('bug 2: rescate de una unidad inexistente / de otro producto → DomainError', () => {
    expect(() =>
      Order.place(
        input({
          items: [{ productId: 'p1', quantity: 1, finishedGoodId: 'fantasma' }],
          reofferUnits: [],
        }),
      ),
    ).toThrow(DomainError);
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

  // P4#6: el AGOTADO ya NO es regla de dominio (se validaba sobre un snapshot rancio). El único
  // gate de inventario es el UPDATE atómico del adapter (reserveStockOrThrow → 409). Por eso
  // Order.place ya no rechaza por cantidad > stock: ese caso se prueba en orders.service.spec.

  it('J5: usa el promedio real si hay muestras; si no, el tiempo base', () => {
    const conAvg = Order.place(input({ avgPrepByProductId: { p1: 420 } }));
    expect(conAvg.lines[0].prepTimeSeconds).toBe(420);
    const sinAvg = Order.place(input());
    expect(sinAvg.lines[0].prepTimeSeconds).toBe(600); // base
  });

  it('horario: null = inmediato', () => {
    expect(
      Order.place(input({ scheduledForRaw: null })).scheduledFor,
    ).toBeNull();
  });

  it('horario: rechaza < 30 min de anticipación', () => {
    const en10min = new Date(NOW.getTime() + 10 * 60 * 1000).toISOString();
    expect(() => Order.place(input({ scheduledForRaw: en10min }))).toThrow(
      DomainError,
    );
  });

  it('horario: rechaza otro día', () => {
    const manana = new Date(NOW.getTime() + 26 * 60 * 60 * 1000).toISOString();
    expect(() => Order.place(input({ scheduledForRaw: manana }))).toThrow(
      DomainError,
    );
  });

  it('horario: acepta ≥30 min el mismo día', () => {
    const en45min = new Date(NOW.getTime() + 45 * 60 * 1000).toISOString();
    const plan = Order.place(input({ scheduledForRaw: en45min }));
    expect(plan.scheduledFor).toEqual(new Date(en45min));
  });

  // P4 (D-044/D-045 audit): el "mismo día" se evalúa en America/Mexico_City, NO en la TZ del
  // proceso. Estas fechas cruzan la medianoche UTC pero son el MISMO día mexicano (y viceversa),
  // así que el resultado es correcto en cualquier host (Intl con timeZone explícito).
  it('horario: acepta recogida por la tarde-noche aunque cruce la medianoche UTC (mismo día MX)', () => {
    const nowMxEvening = new Date('2026-07-09T23:40:00Z'); // 17:40 en MX (UTC-6), 9 jul
    const target = '2026-07-10T00:20:00Z'; // 18:20 en MX, mismo día MX (9 jul), +40 min
    const plan = Order.place(
      input({ now: nowMxEvening, scheduledForRaw: target }),
    );
    expect(plan.scheduledFor).toEqual(new Date(target));
  });

  it('horario: rechaza recogida que ya es el día MX siguiente (aunque falten horas)', () => {
    const nowMxEvening = new Date('2026-07-09T23:40:00Z'); // 17:40 MX, 9 jul
    const target = '2026-07-10T06:30:00Z'; // 00:30 MX, 10 jul → otro día MX
    expect(() =>
      Order.place(input({ now: nowMxEvening, scheduledForRaw: target })),
    ).toThrow(DomainError);
  });
});
