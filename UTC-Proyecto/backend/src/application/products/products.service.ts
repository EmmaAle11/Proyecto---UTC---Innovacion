import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { IProductRepository } from '../../domain/product/product.repository';
import { PRODUCT_REPOSITORY } from '../../domain/product/product.repository';
import { ProductEntity } from '../../infrastructure/database/entities/product.entity';
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

  /** Alta de producto (admin). */
  async create(dto: CreateProductDto): Promise<ProductEntity> {
    if (dto.maxStock != null && dto.maxStock < (dto.minStock ?? 0)) {
      throw new BadRequestException(
        'max_stock debe ser mayor o igual a min_stock',
      );
    }
    if (dto.reofferPrice != null && dto.reofferPrice >= dto.price) {
      throw new BadRequestException('La reoferta debe ser menor al precio');
    }
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

    if (p.maxStock != null && p.maxStock < p.minStock) {
      throw new BadRequestException(
        'max_stock debe ser mayor o igual a min_stock',
      );
    }
    if (p.reofferPrice != null && Number(p.reofferPrice) >= Number(p.price)) {
      throw new BadRequestException('La reoferta debe ser menor al precio');
    }
    return this.products.save(p);
  }
}
