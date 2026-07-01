import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';
import { PaymentMethod } from '../../../infrastructure/database/entities/enums';

/** Una línea del pedido: SOLO producto + cantidad (el precio lo pone el backend, BR-015). */
export class CreateOrderItemDto {
  @IsUUID('4', { message: 'productId inválido' })
  productId: string;

  @IsInt()
  @Min(1, { message: 'La cantidad debe ser mayor a 0' })
  quantity: number;
}

/**
 * Alta de pedido del cliente. El cuerpo NO trae precios ni total: el backend
 * snapshotea el precio de cada producto y recalcula el total (BR-015, §5/§7).
 */
export class CreateOrderDto {
  @IsArray()
  @ArrayNotEmpty({ message: 'El pedido debe tener al menos un producto' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];

  @IsEnum(PaymentMethod, { message: 'Método de pago inválido' })
  payMethod: PaymentMethod;

  /**
   * Recogida programada (ISO 8601). Opcional: si falta, el pedido es inmediato.
   * El backend valida ≥30 min de anticipación y mismo día (hora del servidor, BR-005).
   */
  @IsOptional()
  @IsISO8601({}, { message: 'Fecha de recogida inválida' })
  scheduledFor?: string;
}
