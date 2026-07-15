import {
  Check,
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { FinishedGoodSource } from './enums';
import { ProductEntity } from './product.entity';

/**
 * Producto TERMINADO / rescatado (D-052, Plan 08): lo que la cocina YA hizo, con vida propia.
 * Es la pieza que rompe el "bucle infinito de reoferta": una unidad no recogida no vuelve al
 * `products.stock` como fresca, sino que nace aquí con `expires_at` (caduca) y, si se reoferta,
 * con `reoffer_price` DE LA UNIDAD (no del producto → no contamina las frescas, bug 2 de D-052).
 * `qty` es el tamaño del lote (una entrada = "cuajé 20"); la venta descuenta 1 y al llegar a 0 se borra.
 */
@Entity('finished_goods')
@Check(`"qty" >= 0`)
@Check(`"reoffer_price" > 0`)
export class FinishedGoodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  /** Sucursal (multi-cooperativa); null = sin sucursal específica. Coherente con orders.branch_id. */
  @Column('text', { name: 'branch_id', nullable: true })
  branchId: string | null;

  @ManyToOne(() => ProductEntity, { onDelete: 'CASCADE', nullable: false })
  @JoinColumn({ name: 'product_id' })
  product: ProductEntity;

  @Column('int')
  qty: number;

  @Column('timestamptz', { name: 'produced_at', default: () => 'now()' })
  producedAt: Date;

  /** ⚠️ Lo que rompe el bucle: al vencer, el barrido de merma la elimina (stock_movements). */
  @Column('timestamptz', { name: 'expires_at' })
  expiresAt: Date;

  @Column('boolean', { name: 'is_reoffer', default: false })
  isReoffer: boolean;

  /** Precio de reoferta DE ESTA UNIDAD (§3.11); null = aún sin precio (el admin lo pone). */
  @Column('numeric', {
    name: 'reoffer_price',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  reofferPrice: string | null;

  /** `text` + CHECK (no enum pg) para crecer sin ALTER. Valores: FinishedGoodSource. */
  @Column('text')
  source: FinishedGoodSource;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
