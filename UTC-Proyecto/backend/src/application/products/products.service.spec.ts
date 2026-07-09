import { Test } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductEntity } from '../../infrastructure/database/entities/product.entity';
import { ProductStatus } from '../../infrastructure/database/entities/enums';
import { PRODUCT_REPOSITORY } from '../../domain/product/product.repository';

/** Producto de prueba con TODOS los campos del esquema (con una reoferta puesta). */
function aProduct(): ProductEntity {
  return {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Papas con queso',
    description: null,
    price: '32.00',
    category: 'Snacks',
    imageUrl: null,
    basePrepTimeSeconds: 480,
    stock: 3,
    minStock: 0,
    maxStock: null,
    status: ProductStatus.CALENTANDO,
    statusChangedAt: new Date(),
    isAvailable: true,
    reofferPrice: '24.00',
    items: [],
    preparationTimes: [],
    createdAt: new Date(),
    updatedAt: new Date(),
    version: 1,
  };
}

describe('ProductsService.update', () => {
  let service: ProductsService;
  const repo = {
    findAll: jest.fn(),
    findById: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    repo.save.mockImplementation((e: ProductEntity) => Promise.resolve(e));
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PRODUCT_REPOSITORY, useValue: repo },
      ],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  // Regresión: antes `reofferPrice: null` reventaba con `null.toFixed(2)` → 500.
  it('reofferPrice:null limpia la reoferta sin lanzar (regresión del 500)', async () => {
    repo.findById.mockResolvedValue(aProduct());
    const out = await service.update('a0000000-0000-4000-8000-000000000001', {
      reofferPrice: null,
    });
    expect(out.reofferPrice).toBeNull();
    expect(repo.save).toHaveBeenCalledWith(
      expect.objectContaining({ reofferPrice: null }),
    );
  });

  it('reofferPrice numérico se persiste como string con 2 decimales', async () => {
    repo.findById.mockResolvedValue(aProduct());
    const out = await service.update('a0000000-0000-4000-8000-000000000001', {
      reofferPrice: 5,
    });
    expect(out.reofferPrice).toBe('5.00');
  });

  it('producto inexistente lanza NotFoundException', async () => {
    repo.findById.mockResolvedValue(null);
    await expect(
      service.update('a0000000-0000-4000-8000-000000000099', { price: 10 }),
    ).rejects.toThrow('Producto no encontrado');
  });
});
