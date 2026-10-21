import { Repository } from 'typeorm';
import { TypeOrmCooperativaCatalog } from './cooperativa.repository';
import type { CooperativaEntity } from '../../../../infrastructure/database/entities/cooperativa.entity';

/**
 * Adapter del catálogo de cooperativas (UTC-F1-002). Repo TypeORM mockeado → prueba las 3
 * resoluciones de estado. Mutante: si el adapter dejara de consultar `activa: true` o de
 * distinguir el catálogo vacío, estos asserts caen.
 */
describe('TypeOrmCooperativaCatalog.resolveBranch', () => {
  const makeCatalog = (count: number, found: boolean) => {
    const findOne = jest
      .fn()
      .mockResolvedValue(
        found ? ({ id: 'coop-1' } as CooperativaEntity) : null,
      );
    const repo = {
      count: jest.fn().mockResolvedValue(count),
      findOne,
    } as unknown as Repository<CooperativaEntity>;
    return {
      catalog: new TypeOrmCooperativaCatalog(repo),
      findOne,
    };
  };

  it('catálogo vacío → catalog_empty (bootstrap single-tenant)', async () => {
    const { catalog, findOne } = makeCatalog(0, false);
    await expect(catalog.resolveBranch('coop-1')).resolves.toBe(
      'catalog_empty',
    );
    expect(findOne).not.toHaveBeenCalled(); // no consulta si no hay catálogo
  });

  it('id presente y activo → active', async () => {
    const { catalog, findOne } = makeCatalog(3, true);
    await expect(catalog.resolveBranch('coop-1')).resolves.toBe('active');
    // filtra por activa:true (fail-closed ante inactivas)
    expect(findOne).toHaveBeenCalledWith({
      where: { id: 'coop-1', activa: true },
    });
  });

  it('id ausente o inactivo → not_found', async () => {
    const { catalog } = makeCatalog(3, false);
    await expect(catalog.resolveBranch('coop-x')).resolves.toBe('not_found');
  });
});
