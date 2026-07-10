import { getJson } from '../../shared/api/client';
import type { Product, ProductStatus } from './model/types';
import { iconForProduct } from './icons';

/**
 * Forma cruda del backend (`GET /products` → `ProductResponse`). El dinero ya
 * viene como `number`; `icon`/`readySinceMin` son de display y los pone el front.
 */
export interface ApiProduct {
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
  statusChangedAt: string;
}

/** Estados "preparados" para los que tiene sentido mostrar "preparado hace X min" (B5). */
const PREPARED_STATUSES: ProductStatus[] = ['preparado', 'sin_tiempo_espera', 'calentando'];

function toProduct(a: ApiProduct): Product {
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    price: a.price,
    reofferPrice: a.reofferPrice,
    basePrepTimeSeconds: a.basePrepTimeSeconds,
    status: a.status,
    isAvailable: a.isAvailable,
    // B5 (§3.7): minutos desde que entró a su estado preparado (real, `status_changed_at`).
    readySinceMin: PREPARED_STATUSES.includes(a.status)
      ? Math.max(0, Math.round((Date.now() - new Date(a.statusChangedAt).getTime()) / 60000))
      : null,
    description: a.description ?? '',
    imageUrl: a.imageUrl,
    icon: iconForProduct(a.name, a.category),
  };
}

/** Catálogo real (`GET /products`). Requiere `token` (guard JWT global). */
export async function fetchProducts(token?: string): Promise<Product[]> {
  const rows = await getJson<ApiProduct[]>('/products', token);
  return rows.map(toProduct);
}
