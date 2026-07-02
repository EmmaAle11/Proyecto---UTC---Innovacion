import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from '../../application/orders/orders.service';
import { CreateOrderDto } from '../../application/orders/dto/create-order.dto';
import { UpdateOrderStatusDto } from '../../application/orders/dto/update-order-status.dto';
import type { OrderMetrics } from '../../application/orders/dto/order-metrics';
import {
  OrderResponse,
  CongestionResponse,
  toOrderResponse,
} from '../../application/orders/dto/order-response';
import { Roles } from '../auth/decorators/roles.decorator';
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

  /** GET /orders/all → todos los pedidos (admin: cola/dashboard). */
  @Get('all')
  @Roles('admin')
  async findAll(): Promise<OrderResponse[]> {
    const rows = await this.orders.findAll();
    return rows.map(toOrderResponse);
  }

  /**
   * GET /orders/congestion → semáforo de congestión (D-019), calculado en el servidor.
   * Autenticado, ambos roles: el CLIENTE lo usa en el checkout sin ver pedidos ajenos (BR-014).
   */
  @Get('congestion')
  congestion(): Promise<CongestionResponse> {
    return this.orders.congestion();
  }

  /** GET /orders/metrics → métricas del negocio (admin): más vendido + hora pico (F5). */
  @Get('metrics')
  @Roles('admin')
  metrics(): Promise<OrderMetrics> {
    return this.orders.metrics();
  }

  /** PATCH /orders/:id/status → transición de estado (admin, BR-004). */
  @Patch(':id/status')
  @Roles('admin')
  async updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponse> {
    return toOrderResponse(await this.orders.updateStatus(id, dto.status));
  }

  /** PATCH /orders/:id/cancel → el cliente cancela SU pedido (§3.8, solo si `pending`). */
  @Patch(':id/cancel')
  async cancel(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponse> {
    return toOrderResponse(
      await this.orders.cancelOwn(id, this.requireUser(req)),
    );
  }

  /** PATCH /orders/:id/extend → el cliente difiere SU pedido (§3.10, `ready → ready_later`). */
  @Patch(':id/extend')
  async extend(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponse> {
    return toOrderResponse(
      await this.orders.extendOwn(id, this.requireUser(req)),
    );
  }

  private requireUser(req: Request & { user?: JwtUser }): JwtUser {
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  }
}
