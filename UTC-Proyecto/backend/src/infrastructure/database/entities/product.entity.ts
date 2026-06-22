import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ProductStatus } from './enums';
import { OrderItemEntity } from './order-item.entity';
import { PreparationTimeEntity } from './preparation-time.entity';

/** Catálogo (BR-006, BR-007, BR-011). */
@Entity('products')
@Check(`"price" > 0`)
@Check(`"base_prep_time_seconds" > 0`)
@Check(`"stock" >= 0`)
@Check(`"min_stock" >= 0`)
@Check(`"max_stock" >= "min_stock"`)
@Check(`"reoffer_price" > 0`)
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  @Column('text', { nullable: true })
  description: string | null;

  @Column('numeric', { precision: 10, scale: 2 })
  price: string;

  @Column('text')
  category: string;

  @Column('text', { name: 'image_url', nullable: true })
  imageUrl: string | null;

  // tiempo_base de preparación (BR-007), en segundos.
  @Column('int', { name: 'base_prep_time_seconds' })
  basePrepTimeSeconds: number;

  @Column('int', { default: 0 })
  stock: number;

  @Column('int', { name: 'min_stock', default: 0 })
  minStock: number;

  @Column('int', { name: 'max_stock', nullable: true })
  maxStock: number | null;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.NO_DISPONIBLE,
  })
  status: ProductStatus;

  @Column('boolean', { name: 'is_available', default: true })
  isAvailable: boolean;

  // reoferta / "Pon tu precio" (círculo de innovación §12).
  @Column('numeric', {
    name: 'reoffer_price',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  reofferPrice: string | null;

  @OneToMany(() => OrderItemEntity, (item) => item.product)
  items: OrderItemEntity[];

  @OneToMany(() => PreparationTimeEntity, (pt) => pt.product)
  preparationTimes: PreparationTimeEntity[];

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
