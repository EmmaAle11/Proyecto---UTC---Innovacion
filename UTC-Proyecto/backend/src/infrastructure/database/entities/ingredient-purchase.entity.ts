import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { IngredientEntity } from './ingredient.entity';

/**
 * Lote de COMPRA de un insumo (plan 04 D1). El factor de empaque (`factor_to_base`) vive AQUÍ,
 * no en el insumo: "una caja trae 12 hoy y 10 mañana" no debe duplicar el insumo.
 * `unit_cost` queda CONGELADO en el lote → esta tabla ES el histórico de precios (plan 04 Task 5 §8).
 */
@Entity('ingredient_purchases')
@Check(`"qty_purchased" > 0`)
@Check(`"factor_to_base" > 0`)
@Check(`"total_cost" >= 0`)
@Check(`"unit_cost" >= 0`)
export class IngredientPurchaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IngredientEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity;

  /** Cantidad en unidades de COMPRA (p. ej. 3). */
  @Column('numeric', { name: 'qty_purchased', precision: 14, scale: 3 })
  qtyPurchased: string;

  /** Unidad de compra (kg, L, caja, costal...). No es la unidad base. */
  @Column('text', { name: 'purchase_unit' })
  purchaseUnit: string;

  /** Convierte unidad de compra → unidad base (kg→g = 1000). */
  @Column('numeric', { name: 'factor_to_base', precision: 14, scale: 6 })
  factorToBase: string;

  /** Total pagado (MXN, 2 decimales). */
  @Column('numeric', { name: 'total_cost', precision: 14, scale: 2 })
  totalCost: string;

  /** Costo por unidad base = total / (qty × factor). 6 decimales. Congelado. */
  @Column('numeric', { name: 'unit_cost', precision: 14, scale: 6 })
  unitCost: string;

  /** Proveedor como texto (suficiente para negociar; una tabla de proveedores es otra cosa). */
  @Column('text', { nullable: true })
  supplier: string | null;

  /** Caducidad (FEFO: qué lote físico sacar primero). */
  @Column('timestamptz', { name: 'expires_at', nullable: true })
  expiresAt: Date | null;

  @Column('timestamptz', { name: 'purchased_at' })
  purchasedAt: Date;

  /** Quién registró (email/sub del actor, para auditoría). */
  @Column('text', { name: 'registered_by' })
  registeredBy: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
