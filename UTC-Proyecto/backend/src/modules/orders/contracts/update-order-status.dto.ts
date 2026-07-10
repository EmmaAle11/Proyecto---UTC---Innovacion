import { IsEnum } from 'class-validator';
import { OrderStatus } from '../domain/entities/Order';

/** Cambio de estado de un pedido (admin). La transición válida la decide el servicio (BR-004). */
export class UpdateOrderStatusDto {
  @IsEnum(OrderStatus, { message: 'Estado de pedido inválido' })
  status: OrderStatus;
}
