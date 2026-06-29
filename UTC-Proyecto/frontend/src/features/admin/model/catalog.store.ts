import { create } from 'zustand';
import {
  ADMIN_PRODUCTS,
  type AdminProduct,
} from '../../../entities/product/admin-mock';
import type { ProductStatus } from '../../../entities/product/model/types';
import {
  fetchAdminProducts,
  createProduct,
  updateProduct,
  type ProductWritePayload,
} from '../../../entities/product/admin-api';

interface CatalogState {
  products: AdminProduct[];
  loading: boolean;
  loaded: boolean;
  error: boolean;
  /** Carga el catálogo desde `GET /products`; en dev cae al mock, en prod marca `error` (BR-015). */
  load: (token?: string) => Promise<void>;
  /** Alta (`POST /products`). */
  create: (payload: ProductWritePayload, token?: string) => Promise<void>;
  /** Edición parcial (`PATCH /products/:id`). */
  update: (
    id: string,
    patch: Partial<ProductWritePayload>,
    token?: string,
  ) => Promise<void>;
  /** Alterna disponibilidad (optimista: revierte si el backend falla). */
  toggleAvailable: (id: string, token?: string) => Promise<void>;
  /**
   * Reoferta / "Pon tu precio" (§3.11): fija reoffer_price + estado. Pasa
   * `reofferPrice: null` para QUITAR la reoferta (el backend la limpia; no toca estado).
   */
  applyReoffer: (
    id: string,
    reofferPrice: number | null,
    status: ProductStatus,
    token?: string,
  ) => Promise<void>;
}

/** Catálogo del admin contra el backend (fuente de verdad: la respuesta reemplaza el local). */
export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  loading: false,
  loaded: false,
  error: false,

  load: async (token) => {
    if (get().loading) return; // de-dup
    set({ loading: true, error: false });
    try {
      const rows = await fetchAdminProducts(token);
      set({ products: rows, loaded: true });
    } catch (e) {
      console.warn(
        '[admin/catalog] error al cargar:',
        e instanceof Error ? e.message : e,
      );
      // En prod NO caemos al mock: el admin operaría sobre ids ficticios ('1'..'10')
      // y un PATCH/POST posterior referenciaría productos inexistentes (BR-015).
      if (__DEV__) {
        set({ products: ADMIN_PRODUCTS, loaded: true });
      } else {
        set({ products: [], loaded: true, error: true });
      }
    } finally {
      set({ loading: false });
    }
  },

  create: async (payload, token) => {
    const created = await createProduct(payload, token);
    set((s) => ({ products: [...s.products, created] }));
  },

  update: async (id, patch, token) => {
    const updated = await updateProduct(id, patch, token);
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },

  toggleAvailable: async (id, token) => {
    const current = get().products.find((p) => p.id === id);
    if (!current) return;
    const next = !current.isAvailable;
    // Optimista: refleja al instante.
    set((s) => ({
      products: s.products.map((p) =>
        p.id === id ? { ...p, isAvailable: next } : p,
      ),
    }));
    try {
      const updated = await updateProduct(id, { isAvailable: next }, token);
      set((s) => ({
        products: s.products.map((p) => (p.id === id ? updated : p)),
      }));
    } catch (e) {
      console.warn(
        '[admin/catalog] revertir toggle:',
        e instanceof Error ? e.message : e,
      );
      set((s) => ({
        products: s.products.map((p) =>
          p.id === id ? { ...p, isAvailable: current.isAvailable } : p,
        ),
      }));
    }
  },

  applyReoffer: async (id, reofferPrice, status, token) => {
    // `null` limpia la reoferta (sin tocar el estado); un número la fija junto al estado.
    const patch =
      reofferPrice === null ? { reofferPrice: null } : { reofferPrice, status };
    const updated = await updateProduct(id, patch, token);
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },
}));
