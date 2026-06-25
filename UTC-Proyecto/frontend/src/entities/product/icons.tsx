import {
  Beef,
  CakeSlice,
  CupSoda,
  Drumstick,
  Package,
  Soup,
  Utensils,
  UtensilsCrossed,
  type LucideIcon,
} from 'lucide-react-native';

/** Nombre de display del producto (pista de ícono; el backend usará image_url). */
export type ProductIconName =
  | 'utensils-crossed'
  | 'package'
  | 'beef'
  | 'utensils'
  | 'cup-soda'
  | 'drumstick'
  | 'soup'
  | 'cake-slice';

const MAP: Record<ProductIconName, LucideIcon> = {
  'utensils-crossed': UtensilsCrossed,
  package: Package,
  beef: Beef,
  utensils: Utensils,
  'cup-soda': CupSoda,
  drumstick: Drumstick,
  soup: Soup,
  'cake-slice': CakeSlice,
};

/** Componente de ícono lucide para el nombre de display del producto. */
export function productIcon(name: ProductIconName): LucideIcon {
  return MAP[name] ?? Utensils;
}

/**
 * Deriva el ícono de display desde el nombre/categoría del producto. El backend
 * no guarda ícono (usará `image_url`); mientras tanto se infiere por palabra clave.
 */
export function iconForProduct(name: string, category: string): ProductIconName {
  const n = name.toLowerCase();
  if (/agua|horchata|jamaica|fresca/.test(n)) return 'cup-soda';
  if (/gelatina|postre|flan/.test(n)) return 'cake-slice';
  if (/hamburguesa|burger/.test(n)) return 'beef';
  if (/boneless|alit|pollo|nugget/.test(n)) return 'drumstick';
  if (/esquite|elote|sopa/.test(n)) return 'soup';
  if (/papa|fritas|francesa/.test(n)) return 'utensils';
  if (/quesadilla|taco|antojit/.test(n)) return 'utensils-crossed';
  if (/combo|paquete/.test(n)) return 'package';
  const c = category.toLowerCase();
  if (/bebida|agua/.test(c)) return 'cup-soda';
  if (/postre/.test(c)) return 'cake-slice';
  if (/combo/.test(c)) return 'package';
  if (/snack/.test(c)) return 'soup';
  if (/antojito/.test(c)) return 'utensils-crossed';
  return 'utensils';
}
