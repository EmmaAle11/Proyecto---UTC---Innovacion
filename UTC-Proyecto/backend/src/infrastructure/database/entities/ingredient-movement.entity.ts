import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IngredientMovementType } from './enums';
import { IngredientEntity } from './ingredient.entity';

/**
 * LIBRO MAYOR de insumos (plan 04 D4) — append-only. El saldo de `ingredients.stock` se cachea,
 * pero la VERDAD es la suma de estos movimientos. Sin UPDATE ni DELETE sobre el historial:
 * cualquier error se corrige con un movimiento AJUSTE_CONTEO de signo contrario, nunca editando.
 */
@Entity('ingredient_movements')
@Check(
  `"type" IN ('compra', 'consumo_venta', 'merma', 'ajuste_conteo', 'devolucion_proveedor')`,
)
export class IngredientMovementEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IngredientEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity;

  /** Operación (compra, consumo_venta, merma, ajuste_conteo, devolucion_proveedor). */
  @Column('text')
  type: IngredientMovementType;

  /** Delta en unidad base, CON signo (compra +, consumo/merma −, ajuste ±). */
  @Column('numeric', { name: 'qty_delta', precision: 14, scale: 3 })
  qtyDelta: string;

  /** Costo unitario vigente al momento del movimiento (para conciliación/varianza). */
  @Column('numeric', {
    name: 'unit_cost_at',
    precision: 14,
    scale: 6,
    default: 0,
  })
  unitCostAt: string;

  /** Motivo libre (caducado, derrame, no_recogido...). Obligatorio en merma. */
  @Column('text', { nullable: true })
  reason: string | null;

  /** Pedido que originó el consumo (id suelto: el contexto inventory no acopla a orders). */
  @Column('uuid', { name: 'order_id', nullable: true })
  orderId: string | null;

  /** Quién registró (email/sub del actor). */
  @Column('text', { name: 'registered_by' })
  registeredBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
