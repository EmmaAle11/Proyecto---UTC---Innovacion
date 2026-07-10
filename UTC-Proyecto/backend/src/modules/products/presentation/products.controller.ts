import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ProductsService } from '../application/products.service';
import { CreateProductDto } from '../contracts/create-product.dto';
import { UpdateProductDto } from '../contracts/update-product.dto';
import {
  ProductResponse,
  toProductResponse,
} from '../contracts/product-response';
import { Roles } from '../../../presentation/auth/decorators/roles.decorator';

/**
 * Catálogo. `GET` está protegido por el guard JWT global (cualquier usuario
 * autenticado, rules §5). El alta/edición exige rol **admin** (`@Roles('admin')`,
 * el `RolesGuard` global lo aplica; un `user` recibe 403). BR-015: valida el backend.
 */
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  /** GET /products → catálogo completo (cliente y admin). */
  @Get()
  async findAll(): Promise<ProductResponse[]> {
    const rows = await this.products.findAll();
    return rows.map(toProductResponse);
  }

  /** POST /products → alta de producto (admin). */
  @Post()
  @Roles('admin')
  async create(@Body() dto: CreateProductDto): Promise<ProductResponse> {
    return toProductResponse(await this.products.create(dto));
  }

  /** PATCH /products/:id → edición parcial (admin): edición, disponibilidad, reoferta. */
  @Patch(':id')
  @Roles('admin')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateProductDto,
  ): Promise<ProductResponse> {
    return toProductResponse(await this.products.update(id, dto));
  }
}
