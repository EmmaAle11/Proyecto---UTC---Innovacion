import { Controller, Get } from '@nestjs/common';
import { ProductsService } from '../../application/products/products.service';
import {
  ProductResponse,
  toProductResponse,
} from '../../application/products/dto/product-response';

/**
 * Catálogo. Protegido por el guard JWT global (cualquier usuario autenticado,
 * rules §5: el `user` puede ver productos). El rol no se restringe: lo leen
 * cliente y admin.
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /** GET /products → catálogo completo. */
  @Get()
  async findAll(): Promise<ProductResponse[]> {
    const rows = await this.products.findAll();
    return rows.map(toProductResponse);
  }
}
