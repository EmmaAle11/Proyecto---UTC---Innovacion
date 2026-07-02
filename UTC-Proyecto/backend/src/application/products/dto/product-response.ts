import { ProductEntity } from '../../../infrastructure/database/entities/product.entity';
import { ProductStatus } from '../../../infrastructure/database/entities/enums';

/**
 * Contrato del catálogo expuesto al cliente. Refleja el esquema (architecture §5)
 * con el dinero ya como `number` (las columnas `numeric` se mapean a `string` en
 * TypeORM; aquí se normalizan para que el frontend no lidie con strings).
 */
export interface ProductResponse {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  imageUrl: string | null;
  basePrepTimeSeconds: number;
  stock: number;
  minStock: number;
  maxStock: number | null;
  status: ProductStatus;
  isAvailable: boolean;
  reofferPrice: number | null;
  statusChangedAt: string; // ISO: desde cuándo está en su estado actual (B5, §3.7)
}

/** Mapea la entidad persistida al contrato de API (numeric `string` → `number`). */
export function toProductResponse(p: ProductEntity): ProductResponse {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    price: Number(p.price),
    category: p.category,
    imageUrl: p.imageUrl,
    basePrepTimeSeconds: p.basePrepTimeSeconds,
    stock: p.stock,
    minStock: p.minStock,
    maxStock: p.maxStock,
    status: p.status,
    isAvailable: p.isAvailable,
    reofferPrice: p.reofferPrice === null ? null : Number(p.reofferPrice),
    statusChangedAt: p.statusChangedAt.toISOString(),
  };
}
