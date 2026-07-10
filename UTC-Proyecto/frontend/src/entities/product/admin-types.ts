import type { ProductStatus } from './model/types';
import type { ProductIconName } from './icons';
import type { BadgeTone } from '../../shared/ui/Badge';

/**
 * Tipos y constantes de display del producto en el lado ADMIN (vocabulario REAL, lo usa el
 * camino de la API — `admin-api.ts` / pantallas). No es dato falso: la forma `AdminProduct`
 * espeja el esquema (architecture §5) y los metadatos son etiquetas de UI por estado.
 */
export interface AdminProduct {
  id: string;
  name: string;
  description: string;
  price: number; // MXN, numeric(10,2) > 0
  category: string;
  basePrepTimeSeconds: number; // > 0
  stock: number;
  minStock: number;
  maxStock: number | null;
  status: ProductStatus;
  isAvailable: boolean;
  reofferPrice: number | null; // "Pon tu precio" (§3.11)
  imageUrl?: string | null; // F1: URL de la foto (http/https) o slug local
  icon: ProductIconName;
}

/** Etiqueta + tono por estado de producto (enum product_status, círculo §3.6). */
export const PRODUCT_STATUS_META: Record<
  ProductStatus,
  { label: string; tone: BadgeTone }
> = {
  por_preparar: { label: 'Por preparar', tone: 'cooking' },
  preparado: { label: 'Preparado', tone: 'ready' },
  sin_tiempo_espera: { label: 'Listo para llevar', tone: 'ready' },
  calentando: { label: 'Calentando', tone: 'reoffer' },
  no_disponible: { label: 'No disponible', tone: 'neutral' },
};

export const PRODUCT_STATUS_ORDER: ProductStatus[] = [
  'por_preparar',
  'preparado',
  'sin_tiempo_espera',
  'calentando',
  'no_disponible',
];
