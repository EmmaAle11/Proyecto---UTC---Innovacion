import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  VersionColumn,
} from 'typeorm';
import { IngredientBaseUnit } from './enums';

/**
 * Insumo / materia prima (plan 04). Unidad BASE inmutable (g|ml|pza, la "báscula única").
 * El stock es un SALDO cacheado; la verdad es el ledger `ingredient_movements` (append-only).
 * `avg_unit_cost` = CPP (costo promedio ponderado, decisión F0 2026-10-21) con 6 decimales.
 */
@Entity('ingredients')
@Check(`"base_unit" IN ('g', 'ml', 'pza')`)
@Check(`"yield_pct" > 0 AND "yield_pct" <= 1`)
@Check(`"stock" >= 0`)
@Check(`"avg_unit_cost" >= 0`)
@Check(`"min_stock" >= 0`)
export class IngredientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  name: string;

  /** Unidad base de medida (g | ml | pza). kg/L son de compra, no de medida. */
  @Column('text', { name: 'base_unit' })
  baseUnit: IngredientBaseUnit;

  /** Rendimiento (yield): 0.55 elote en mazorca, 0.80 corte con hueso, 1.00 carne molida. */
  @Column('numeric', { name: 'yield_pct', precision: 5, scale: 4, default: 1 })
  yieldPct: string;

  /** FALSE = no entra en disponibilidad (la sal, §5 del plan 04), pero SÍ costea. */
  @Column('boolean', { name: 'track_stock', default: true })
  trackStock: boolean;

  /** Tasa de IVA del insumo (0.00 casi todo el alimento; 0.16 desechables/concentrados). */
  @Column('numeric', { name: 'iva_rate', precision: 5, scale: 4, default: 0 })
  ivaRate: string;

  /** Saldo cacheado en unidad base; CHECK >= 0 (BR-011). El ledger es la verdad. */
  @Column('numeric', { name: 'stock', precision: 14, scale: 3, default: 0 })
  stock: string;

  @Column('numeric', { name: 'min_stock', precision: 14, scale: 3, default: 0 })
  minStock: string;

  @Column('numeric', {
    name: 'max_stock',
    precision: 14,
    scale: 3,
    nullable: true,
  })
  maxStock: string | null;

  /** Costo promedio ponderado (CPP) por unidad base. 6 decimales (un aceite $37/L = $0.037/ml). */
  @Column('numeric', {
    name: 'avg_unit_cost',
    precision: 14,
    scale: 6,
    default: 0,
  })
  avgUnitCost: string;

  @Column('boolean', { name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
