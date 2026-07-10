import { getJson, postJson, patchJson } from '../../shared/api/client';
import type { ApiProduct } from './api';
import type { AdminProduct } from './admin-types';
import type { ProductStatus } from './model/types';
import { iconForProduct } from './icons';

/** Mapea el producto del backend al shape admin (todos los campos + ícono derivado). */
function toAdminProduct(a: ApiProduct): AdminProduct {
  return {
    id: a.id,
    name: a.name,
    description: a.description ?? '',
    price: a.price,
    category: a.category,
    basePrepTimeSeconds: a.basePrepTimeSeconds,
    stock: a.stock,
    minStock: a.minStock,
    maxStock: a.maxStock,
    status: a.status,
    isAvailable: a.isAvailable,
    reofferPrice: a.reofferPrice,
    imageUrl: a.imageUrl,
    icon: iconForProduct(a.name, a.category),
  };
}

/** Cuerpo de alta/edición: SOLO los campos del DTO del backend (sin `id`/`icon`). */
export interface ProductWritePayload {
  name: string;
  description?: string;
  price: number;
  category: string;
  basePrepTimeSeconds: number;
  stock?: number;
  minStock?: number;
  maxStock?: number | null;
  status: ProductStatus;
  isAvailable?: boolean;
  /** `null` limpia la reoferta; un número (> 0) la fija. El backend ya lo soporta. */
  reofferPrice?: number | null;
  /** F1: URL de la foto del producto (http/https). El backend ya guarda `image_url`. */
  imageUrl?: string | null;
}

/** Catálogo completo para el admin (mismo `GET /products`; incluye no disponibles). */
export async function fetchAdminProducts(token?: string): Promise<AdminProduct[]> {
  const rows = await getJson<ApiProduct[]>('/products', token);
  return rows.map(toAdminProduct);
}

/** Alta (`POST /products`, admin). */
export async function createProduct(
  payload: ProductWritePayload,
  token?: string,
): Promise<AdminProduct> {
  return toAdminProduct(await postJson<ApiProduct>('/products', payload, token));
}

/** Edición parcial (`PATCH /products/:id`, admin). */
export async function updateProduct(
  id: string,
  patch: Partial<ProductWritePayload>,
  token?: string,
): Promise<AdminProduct> {
  return toAdminProduct(
    await patchJson<ApiProduct>(`/products/${id}`, patch, token),
  );
}
