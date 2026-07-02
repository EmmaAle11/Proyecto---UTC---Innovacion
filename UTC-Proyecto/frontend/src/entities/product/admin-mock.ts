import type { ProductStatus } from './model/types';
import type { ProductIconName } from './icons';
import type { BadgeTone } from '../../shared/ui/Badge';

/**
 * Producto del lado ADMIN con TODOS los campos del esquema (architecture §5 /
 * products): espeja el dataset demo (docs/datos/datos-demo.md §2). `id` coincide con
 * el del catálogo del cliente para reusar los assets (productImage/productIcon).
 * Al llegar el turno de datos se reemplaza por `GET /admin/products`.
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
export const PRODUCT_STATUS_META: Record<ProductStatus, { label: string; tone: BadgeTone }> = {
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

export const ADMIN_PRODUCTS: AdminProduct[] = [
  { id: '1', name: 'Quesadilla de tinga', description: 'Tortilla de maíz al momento, tinga de pollo, queso oaxaca derretido y crema.', price: 38, category: 'Antojitos', basePrepTimeSeconds: 720, stock: 0, minStock: 0, maxStock: null, status: 'por_preparar', isAvailable: true, reofferPrice: null, icon: 'utensils-crossed' },
  { id: '2', name: 'Combo estudiante', description: 'Quesadilla a elegir + agua fresca natural del día. El antojo completo del recreo.', price: 50, category: 'Combos', basePrepTimeSeconds: 780, stock: 0, minStock: 0, maxStock: null, status: 'por_preparar', isAvailable: true, reofferPrice: null, icon: 'package' },
  { id: '3', name: 'Hamburguesa de la casa', description: 'Doble carne, queso amarillo, tocino y aderezo especial de la cooperativa.', price: 65, category: 'Antojitos', basePrepTimeSeconds: 900, stock: 0, minStock: 0, maxStock: null, status: 'por_preparar', isAvailable: true, reofferPrice: null, icon: 'beef' },
  { id: '4', name: 'Papas con queso', description: 'Papas a la francesa bañadas en queso amarillo fundido.', price: 32, category: 'Snacks', basePrepTimeSeconds: 480, stock: 3, minStock: 0, maxStock: null, status: 'calentando', isAvailable: true, reofferPrice: 24, icon: 'utensils' },
  { id: '5', name: 'Agua de jamaica', description: 'Agua fresca de flor de jamaica, natural y bien fría.', price: 18, category: 'Bebidas', basePrepTimeSeconds: 30, stock: 24, minStock: 6, maxStock: 40, status: 'sin_tiempo_espera', isAvailable: true, reofferPrice: null, icon: 'cup-soda' },
  { id: '6', name: 'Boneless BBQ', description: 'Trozos de pollo empanizado bañados en salsa BBQ, con aderezo ranch.', price: 58, category: 'Antojitos', basePrepTimeSeconds: 840, stock: 0, minStock: 0, maxStock: null, status: 'por_preparar', isAvailable: true, reofferPrice: null, icon: 'drumstick' },
  { id: '7', name: 'Papas a la francesa', description: 'Clásicas, doraditas y crujientes, con sal al gusto.', price: 28, category: 'Snacks', basePrepTimeSeconds: 420, stock: 0, minStock: 0, maxStock: null, status: 'no_disponible', isAvailable: false, reofferPrice: null, icon: 'utensils' },
  { id: '8', name: 'Esquites en vaso', description: 'Granos de elote tierno, mayonesa, queso, limón y chile.', price: 22, category: 'Snacks', basePrepTimeSeconds: 360, stock: 8, minStock: 4, maxStock: 20, status: 'preparado', isAvailable: true, reofferPrice: null, icon: 'soup' },
  { id: '9', name: 'Gelatina de mosaico', description: 'Gelatina de leche con cubos de colores, fresquita.', price: 15, category: 'Postres', basePrepTimeSeconds: 30, stock: 18, minStock: 6, maxStock: 30, status: 'sin_tiempo_espera', isAvailable: true, reofferPrice: null, icon: 'cake-slice' },
  { id: '10', name: 'Agua de horchata', description: 'Horchata de arroz con canela, dulce y cremosa.', price: 18, category: 'Bebidas', basePrepTimeSeconds: 30, stock: 12, minStock: 6, maxStock: 40, status: 'sin_tiempo_espera', isAvailable: true, reofferPrice: null, icon: 'cup-soda' },
];

export const ADMIN_CATEGORIES = ['Antojitos', 'Snacks', 'Bebidas', 'Postres', 'Combos'];
