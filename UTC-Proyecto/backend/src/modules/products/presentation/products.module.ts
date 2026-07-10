import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductEntity } from '../../../infrastructure/database/entities/product.entity';
import { ProductsService } from '../application/products.service';
import { ProductsController } from './products.controller';
import { PRODUCT_REPOSITORY } from '../application/product.repository.port';
import { TypeOrmProductRepository } from '../infrastructure/persistence/typeorm-product.repository';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductsController],
  providers: [
    ProductsService,
    { provide: PRODUCT_REPOSITORY, useClass: TypeOrmProductRepository },
  ],
})
export class ProductsModule {}
