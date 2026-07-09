import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OptimisticLockVersionMismatchError } from 'typeorm';
import type { IProductRepository } from '../../domain/product/product.repository';
import { PRODUCT_REPOSITORY } from '../../domain/product/product.repository';
import { ProductEntity } from '../../infrastructure/database/entities/product.entity';
import { DomainError } from '../../kernel/domain/DomainError';
import {
  assertProductInvariants,
  ProductInvariantFields,
} from '../../modules/products/domain/product.policy';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

/**
 * Catálogo (BR-006/BR-007/BR-011). Lectura del menú + alta/edición del admin.
 * El backend es la fuente de verdad (BR-015): valida y persiste; el dinero
 * (`numeric`) se guarda como string con 2 decimales.
 */
@Injectable()
export class ProductsService {
  constructor(
    @Inject(PRODUCT_REPOSITORY)
    private readonly products: IProductRepository,
  ) {}

  /** Lista el catálogo completo, ordenado por categoría y nombre. */
  findAll(): Promise<ProductEntity[]> {
    return this.products.findAll();
  }

  /** Traduce la invariante de dominio (DomainError) a 400 (D-039). */
  private assertInvariants(fields: ProductInvariantFields): void {
    try {
      assertProductInvariants(fields);
    } catch (e) {
      if (e instanceof DomainError) throw new BadRequestException(e.message);
      throw e;
    }
  }

  /** Alta de producto (admin). */
  async create(dto: CreateProductDto): Promise<ProductEntity> {
    this.assertInvariants({
      price: dto.price,
      reofferPrice: dto.reofferPrice ?? null,
      minStock: dto.minStock ?? 0,
      maxStock: dto.maxStock ?? null,
    });
    const entity = new ProductEntity();
    entity.name = dto.name;
    entity.description = dto.description ?? null;
    entity.price = dto.price.toFixed(2);
    entity.category = dto.category;
    entity.imageUrl = dto.imageUrl ?? null;
    entity.basePrepTimeSeconds = dto.basePrepTimeSeconds;
    entity.stock = dto.stock ?? 0;
    entity.minStock = dto.minStock ?? 0;
    entity.maxStock = dto.maxStock ?? null;
    entity.status = dto.status;
    entity.isAvailable = dto.isAvailable ?? true;
    entity.reofferPrice =
      dto.reofferPrice != null ? dto.reofferPrice.toFixed(2) : null;
    return this.products.save(entity);
  }

  /** Edición parcial de producto (admin). Solo aplica los campos enviados. */
  async update(id: string, dto: UpdateProductDto): Promise<ProductEntity> {
    const p = await this.products.findById(id);
    if (!p) throw new NotFoundException('Producto no encontrado');

    if (dto.name !== undefined) p.name = dto.name;
    if (dto.description !== undefined) p.description = dto.description ?? null;
    if (dto.price !== undefined) p.price = dto.price.toFixed(2);
    if (dto.category !== undefined) p.category = dto.category;
    if (dto.imageUrl !== undefined) p.imageUrl = dto.imageUrl ?? null;
    if (dto.basePrepTimeSeconds !== undefined)
      p.basePrepTimeSeconds = dto.basePrepTimeSeconds;
    if (dto.stock !== undefined) p.stock = dto.stock;
    if (dto.minStock !== undefined) p.minStock = dto.minStock;
    if (dto.maxStock !== undefined) p.maxStock = dto.maxStock ?? null;
    // B5: al CAMBIAR de estado, reinicia el reloj "preparado hace X min".
    if (dto.status !== undefined) {
      if (dto.status !== p.status) p.statusChangedAt = new Date();
      p.status = dto.status;
    }
    if (dto.isAvailable !== undefined) p.isAvailable = dto.isAvailable;
    if (dto.reofferPrice !== undefined)
      p.reofferPrice =
        dto.reofferPrice === null ? null : dto.reofferPrice.toFixed(2);

    this.assertInvariants({
      price: Number(p.price),
      reofferPrice: p.reofferPrice != null ? Number(p.reofferPrice) : null,
      minStock: p.minStock,
      maxStock: p.maxStock,
    });
    try {
      return await this.products.save(p);
    } catch (e) {
      // Optimistic lock (@VersionColumn): otro update tocó el producto entre la
      // lectura y el guardado → 409 en vez de un lost-update silencioso.
      if (e instanceof OptimisticLockVersionMismatchError) {
        throw new ConflictException(
          'El producto fue modificado por otra operación. Recarga y reintenta.',
        );
      }
      throw e;
    }
  }
}
