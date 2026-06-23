import type { Product } from './model/types';

/** Categorías del feed (incluye "Todo"). */
export const CATEGORIES = ['Todo', 'Aguas frescas', 'Quesadillas', 'Hamburguesas', 'Papas', 'Snacks', 'Postres', 'Combos'];

/** Catálogo demo (espejo del kit app-mostrador). Reemplazable por `GET /products`. */
export const PRODUCTS: Product[] = [
  { id: '1', name: 'Quesadilla de tinga', category: 'Quesadillas', price: 38, basePrepTimeSeconds: 720, status: 'por_preparar', isAvailable: true, readySinceMin: null, popular: true, icon: 'utensils-crossed', description: 'Tortilla de maíz hecha al momento, tinga de pollo, queso oaxaca derretido y crema.' },
  { id: '2', name: 'Combo estudiante', category: 'Combos', price: 50, basePrepTimeSeconds: 780, status: 'por_preparar', isAvailable: true, readySinceMin: null, popular: true, icon: 'package', description: 'Quesadilla a elegir + agua fresca natural del día. El antojo completo del recreo.' },
  { id: '3', name: 'Hamburguesa de la casa', category: 'Hamburguesas', price: 65, basePrepTimeSeconds: 900, status: 'por_preparar', isAvailable: true, readySinceMin: null, popular: true, icon: 'beef', description: 'Doble carne, queso amarillo, tocino y aderezo especial de la cooperativa.' },
  { id: '4', name: 'Papas con queso', category: 'Papas', price: 32, basePrepTimeSeconds: 480, status: 'por_preparar', isAvailable: true, readySinceMin: null, icon: 'utensils', description: 'Papas a la francesa bañadas en queso amarillo fundido.' },
  { id: '5', name: 'Agua de jamaica', category: 'Aguas frescas', price: 18, basePrepTimeSeconds: 0, status: 'sin_tiempo_espera', isAvailable: true, readySinceMin: 4, icon: 'cup-soda', description: 'Agua fresca de flor de jamaica, natural y bien fría.' },
  { id: '6', name: 'Boneless BBQ', category: 'Snacks', price: 58, basePrepTimeSeconds: 840, status: 'por_preparar', isAvailable: true, readySinceMin: null, icon: 'drumstick', description: 'Trozos de pollo empanizado bañados en salsa BBQ, con aderezo ranch.' },
  { id: '7', name: 'Papas a la francesa', category: 'Papas', price: 28, basePrepTimeSeconds: 420, status: 'por_preparar', isAvailable: true, readySinceMin: null, icon: 'utensils', description: 'Clásicas, doraditas y crujientes, con sal al gusto.' },
  { id: '8', name: 'Esquites en vaso', category: 'Snacks', price: 22, basePrepTimeSeconds: 360, status: 'por_preparar', isAvailable: true, readySinceMin: null, icon: 'soup', description: 'Granos de elote tierno, mayonesa, queso, limón y chile.' },
  { id: '9', name: 'Gelatina de mosaico', category: 'Postres', price: 15, basePrepTimeSeconds: 0, status: 'sin_tiempo_espera', isAvailable: true, readySinceMin: 9, icon: 'cake-slice', description: 'Gelatina de leche con cubos de colores. Postre fresquito.' },
  { id: '10', name: 'Agua de horchata', category: 'Aguas frescas', price: 18, basePrepTimeSeconds: 0, status: 'preparado', isAvailable: true, readySinceMin: null, icon: 'cup-soda', description: 'Horchata de arroz con canela, dulce y cremosa.' },
];
