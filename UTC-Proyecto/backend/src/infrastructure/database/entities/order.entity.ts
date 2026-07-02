import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from './enums';
import { UserProfileEntity } from './user-profile.entity';
import { OrderItemEntity } from './order-item.entity';
import { PaymentEntity } from './payment.entity';

/** Pedidos (BR-004, BR-005, BR-008, D-005). */
@Entity('orders')
@Check(`"total_amount" >= 0`)
export class OrderEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Número de pedido secuencial legible (la app lo muestra como U-00001). Lo genera
  // la BD (secuencia + default nextval); el backend nunca lo escribe, solo lo lee.
  @Column('integer', { name: 'order_number' })
  @Generated('increment')
  orderNumber: number;

  @ManyToOne(() => UserProfileEntity, (user) => user.orders, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({ name: 'user_profile_id' })
  user: UserProfileEntity;

  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.PENDING })
  status: OrderStatus;

  @Column('numeric', {
    name: 'total_amount',
    precision: 10,
    scale: 2,
    default: 0,
  })
  totalAmount: string;

  // Recogida programada por el cliente (NULL = pedido inmediato). BR-005: se valida
  // contra la hora del servidor (≥30 min de anticipación, mismo día).
  @Column('timestamptz', { name: 'scheduled_for', nullable: true })
  scheduledFor: Date | null;

  // Escalabilidad (§3.12): sucursal de recogida elegida por el cliente.
  @Column('text', { name: 'branch_id', nullable: true })
  branchId: string | null;

  @Column('text', { name: 'branch_name', nullable: true })
  branchName: string | null;

  @Column('timestamptz', { name: 'accepted_at', nullable: true })
  acceptedAt: Date | null;

  @Column('timestamptz', { name: 'estimated_ready_at', nullable: true })
  estimatedReadyAt: Date | null;

  // BR-005: fuente de verdad de "listo" (hora del servidor).
  @Column('timestamptz', { name: 'ready_at', nullable: true })
  readyAt: Date | null;

  // ready_at + 20 min (D-005).
  @Column('timestamptz', { name: 'pickup_deadline', nullable: true })
  pickupDeadline: Date | null;

  @Column('timestamptz', { name: 'picked_up_at', nullable: true })
  pickedUpAt: Date | null;

  @OneToMany(() => OrderItemEntity, (item) => item.order)
  items: OrderItemEntity[];

  @OneToOne(() => PaymentEntity, (payment) => payment.order)
  payment: PaymentEntity;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
