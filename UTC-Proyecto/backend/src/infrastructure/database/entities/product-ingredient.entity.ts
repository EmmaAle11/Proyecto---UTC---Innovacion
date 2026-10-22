import {
  Check,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { ProductEntity } from './product.entity';
import { IngredientEntity } from './ingredient.entity';

/**
 * Receta: qué insumo y CUÁNTO (en unidad base, `qty_net`) lleva un producto (plan 04).
 * Los dos booleanos expresan las 3 clases de insumo sin máquina de estados:
 *   BASE     (default=true,  customizable=false) → gobierna disponibilidad
 *   ESTÁNDAR (default=true,  customizable=true)  → viene, se puede quitar
 *   EXTRA    (default=false, customizable=true)  → no viene, se puede poner
 * PK compuesta (product_id, ingredient_id).
 */
@Entity('product_ingredients')
@Check(`"qty_net" > 0`)
export class ProductIngredientEntity {
  @PrimaryColumn('uuid', { name: 'product_id' })
  productId: string;

  @PrimaryColumn('uuid', { name: 'ingredient_id' })
  ingredientId: string;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @ManyToOne(() => IngredientEntity, { onDelete: 'RESTRICT', nullable: false })
  @JoinColumn({ name: 'ingredient_id' })
  ingredient: IngredientEntity;

  /** Cantidad NETA en unidad base (500 g). NO un booleano "lleva carne". */
  @Column('numeric', { name: 'qty_net', precision: 14, scale: 3 })
  qtyNet: string;

  @Column('boolean', { name: 'is_default', default: false })
  isDefault: boolean;

  @Column('boolean', { name: 'is_customizable', default: false })
  isCustomizable: boolean;
}
