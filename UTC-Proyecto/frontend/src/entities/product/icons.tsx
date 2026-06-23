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
