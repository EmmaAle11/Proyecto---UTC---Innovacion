import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductEntity } from '../../../../infrastructure/database/entities/product.entity';
import { IProductRepository } from '../../application/product.repository.port';

@Injectable()
export class TypeOrmProductRepository implements IProductRepository {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly repo: Repository<ProductEntity>,
  ) {}

  findAll(): Promise<ProductEntity[]> {
    return this.repo.find({ order: { category: 'ASC', name: 'ASC' } });
  }

  findById(id: string): Promise<ProductEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  save(product: ProductEntity): Promise<ProductEntity> {
    return this.repo.save(product);
  }
}
