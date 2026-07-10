import { ProductEntity } from '../../../infrastructure/database/entities/product.entity';

export interface IProductRepository {
  findAll(): Promise<ProductEntity[]>;
  findById(id: string): Promise<ProductEntity | null>;
  save(product: ProductEntity): Promise<ProductEntity>;
}

export const PRODUCT_REPOSITORY = Symbol('IProductRepository');
