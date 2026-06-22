import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';
import { OrderItemEntity } from './order-item.entity';

/** Histórico de preparación (BR-007): promedio de las últimas 20 muestras; <3 → tiempo_base. */
@Entity('preparation_times')
@Check(`"duration_seconds" > 0`)
export class PreparationTimeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductEntity, (product) => product.preparationTimes, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @ManyToOne(() => OrderItemEntity, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_item_id' })
  orderItem: OrderItemEntity | null;

  // tiempo real medido, en segundos.
  @Column('int', { name: 'duration_seconds' })
  durationSeconds: number;

  @CreateDateColumn({ name: 'recorded_at', type: 'timestamptz' })
  recordedAt: Date;
}
