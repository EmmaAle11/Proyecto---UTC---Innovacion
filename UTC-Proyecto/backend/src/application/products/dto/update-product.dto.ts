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
import { IMAGE_URL_PATTERN } from './create-product.dto';

/** Edición parcial de producto: todos los campos opcionales (sin mapped-types). */
export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'El nombre es obligatorio' })
  @MaxLength(80)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  description?: string;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Precio inválido' })
  @Min(0.01, { message: 'El precio debe ser mayor a 0' })
  price?: number;

  @IsOptional()
  @IsString()
  @MinLength(1, { message: 'La categoría es obligatoria' })
  @MaxLength(40)
  category?: string;

  @IsOptional()
  @IsInt()
  @Min(1, { message: 'El tiempo de preparación debe ser mayor a 0' })
  basePrepTimeSeconds?: number;

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

  @IsOptional()
  @IsEnum(ProductStatus, { message: 'Estado de producto inválido' })
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;

  // `null` limpia la reoferta; un número la fija (> 0). `@IsOptional` salta validación
  // cuando es null/undefined, así que el número se valida y el null pasa a "limpiar".
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01, { message: 'El precio de reoferta debe ser mayor a 0' })
  reofferPrice?: number | null;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  @Matches(IMAGE_URL_PATTERN, {
    message:
      'imageUrl debe ser una ruta de asset válida (products/<nombre>.png)',
  })
  imageUrl?: string;
}
