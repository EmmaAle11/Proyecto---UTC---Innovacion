import { BadRequestException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { OrdersService } from './orders.service';
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
}) {
  const orderSave = jest.fn((o: unknown) =>
    Promise.resolve({ ...(o as object), id: 'order-1' }),
  );
  const itemSave = jest.fn((x: unknown) => Promise.resolve(x));
  const paymentSave = jest.fn((p: unknown) => Promise.resolve(p));
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
      findOne: jest.fn().mockResolvedValue(
        opts.order ?? {
          id: 'order-1',
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
  };
  const getRepository = (e: { name: string }) => repos[e.name];
  const dataSource = {
    getRepository,
    transaction: (
      cb: (m: { getRepository: typeof getRepository }) => unknown,
    ) => cb({ getRepository }),
  } as unknown as DataSource;
  return {
    service: new OrdersService(dataSource),
    orderSave,
    itemSave,
    paymentSave,
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
});
