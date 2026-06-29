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
