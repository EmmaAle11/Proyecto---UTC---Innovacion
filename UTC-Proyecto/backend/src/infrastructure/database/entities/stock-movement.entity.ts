import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { StockMovementReason, StockMovementType } from './enums';
import { ProductEntity } from './product.entity';

/**
 * Movimiento de inventario (D-052, Plan 08). Auditoría de las BAJAS: hoy solo MERMA (una
 * `finished_good` que venció su `expires_at` → `caducado`), que es lo que hace que el ciclo de
 * reoferta TERMINE. `finished_good_id` es un id suelto (sin FK): la `finished_good` se elimina al
 * mermarse, y el registro de auditoría debe sobrevivir a esa baja. Plan 04 ampliará tipos/motivos.
 */
@Entity('stock_movements')
@Check(`"qty" > 0`)
export class StockMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column('int')
  qty: number;

  /** `text` + CHECK (no enum pg). Valores: StockMovementType. */
  @Column('text')
  type: StockMovementType;

  /** `text` + CHECK. Valores: StockMovementReason. */
  @Column('text')
  reason: StockMovementReason;

  /** La `finished_good` que se mermó (id suelto: se conserva tras borrarla). */
  @Column('uuid', { name: 'finished_good_id', nullable: true })
  finishedGoodId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
