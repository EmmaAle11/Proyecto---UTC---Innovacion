import { getJson } from '../../shared/api/client';
import type { Product, ProductStatus } from './model/types';
import { iconForProduct } from './icons';

/**
 * Forma cruda del backend (`GET /products` → `ProductResponse`). El dinero ya
 * viene como `number`; `icon`/`readySinceMin` son de display y los pone el front.
 */
interface ApiProduct {
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
}

function toProduct(a: ApiProduct): Product {
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    price: a.price,
    basePrepTimeSeconds: a.basePrepTimeSeconds,
    status: a.status,
    isAvailable: a.isAvailable,
    readySinceMin: null, // display-only; el cálculo real (ready_at) llega con orders
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
