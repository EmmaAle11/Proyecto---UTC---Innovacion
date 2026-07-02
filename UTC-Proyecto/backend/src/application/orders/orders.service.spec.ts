import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
import { PaymentGatewayService } from '../payments/payment-gateway.service';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../../infrastructure/database/entities/enums';
import type { JwtUser } from '../../infrastructure/auth/jwt.strategy';

const USER: JwtUser = { sub: 'kc-1', email: 'ana@edu.utc.mx', roles: ['user'] };
const PROFILE = {
  id: 'prof-1',
  keycloakId: 'kc-1',
  email: USER.email,
  firstName: 'Ana',
  lastName: '',
};

interface AnyProduct {
  id: string;
  name: string;
  price: string;
  isAvailable: boolean;
  basePrepTimeSeconds: number;
}
function product(
  id: string,
  price: string,
  over: Partial<AnyProduct> = {},
): AnyProduct {
  return {
    id,
    name: `P-${id}`,
    price,
    isAvailable: true,
    basePrepTimeSeconds: 600,
    ...over,
  };
}

/** Arma el servicio con un `DataSource` falso (repos en memoria) para no tocar Postgres. */
function buildService(opts: {
  profile?: unknown;
  products?: AnyProduct[];
  order?: unknown;
  queueCount?: number;
  prepAverages?: { productId: string; avg: number }[];
  thresholds?: { congestionYellow: number; congestionRed: number };
  gatewayAuthorize?: jest.Mock;
}) {
  const orderSave = jest.fn((o: unknown) =>
    Promise.resolve({ ...(o as object), id: 'order-1' }),
  );
  const itemSave = jest.fn((x: unknown) => Promise.resolve(x));
  const paymentSave = jest.fn((p: unknown) => Promise.resolve(p));
  const prepSave = jest.fn((x: unknown) => Promise.resolve(x));
  // Captura las condiciones `andWhere` del QueryBuilder de congestion (para asertar el filtro).
  const congestionWhere: string[] = [];
  const repos: Record<string, unknown> = {
    UserProfileEntity: {
      findOne: jest.fn().mockResolvedValue(opts.profile ?? null),
      create: jest.fn((x: unknown) => x),
      save: jest.fn((x: unknown) =>
        Promise.resolve({ id: 'prof-1', ...(x as object) }),
      ),
    },
    ProductEntity: {
      findBy: jest.fn().mockResolvedValue(opts.products ?? []),
    },
    OrderEntity: {
      create: jest.fn((x: unknown) => x),
      save: orderSave,
      count: jest.fn().mockResolvedValue(opts.queueCount ?? 0),
      createQueryBuilder: jest.fn(() => {
        const qb: {
          where: jest.Mock;
          andWhere: jest.Mock;
          getCount: jest.Mock;
        } = {
          where: jest.fn(() => qb),
          andWhere: jest.fn((sql: string) => {
            congestionWhere.push(sql);
            return qb;
          }),
          getCount: jest.fn().mockResolvedValue(opts.queueCount ?? 0),
        };
        return qb;
      }),
      findOne: jest.fn().mockResolvedValue(
        opts.order ?? {
          id: 'order-1',
          orderNumber: 1,
          status: 'pending',
          totalAmount: '168.00',
          items: [],
          payment: null,
          user: opts.profile,
          createdAt: new Date(),
          readyAt: null,
        },
      ),
    },
    OrderItemEntity: { create: jest.fn((x: unknown) => x), save: itemSave },
    PaymentEntity: { create: jest.fn((x: unknown) => x), save: paymentSave },
    PreparationTimeEntity: {
      create: jest.fn((x: unknown) => x),
      save: prepSave,
    },
    // G2: umbrales del semáforo (fila única). Defaults 5/10 para el test de congestión.
    AppSettingsEntity: {
      findOne: jest.fn().mockResolvedValue(
        opts.thresholds ?? { congestionYellow: 5, congestionRed: 10 },
      ),
    },
  };
  const getRepository = (e: { name: string }) => repos[e.name];
  // J5: promedio de prep times. Por defecto sin muestras → create usa el tiempo base.
  const query = jest.fn().mockResolvedValue(opts.prepAverages ?? []);
  const dataSource = {
    getRepository,
    query,
    transaction: (
      cb: (m: { getRepository: typeof getRepository }) => unknown,
    ) => cb({ getRepository }),
  } as unknown as DataSource;
  // C4: pasarela de pago simulada. Por defecto aprueba (paid); un test puede
  // inyectar `gatewayAuthorize` para simular rechazo/circuito abierto.
  const authorize =
    opts.gatewayAuthorize ?? jest.fn().mockResolvedValue(PaymentStatus.PAID);
  const paymentGateway = { authorize } as unknown as PaymentGatewayService;
  return {
    service: new OrdersService(dataSource, paymentGateway),
    orderSave,
    itemSave,
    paymentSave,
    prepSave,
    congestionWhere,
  };
}

describe('OrdersService.create', () => {
  it('calcula el total en el servidor (snapshot de precio), ignora cualquier precio del cliente', async () => {
    const { service, orderSave, itemSave, paymentSave } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00'), product('p2', '65.00')],
    });
    await service.create(
      {
        items: [
          { productId: 'p1', quantity: 1 },
          { productId: 'p2', quantity: 2 },
        ],
        payMethod: PaymentMethod.TDC,
      },
      USER,
    );
    // 38*1 + 65*2 = 168, calculado por el backend.
    expect(orderSave).toHaveBeenCalledWith(
      expect.objectContaining({ totalAmount: '168.00', status: 'pending' }),
    );
    expect(paymentSave).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: '168.00',
        method: PaymentMethod.TDC,
        status: PaymentStatus.PAID,
      }),
    );
    const savedItems = itemSave.mock.calls[0][0] as Array<
      Record<string, unknown>
    >;
    expect(savedItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          unitPrice: '38.00',
          subtotal: '38.00',
          quantity: 1,
        }),
        expect.objectContaining({
          unitPrice: '65.00',
          subtotal: '130.00',
          quantity: 2,
        }),
      ]),
    );
  });

  it('J5: usa el PROMEDIO real de preparación cuando hay muestras; si no, el tiempo base', async () => {
    const { service, itemSave } = buildService({
      profile: PROFILE,
      products: [
        product('p1', '38.00', { basePrepTimeSeconds: 600 }),
        product('p2', '65.00', { basePrepTimeSeconds: 900 }),
      ],
      prepAverages: [{ productId: 'p1', avg: 420 }], // p1 con historial; p2 sin
    });
    await service.create(
      {
        items: [
          { productId: 'p1', quantity: 1 },
          { productId: 'p2', quantity: 1 },
        ],
        payMethod: PaymentMethod.TDC,
      },
      USER,
    );
    const lines = itemSave.mock.calls[0][0] as {
      product: { id: string };
      prepTimeSeconds: number;
    }[];
    expect(lines.find((l) => l.product.id === 'p1')?.prepTimeSeconds).toBe(420);
    expect(lines.find((l) => l.product.id === 'p2')?.prepTimeSeconds).toBe(900);
  });

  it('C4: si la pasarela rechaza el cobro con tarjeta → BadRequest', async () => {
    const { service } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00')],
      gatewayAuthorize: jest.fn().mockRejectedValue(new Error('gateway caído')),
    });
    await expect(
      service.create(
        { items: [{ productId: 'p1', quantity: 1 }], payMethod: PaymentMethod.TDC },
        USER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('C4: el efectivo NO pasa por la pasarela (no llama authorize)', async () => {
    const authorize = jest.fn();
    const { service } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00')],
      gatewayAuthorize: authorize,
    });
    await service.create(
      {
        items: [{ productId: 'p1', quantity: 1 }],
        payMethod: PaymentMethod.EFECTIVO,
      },
      USER,
    );
    expect(authorize).not.toHaveBeenCalled();
  });

  it('efectivo deja el pago en pending (BR-009)', async () => {
    const { service, paymentSave } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00')],
    });
    await service.create(
      {
        items: [{ productId: 'p1', quantity: 1 }],
        payMethod: PaymentMethod.EFECTIVO,
      },
      USER,
    );
    expect(paymentSave).toHaveBeenCalledWith(
      expect.objectContaining({ status: PaymentStatus.PENDING }),
    );
  });

  it('producto inexistente → BadRequest (y nada se persiste)', async () => {
    const { service, orderSave } = buildService({
      profile: PROFILE,
      products: [],
    });
    await expect(
      service.create(
        {
          items: [{ productId: 'pX', quantity: 1 }],
          payMethod: PaymentMethod.TDC,
        },
        USER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orderSave).not.toHaveBeenCalled();
  });

  it('producto no disponible → BadRequest', async () => {
    const { service } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00', { isAvailable: false })],
    });
    await expect(
      service.create(
        {
          items: [{ productId: 'p1', quantity: 1 }],
          payMethod: PaymentMethod.TDC,
        },
        USER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe('OrdersService.create (programado, spec #4)', () => {
  const item = { items: [{ productId: 'p1', quantity: 1 }] };

  it('acepta recogida a ≥30 min el mismo día y persiste scheduledFor', async () => {
    const target = new Date(Date.now() + 45 * 60 * 1000); // +45 min (mismo día salvo ~medianoche)
    const { service, orderSave } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00')],
    });
    await service.create(
      {
        ...item,
        payMethod: PaymentMethod.TDC,
        scheduledFor: target.toISOString(),
      },
      USER,
    );
    const saved = orderSave.mock.calls[0][0] as { scheduledFor: Date };
    expect(saved.scheduledFor).toBeInstanceOf(Date);
    expect(saved.scheduledFor.getTime()).toBe(target.getTime());
  });

  it('rechaza recogida con < 30 min de anticipación → BadRequest, no persiste', async () => {
    const soon = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { service, orderSave } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00')],
    });
    await expect(
      service.create(
        { ...item, payMethod: PaymentMethod.TDC, scheduledFor: soon },
        USER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orderSave).not.toHaveBeenCalled();
  });

  it('rechaza recogida para otro día → BadRequest', async () => {
    const otherDay = new Date(
      Date.now() + 2 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const { service } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00')],
    });
    await expect(
      service.create(
        { ...item, payMethod: PaymentMethod.TDC, scheduledFor: otherDay },
        USER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('sin scheduledFor → pedido inmediato (scheduledFor null)', async () => {
    const { service, orderSave } = buildService({
      profile: PROFILE,
      products: [product('p1', '38.00')],
    });
    await service.create({ ...item, payMethod: PaymentMethod.TDC }, USER);
    const saved = orderSave.mock.calls[0][0] as { scheduledFor: Date | null };
    expect(saved.scheduledFor).toBeNull();
  });
});

describe('OrdersService.findMine', () => {
  it('sin perfil aún → lista vacía (no revienta)', async () => {
    const { service } = buildService({ profile: null });
    await expect(service.findMine(USER)).resolves.toEqual([]);
  });
});

describe('OrdersService.updateStatus', () => {
  function orderWith(status: OrderStatus) {
    return {
      id: 'o1',
      status,
      acceptedAt: null,
      readyAt: null,
      pickupDeadline: null,
      pickedUpAt: null,
    };
  }

  it('pending→preparing: válido, fija acceptedAt (hora del servidor, BR-005)', async () => {
    const { service, orderSave } = buildService({
      order: orderWith(OrderStatus.PENDING),
    });
    await service.updateStatus('o1', OrderStatus.PREPARING);
    const saved = orderSave.mock.calls[0][0] as {
      status: OrderStatus;
      acceptedAt: Date;
    };
    expect(saved.status).toBe(OrderStatus.PREPARING);
    expect(saved.acceptedAt).toBeInstanceOf(Date);
  });

  it('preparing→ready: fija readyAt + pickupDeadline (+20 min)', async () => {
    const { service, orderSave } = buildService({
      order: orderWith(OrderStatus.PREPARING),
    });
    await service.updateStatus('o1', OrderStatus.READY);
    const saved = orderSave.mock.calls[0][0] as {
      readyAt: Date;
      pickupDeadline: Date;
    };
    expect(saved.readyAt).toBeInstanceOf(Date);
    expect(saved.pickupDeadline.getTime() - saved.readyAt.getTime()).toBe(
      20 * 60 * 1000,
    );
  });

  it('picked_up→preparing: transición prohibida → BadRequest (BR-004), no persiste', async () => {
    const { service, orderSave } = buildService({
      order: orderWith(OrderStatus.PICKED_UP),
    });
    await expect(
      service.updateStatus('o1', OrderStatus.PREPARING),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(orderSave).not.toHaveBeenCalled();
  });

  it('mismo estado → no-op idempotente (no persiste)', async () => {
    const { service, orderSave } = buildService({
      order: orderWith(OrderStatus.READY),
    });
    await service.updateStatus('o1', OrderStatus.READY);
    expect(orderSave).not.toHaveBeenCalled();
  });

  it('preparing→ready: registra preparation_times por línea (BR-007)', async () => {
    const accepted = new Date(Date.now() - 600_000); // hace ~10 min
    const order = {
      id: 'o1',
      status: OrderStatus.PREPARING,
      acceptedAt: accepted,
      createdAt: accepted,
      readyAt: null,
      pickupDeadline: null,
      pickedUpAt: null,
      items: [
        { id: 'it1', product: { id: 'p1' } },
        { id: 'it2', product: { id: 'p2' } },
      ],
    };
    const { service, prepSave } = buildService({ order });
    await service.updateStatus('o1', OrderStatus.READY);
    expect(prepSave).toHaveBeenCalledTimes(1);
    const rows = prepSave.mock.calls[0][0] as Array<{
      durationSeconds: number;
    }>;
    expect(rows).toHaveLength(2);
    expect(rows[0].durationSeconds).toBeGreaterThan(0);
  });
});

describe('OrdersService.congestion', () => {
  it('< 5 en cola → verde', async () => {
    const { service } = buildService({ queueCount: 3 });
    await expect(service.congestion()).resolves.toMatchObject({
      count: 3,
      level: 'verde',
      yellow: 5,
      red: 10,
    });
  });

  it('5–10 en cola → amarillo', async () => {
    const { service } = buildService({ queueCount: 7 });
    await expect(service.congestion()).resolves.toMatchObject({
      level: 'amarillo',
    });
  });

  it('> 10 en cola → rojo', async () => {
    const { service } = buildService({ queueCount: 12 });
    await expect(service.congestion()).resolves.toMatchObject({
      level: 'rojo',
    });
  });

  it('excluye programados fuera de ventana: la query filtra por scheduledFor (spec #4)', async () => {
    const { service, congestionWhere } = buildService({ queueCount: 3 });
    await service.congestion();
    // El conteo cuenta inmediatos (scheduledFor NULL) + programados dentro de la ventana.
    expect(congestionWhere.some((s) => s.includes('scheduledFor'))).toBe(true);
  });
});

describe('OrdersService.cancelOwn / extendOwn (cliente)', () => {
  it('cancela un pedido propio pending → cancelled', async () => {
    const { service, orderSave } = buildService({
      profile: PROFILE,
      order: { id: 'o1', status: OrderStatus.PENDING },
    });
    const out = await service.cancelOwn('o1', USER);
    expect(out.status).toBe(OrderStatus.CANCELLED);
    expect(orderSave).toHaveBeenCalledTimes(1);
  });

  it('cancela un pedido propio listo (ready) que no se recogió → cancelled (§3.9)', async () => {
    const { service } = buildService({
      profile: PROFILE,
      order: { id: 'o1', status: OrderStatus.READY },
    });
    const out = await service.cancelOwn('o1', USER);
    expect(out.status).toBe(OrderStatus.CANCELLED);
  });

  it('no cancela un pedido en preparación → BadRequest (§5), no persiste', async () => {
    const { service, orderSave } = buildService({
      profile: PROFILE,
      order: { id: 'o1', status: OrderStatus.PREPARING },
    });
    await expect(service.cancelOwn('o1', USER)).rejects.toBeInstanceOf(
      BadRequestException,
    );
    expect(orderSave).not.toHaveBeenCalled();
  });

  it('sin perfil (o pedido ajeno) → NotFound (BR-014: no revela existencia)', async () => {
    const { service } = buildService({ profile: null });
    await expect(service.cancelOwn('o1', USER)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('extiende un pedido propio ready → ready_later', async () => {
    const { service } = buildService({
      profile: PROFILE,
      order: { id: 'o1', status: OrderStatus.READY },
    });
    const out = await service.extendOwn('o1', USER);
    expect(out.status).toBe(OrderStatus.READY_LATER);
  });

  it('no extiende un pedido que no está listo → BadRequest', async () => {
    const { service } = buildService({
      profile: PROFILE,
      order: { id: 'o1', status: OrderStatus.PENDING },
    });
    await expect(service.extendOwn('o1', USER)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });
});
