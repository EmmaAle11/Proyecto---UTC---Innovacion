import { Repository } from 'typeorm';
import { TypeOrmOrderRepository } from './order.repository';
import type { OrderEntity } from '../../../../infrastructure/database/entities/order.entity';

/**
 * Prueba negativa de aislamiento por cooperativa (F1, UTC-F0-002) a nivel persistencia:
 * `findAll(branchId)` DEBE filtrar por esa sucursal; sin branchId, no filtra (single-tenant).
 * Si alguien cambia el `where` y deja de filtrar, estos tests caen (regresión de fuga entre
 * cooperativas). No toca BD: mockea el `Repository.find` y afirma el criterio enviado a TypeORM.
 */
type FindOptions = { where: { branchId?: string } };

describe('TypeOrmOrderRepository.findAll — aislamiento por cooperativa', () => {
  const makeRepo = (
    findMock: jest.Mock<Promise<OrderEntity[]>, [FindOptions]>,
  ) => {
    const orders = { find: findMock } as unknown as Repository<OrderEntity>;
    // El resto de dependencias no se usan en findAll: stubs vacíos.
    return new TypeOrmOrderRepository(
      {} as never, // dataSource
      orders,
      {} as never, // products
      {} as never, // profiles
      {} as never, // paymentGateway
      {} as never, // auditLog
      {} as never, // events
    );
  };

  const makeFind = () =>
    jest.fn<Promise<OrderEntity[]>, [FindOptions]>().mockResolvedValue([]);

  it('con branchId filtra por esa cooperativa (where: { branchId })', async () => {
    const find = makeFind();
    await makeRepo(find).findAll('coop-1');
    expect(find).toHaveBeenCalledTimes(1);
    expect(find.mock.calls[0][0].where).toEqual({ branchId: 'coop-1' });
  });

  it('NO devuelve pedidos de otra cooperativa: el where lleva el branch pedido, no otro', async () => {
    const find = makeFind();
    await makeRepo(find).findAll('coop-1');
    const where = find.mock.calls[0][0].where;
    expect(where.branchId).toBe('coop-1');
    expect(where.branchId).not.toBe('coop-999');
  });

  it('sin branchId no aplica filtro (where vacío = single-tenant actual)', async () => {
    const find = makeFind();
    await makeRepo(find).findAll(undefined);
    expect(find.mock.calls[0][0].where).toEqual({});
  });
});
