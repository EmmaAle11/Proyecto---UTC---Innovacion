import type { ProductIconName } from '../icons';

/** Estados del producto (enum `product_status` del esquema, architecture §5). */
export type ProductStatus = 'por_preparar' | 'preparado' | 'sin_tiempo_espera' | 'calentando' | 'no_disponible';

/**
 * Producto del mostrador. Modelado con los nombres del esquema (architecture §5)
 * para que el "turno de datos" sea un swap delgado (mock → `GET /products`).
 * `icon` y `readySinceMin` son de display (el backend usará `image_url` / `ready_at`).
 */
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // MXN (precio de catálogo)
  /** Reoferta "Pon tu precio" (§3.11); si está puesta, es lo que el backend COBRA.
   *  Opcional: el catálogo real siempre la envía (number|null); los mocks la omiten. */
  reofferPrice?: number | null;
  basePrepTimeSeconds: number;
  status: ProductStatus;
  isAvailable: boolean;
  readySinceMin: number | null; // minutos desde que quedó listo (rail "Listos ahora")
  description: string;
  imageUrl?: string | null; // ruta del asset desde la BD (p. ej. "products/boneless-bbq.png")
  popular?: boolean;
  icon: ProductIconName;
}

/**
 * Precio que el cliente PAGA = reoferta si está puesta, si no el de catálogo. Debe
 * coincidir con lo que cobra el backend (`Order.place`: reofferPrice ?? price) para que
 * el total del carrito no diverja de lo cobrado.
 */
export const priceToPay = (p: Pick<Product, 'price' | 'reofferPrice'>): number =>
  p.reofferPrice ?? p.price;
