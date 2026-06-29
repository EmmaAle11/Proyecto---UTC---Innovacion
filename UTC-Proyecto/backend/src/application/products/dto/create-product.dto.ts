import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ProductStatus } from '../../../infrastructure/database/entities/enums';

/**
 * `image_url` es una RUTA de asset local (p. ej. `products/quesadilla-tinga.png`),
 * NO una URL externa. Restringir el formato bloquea inyecciones tipo `javascript:`,
 * URLs remotas arbitrarias y path-traversal (`../`). Defensa en profundidad.
 */
export const IMAGE_URL_PATTERN = /^products\/[a-z0-9-]+\.(png|jpg|jpeg|webp)$/;

/** Alta de producto (rules §7: precio>0, prep>0, stock≥0, estado∈enum). */
export class CreateProductDto {
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(80)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Precio inválido' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  price: number;

  @IsString()
  @MinLength(1, { message: 'La categoría es obligatoria' })
  @MaxLength(40)
  category: string;

  @IsInt()
  @Min(1, { message: 'El tiempo de preparación debe ser mayor a 0' })
  basePrepTimeSeconds: number;

  @IsOptional()
  @IsInt()
  @Min(0, { message: 'El stock no puede ser negativo' })
  stock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  maxStock?: number | null;

  @IsEnum(ProductStatus, { message: 'Estado de producto inválido' })
  status: ProductStatus;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El precio de reoferta debe ser mayor a 0' })
  reofferPrice?: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(IMAGE_URL_PATTERN, {
    message:
      'imageUrl debe ser una ruta de asset válida (products/<nombre>.png)',
  })
  imageUrl?: string;
}
