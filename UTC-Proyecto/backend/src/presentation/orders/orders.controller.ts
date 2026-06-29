import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from '../../application/orders/orders.service';
import { CreateOrderDto } from '../../application/orders/dto/create-order.dto';
import {
  OrderResponse,
  toOrderResponse,
} from '../../application/orders/dto/order-response';
import type { JwtUser } from '../../infrastructure/auth/jwt.strategy';

/**
 * Pedidos del cliente. Ambas rutas exigen JWT (guard global); sin `@Roles`, así que
 * cualquier usuario autenticado las usa, pero la identidad sale del token (no del body)
 * y `findMine` filtra por el perfil del JWT (BR-014, BR-015).
 */
@Controller('orders')
export class OrdersController {
  constructor(private readonly orders: OrdersService) {}

  /** POST /orders → crea un pedido (201). Total y precios los calcula el backend. */
  @Post()
  async create(
    @Req() req: Request & { user?: JwtUser },
    @Body() dto: CreateOrderDto,
  ): Promise<OrderResponse> {
    return toOrderResponse(
      await this.orders.create(dto, this.requireUser(req)),
    );
  }

  /** GET /orders → mis pedidos (solo los del JWT). */
  @Get()
  async findMine(
    @Req() req: Request & { user?: JwtUser },
  ): Promise<OrderResponse[]> {
    const rows = await this.orders.findMine(this.requireUser(req));
    return rows.map(toOrderResponse);
  }

  private requireUser(req: Request & { user?: JwtUser }): JwtUser {
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  }
}
