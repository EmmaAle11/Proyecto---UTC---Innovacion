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
import { OrdersService } from '../application/orders.service';
import { CreateOrderDto } from '../contracts/create-order.dto';
import { UpdateOrderStatusDto } from '../contracts/update-order-status.dto';
import type { OrderMetrics } from '../contracts/order-metrics';
import { OrderResponse, CongestionResponse } from '../contracts/order-response';
import { Roles } from '../../../presentation/auth/decorators/roles.decorator';
import type { JwtUser } from '../../../infrastructure/auth/jwt.strategy';

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
    return this.orders.create(dto, this.requireUser(req).sub);
  }

  /** GET /orders → mis pedidos (solo los del JWT). */
  @Get()
  async findMine(
    @Req() req: Request & { user?: JwtUser },
  ): Promise<OrderResponse[]> {
    return this.orders.findMine(this.requireUser(req).sub);
  }

  /**
   * GET /orders/all → pedidos para el admin, acotados a SU cooperativa (BR-003/§3.12).
   * El alcance sale del JWT (`branchId`), nunca de un parámetro del request: un admin no puede
   * pedir pedidos de otra cooperativa inyectando `?branchId=`. Mientras Keycloak no emita el claim,
   * `branchId` es undefined → alcance actual (todas), sin romper el single-tenant vigente.
   */
  @Get('all')
  @Roles('admin')
  async findAll(
    @Req() req: Request & { user?: JwtUser },
  ): Promise<OrderResponse[]> {
    return this.orders.findAll(this.requireUser(req).branchId);
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

  /**
   * PATCH /orders/:id/status → transición de estado (BR-003/BR-004).
   * Roles operativos: cocina mueve pending→preparing→ready; mostrador entrega/no-recogido;
   * admin conserva sus tres funciones. El agregado `Order` valida qué transición es legal;
   * aquí se controla QUIÉN puede pedir una transición (un `user` cliente no, rules §5).
   */
  @Patch(':id/status')
  @Roles('admin', 'cocina', 'mostrador')
  async updateStatus(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ): Promise<OrderResponse> {
    const user = this.requireUser(req);
    // La auditoría (estado viejo→nuevo, capturado bajo lock dentro de la tx) la hace el
    // adapter: aquí solo pasamos QUIÉN la ejecuta. El actor incluye el rol operativo que
    // autorizó la acción (BR-003: cocina/mostrador/admin), para no registrar a un cocinero
    // como 'admin' y conservar la trazabilidad de rol que exige F1.
    const opRole = ['cocina', 'mostrador', 'admin'].find((r) =>
      user.roles.includes(r),
    );
    const actor = opRole
      ? `${user.email ?? 'unknown'} (${opRole})`
      : (user.email ?? 'unknown');
    return this.orders.updateStatus(id, dto.status, actor);
  }

  /** PATCH /orders/:id/cancel → el cliente cancela SU pedido (§3.8, solo si `pending`). */
  @Patch(':id/cancel')
  async cancel(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponse> {
    return this.orders.cancelOwn(id, this.requireUser(req).sub);
  }

  /** PATCH /orders/:id/extend → el cliente difiere SU pedido (§3.10, `ready → ready_later`). */
  @Patch(':id/extend')
  async extend(
    @Req() req: Request & { user?: JwtUser },
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<OrderResponse> {
    return this.orders.extendOwn(id, this.requireUser(req).sub);
  }

  private requireUser(req: Request & { user?: JwtUser }): JwtUser {
    if (!req.user) throw new UnauthorizedException();
    return req.user;
  }
}
