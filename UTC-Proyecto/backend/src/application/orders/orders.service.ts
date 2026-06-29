import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In } from 'typeorm';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { OrderItemEntity } from '../../infrastructure/database/entities/order-item.entity';
import { PaymentEntity } from '../../infrastructure/database/entities/payment.entity';
import { ProductEntity } from '../../infrastructure/database/entities/product.entity';
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  UserRole,
} from '../../infrastructure/database/entities/enums';
import { CreateOrderDto } from './dto/create-order.dto';
import type { JwtUser } from '../../infrastructure/auth/jwt.strategy';

/** Relaciones que necesita el mapper `toOrderResponse`. */
const ORDER_RELATIONS = {
  items: { product: true },
  payment: true,
  user: true,
} as const;

/**
 * Transiciones de estado válidas (BR-004). Un estado terminal no tiene salidas;
 * la validación vive en el backend (el frontend solo ofrece botones).
 */
const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PENDING]: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
  [OrderStatus.PREPARING]: [OrderStatus.READY],
  [OrderStatus.READY]: [
    OrderStatus.PICKED_UP,
    OrderStatus.NOT_PICKED_UP,
    OrderStatus.READY_LATER,
  ],
  [OrderStatus.READY_LATER]: [OrderStatus.PICKED_UP, OrderStatus.NOT_PICKED_UP],
  [OrderStatus.PICKED_UP]: [],
  [OrderStatus.NOT_PICKED_UP]: [],
  [OrderStatus.CANCELLED]: [],
};

/** Deriva nombre/apellido del correo institucional (perfiles creados sin registro previo). */
function deriveName(email: string): { firstName: string; lastName: string } {
  const local = email.split('@')[0] ?? '';
  const parts = local
    .split(/[._-]/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  if (parts.length === 0) return { firstName: 'Cliente', lastName: '' };
  return { firstName: parts[0], lastName: parts.slice(1).join(' ') };
}

/**
 * Pedidos del cliente (BR-005, BR-014, BR-015). El backend es la fuente de verdad:
 * snapshotea el precio del catálogo, recalcula el total y crea orden+líneas+pago en
 * una TRANSACCIÓN. La propiedad se resuelve por el `keycloak_id` del JWT.
 */
@Injectable()
export class OrdersService {
  constructor(private readonly dataSource: DataSource) {}

  /** Crea un pedido del usuario autenticado (atómico). Devuelve el pedido con relaciones. */
  async create(dto: CreateOrderDto, user: JwtUser): Promise<OrderEntity> {
    const profile = await this.ensureProfile(user);

    const orderId = await this.dataSource.transaction(async (manager) => {
      const ids = dto.items.map((i) => i.productId);
      const products = await manager
        .getRepository(ProductEntity)
        .findBy({ id: In(ids) });
      const byId = new Map(products.map((p) => [p.id, p]));

      let total = 0;
      const lines = dto.items.map((i) => {
        const product = byId.get(i.productId);
        if (!product) {
          throw new BadRequestException(
            `Producto no encontrado: ${i.productId}`,
          );
        }
        if (!product.isAvailable) {
          throw new BadRequestException(
            `Producto no disponible: ${product.name}`,
          );
        }
        const unit = Number(product.price); // snapshot del precio (BR-015)
        const subtotal = Math.round(unit * i.quantity * 100) / 100;
        total += subtotal;
        return {
          product,
          quantity: i.quantity,
          unitPrice: unit.toFixed(2),
          subtotal: subtotal.toFixed(2),
          prepTimeSeconds: product.basePrepTimeSeconds,
        };
      });
      total = Math.round(total * 100) / 100;

      const order = await manager.getRepository(OrderEntity).save(
        manager.getRepository(OrderEntity).create({
          user: profile,
          status: OrderStatus.PENDING,
          totalAmount: total.toFixed(2),
        }),
      );

      await manager.getRepository(OrderItemEntity).save(
        lines.map((l) =>
          manager.getRepository(OrderItemEntity).create({
            order,
            product: l.product,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            subtotal: l.subtotal,
            prepTimeSeconds: l.prepTimeSeconds,
          }),
        ),
      );

      await manager.getRepository(PaymentEntity).save(
        manager.getRepository(PaymentEntity).create({
          order,
          method: dto.payMethod,
          // BR-009: efectivo no pasa por pasarela (queda pendiente); el resto, mock pagado (D-006).
          status:
            dto.payMethod === PaymentMethod.EFECTIVO
              ? PaymentStatus.PENDING
              : PaymentStatus.PAID,
          amount: total.toFixed(2),
        }),
      );

      return order.id;
    });

    return this.findOneOwned(orderId, profile.id);
  }

  /** Todos los pedidos, más recientes primero (admin: cola/dashboard). */
  findAll(): Promise<OrderEntity[]> {
    return this.dataSource.getRepository(OrderEntity).find({
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Cambia el estado de un pedido validando la transición (BR-004) y fijando los
   * timestamps con la hora del SERVIDOR (BR-005). Operación de una sola tabla (atómica).
   */
  async updateStatus(id: string, status: OrderStatus): Promise<OrderEntity> {
    const repo = this.dataSource.getRepository(OrderEntity);
    const order = await repo.findOne({
      where: { id },
      relations: ORDER_RELATIONS,
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    if (order.status === status) return order; // idempotente: mismo estado, no-op

    const allowed = ALLOWED_TRANSITIONS[order.status] ?? [];
    if (!allowed.includes(status)) {
      throw new BadRequestException(
        `Transición no permitida: ${order.status} → ${status}`,
      );
    }

    const now = new Date(); // BR-005: hora del servidor, nunca del frontend
    order.status = status;
    if (status === OrderStatus.PREPARING) order.acceptedAt = now;
    if (status === OrderStatus.READY) {
      order.readyAt = now;
      order.pickupDeadline = new Date(now.getTime() + 20 * 60 * 1000); // +20 min (D-005)
    }
    if (status === OrderStatus.PICKED_UP) order.pickedUpAt = now;

    await repo.save(order);
    return order;
  }

  /** Pedidos del usuario autenticado, más recientes primero (BR-014). */
  async findMine(user: JwtUser): Promise<OrderEntity[]> {
    const profile = await this.dataSource
      .getRepository(UserProfileEntity)
      .findOne({ where: { keycloakId: user.sub } });
    if (!profile) return [];
    return this.dataSource.getRepository(OrderEntity).find({
      where: { user: { id: profile.id } },
      relations: ORDER_RELATIONS,
      order: { createdAt: 'DESC' },
    });
  }

  /** Carga un pedido garantizando que pertenece al perfil dado (BR-014). */
  private async findOneOwned(
    id: string,
    profileId: string,
  ): Promise<OrderEntity> {
    const order = await this.dataSource.getRepository(OrderEntity).findOne({
      where: { id, user: { id: profileId } },
      relations: ORDER_RELATIONS,
    });
    if (!order) throw new NotFoundException('Pedido no encontrado');
    return order;
  }

  /** Asegura el `user_profile` del JWT (lo crea desde el token si no existe). */
  private async ensureProfile(user: JwtUser): Promise<UserProfileEntity> {
    const repo = this.dataSource.getRepository(UserProfileEntity);
    const existing = await repo.findOne({ where: { keycloakId: user.sub } });
    if (existing) return existing;
    const email = user.email ?? `${user.sub}@edu.utc.mx`;
    const { firstName, lastName } = deriveName(email);
    try {
      return await repo.save(
        repo.create({
          keycloakId: user.sub,
          email,
          firstName,
          lastName,
          role: UserRole.USER,
        }),
      );
    } catch (err) {
      // Carrera (dos pedidos casi simultáneos del mismo usuario nuevo): re-leer.
      const again = await repo.findOne({ where: { keycloakId: user.sub } });
      if (again) return again;
      throw err;
    }
  }
}
