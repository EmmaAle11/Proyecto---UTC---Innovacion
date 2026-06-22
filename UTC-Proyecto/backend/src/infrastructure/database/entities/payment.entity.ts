import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentMethod, PaymentStatus } from './enums';
import { OrderEntity } from './order.entity';

/** Pago 1:1 con el pedido (BR-009, BR-010). */
@Entity('payments')
@Check(`"amount" > 0`)
export class PaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // OneToOne + JoinColumn → columna order_id UNIQUE (un pago por pedido).
  @OneToOne(() => OrderEntity, (order) => order.payment, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'order_id' })
  order: OrderEntity;

  @Column({ type: 'enum', enum: PaymentMethod })
  method: PaymentMethod;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column('numeric', { precision: 10, scale: 2 })
  amount: string;

  @Column('text', { name: 'provider_reference', nullable: true })
  providerReference: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
