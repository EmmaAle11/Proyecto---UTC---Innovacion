import { create } from 'zustand';
import type { Product } from '../../../entities/product/model/types';
import { fetchProducts } from '../../../entities/product/api';
import { PRODUCTS } from '../../../entities/product/mock';

/**
 * Catálogo del cliente, compartido entre Inicio y Detalle (mismos productos, mismos
 * ids). Carga desde `GET /products`; si el backend no responde, cae al mock (demo)
 * para no dejar la pantalla vacía. Como Home y ProductScreen leen de aquí, los ids
 * son siempre consistentes (no se mezclan UUID reales con ids del mock).
 */
interface CatalogState {
  products: Product[];
  loading: boolean;
  loaded: boolean;
  load: (token?: string) => Promise<void>;
  getById: (id: string) => Product | undefined;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  loading: false,
  loaded: false,
  load: async (token) => {
    if (get().loading) return; // de-dup: Home y ProductScreen pueden pedirlo a la vez
    set({ loading: true });
    try {
      const rows = await fetchProducts(token);
      set({ products: rows, loaded: true });
    } catch (e) {
      console.warn('[catalog] fallback a mock:', e instanceof Error ? e.message : e);
      set({ products: PRODUCTS, loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  getById: (id) => get().products.find((p) => p.id === id),
}));
