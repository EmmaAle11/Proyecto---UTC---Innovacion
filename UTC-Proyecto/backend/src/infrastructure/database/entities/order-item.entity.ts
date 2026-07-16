import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderEntity } from './order.entity';
import { ProductEntity } from './product.entity';

/** Líneas del pedido. `unit_price` es snapshot del precio al ordenar. */
@Entity('order_items')
@Check(`"quantity" > 0`)
@Check(`"unit_price" > 0`)
@Check(`"subtotal" >= 0`)
export class OrderItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => OrderEntity, (order) => order.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @ManyToOne(() => ProductEntity, (product) => product.items, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column('int')
  quantity: number;

  @Column('numeric', { name: 'unit_price', precision: 10, scale: 2 })
  unitPrice: string;

  @Column('numeric', { precision: 10, scale: 2 })
  subtotal: string;

  @Column('int', { name: 'prep_time_seconds', nullable: true })
  prepTimeSeconds: number | null;

  /**
   * D-052/Plan 08 (bug 2): si esta línea COMPRÓ una unidad reofertada, el id de esa `finished_good`.
   * Id suelto (SIN FK): la `finished_good` puede consumirse/mermarse y la línea del pedido debe
   * conservar el rastro histórico. Null = línea fresca (se sirve de `products.stock`).
   */
  @Column('uuid', { name: 'finished_good_id', nullable: true })
  finishedGoodId: string | null;
}
