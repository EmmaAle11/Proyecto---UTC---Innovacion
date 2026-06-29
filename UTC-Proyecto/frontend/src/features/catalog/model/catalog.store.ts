import { create } from 'zustand';
import type { Product } from '../../../entities/product/model/types';
import { fetchProducts } from '../../../entities/product/api';
import { PRODUCTS } from '../../../entities/product/mock';

/**
 * Catálogo del cliente, compartido entre Inicio y Detalle (mismos productos, mismos
 * ids). Carga desde `GET /products`. Como Home y ProductScreen leen de aquí, los ids
 * son siempre consistentes (no se mezclan UUID reales con ids del mock).
 *
 * Si el backend no responde: SOLO en desarrollo (`__DEV__`) cae al mock para no dejar
 * la pantalla vacía en la demo. En producción NO se mezclan datos mock con el camino
 * real (BR-015): se deja el catálogo vacío y se marca `error` para que la UI lo informe.
 */
interface CatalogState {
  products: Product[];
  loading: boolean;
  loaded: boolean;
  error: boolean;
  load: (token?: string) => Promise<void>;
  getById: (id: string) => Product | undefined;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  loading: false,
  loaded: false,
  error: false,
  load: async (token) => {
    if (get().loading) return; // de-dup: Home y ProductScreen pueden pedirlo a la vez
    set({ loading: true, error: false });
    try {
      const rows = await fetchProducts(token);
      set({ products: rows, loaded: true });
    } catch (e) {
      console.warn('[catalog] error al cargar:', e instanceof Error ? e.message : e);
      if (__DEV__) {
        set({ products: PRODUCTS, loaded: true }); // red de seguridad solo en demo
      } else {
        set({ products: [], loaded: true, error: true }); // prod: sin mock (BR-015)
      }
    } finally {
      set({ loading: false });
    }
  },
  getById: (id) => get().products.find((p) => p.id === id),
}));
