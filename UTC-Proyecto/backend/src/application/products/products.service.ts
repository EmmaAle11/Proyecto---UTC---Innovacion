import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../infrastructure/database/entities/product.entity';

/**
 * Catálogo (BR-006/BR-007/BR-011). Lectura del menú desde PostgreSQL.
 * El backend es la fuente de verdad (BR-015): devuelve lo persistido tal cual.
 */
@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly products: Repository<ProductEntity>,
  ) {}

  /** Lista el catálogo completo, ordenado por categoría y nombre. */
  findAll(): Promise<ProductEntity[]> {
    return this.products.find({ order: { category: 'ASC', name: 'ASC' } });
  }
}
