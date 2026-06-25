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
  price: number; // MXN
  basePrepTimeSeconds: number;
  status: ProductStatus;
  isAvailable: boolean;
  readySinceMin: number | null; // minutos desde que quedó listo (rail "Listos ahora")
  description: string;
  imageUrl?: string | null; // ruta del asset desde la BD (p. ej. "products/boneless-bbq.png")
  popular?: boolean;
  icon: ProductIconName;
}
