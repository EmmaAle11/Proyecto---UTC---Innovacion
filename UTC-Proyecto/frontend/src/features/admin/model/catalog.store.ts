import { create } from 'zustand';
import { ADMIN_PRODUCTS, type AdminProduct } from '../../../entities/product/admin-mock';
import type { ProductStatus } from '../../../entities/product/model/types';

interface CatalogState {
  products: AdminProduct[];
  /** Alterna disponibilidad (toggle de la lista). Solo memoria (demo). */
  toggleAvailable: (id: string) => void;
  /** Crea o actualiza un producto (alta/edición del formulario). */
  upsert: (p: AdminProduct) => void;
  /** Aplica reoferta / "Pon tu precio" (§3.11): fija reoffer_price y estado. */
  applyReoffer: (id: string, reofferPrice: number, status: ProductStatus) => void;
}

/** Catálogo del admin (mock interactivo). El backend lo sustituye en el turno de datos. */
export const useCatalogStore = create<CatalogState>((set) => ({
  products: ADMIN_PRODUCTS,
  toggleAvailable: (id) =>
    set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, isAvailable: !p.isAvailable } : p)) })),
  upsert: (p) =>
    set((s) => {
      const exists = s.products.some((x) => x.id === p.id);
      return { products: exists ? s.products.map((x) => (x.id === p.id ? p : x)) : [...s.products, p] };
    }),
  applyReoffer: (id, reofferPrice, status) =>
    set((s) => ({ products: s.products.map((p) => (p.id === id ? { ...p, reofferPrice, status } : p)) })),
}));
