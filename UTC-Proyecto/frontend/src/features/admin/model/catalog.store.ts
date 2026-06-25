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
  /** Carga el catálogo desde `GET /products`; cae al mock si el backend no responde (demo). */
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
  /** Reoferta / "Pon tu precio" (§3.11): fija reoffer_price + estado. */
  applyReoffer: (
    id: string,
    reofferPrice: number,
    status: ProductStatus,
    token?: string,
  ) => Promise<void>;
}

/** Catálogo del admin contra el backend (fuente de verdad: la respuesta reemplaza el local). */
export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  loading: false,
  loaded: false,

  load: async (token) => {
    if (get().loading) return; // de-dup
    set({ loading: true });
    try {
      const rows = await fetchAdminProducts(token);
      set({ products: rows, loaded: true });
    } catch (e) {
      console.warn(
        '[admin/catalog] fallback a mock:',
        e instanceof Error ? e.message : e,
      );
      set({ products: ADMIN_PRODUCTS, loaded: true });
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
    const updated = await updateProduct(id, { reofferPrice, status }, token);
    set((s) => ({
      products: s.products.map((p) => (p.id === id ? updated : p)),
    }));
  },
}));
