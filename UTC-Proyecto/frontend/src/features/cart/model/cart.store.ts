import { create } from 'zustand';
import { priceToPay, type Product } from '../../../entities/product/model/types';

export interface CartItem {
  product: Product;
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (product: Product, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
}

/** Carrito en memoria (UI). El checkout real llega en el "turno de datos". */
export const useCartStore = create<CartState>((set) => ({
  items: [],
  add: (product, qty = 1) =>
    set((s) => {
      const exists = s.items.some((it) => it.product.id === product.id);
      if (!exists) return { items: [...s.items, { product, qty }] };
      return { items: s.items.map((it) => (it.product.id === product.id ? { ...it, qty: it.qty + qty } : it)) };
    }),
  setQty: (productId, qty) =>
    set((s) => ({
      items:
        qty <= 0
          ? s.items.filter((it) => it.product.id !== productId)
          : s.items.map((it) => (it.product.id === productId ? { ...it, qty } : it)),
    })),
  clear: () => set({ items: [] }),
}));

/** Selectores derivados (úsalos en las pantallas). */
export const selectCount = (items: CartItem[]): number => items.reduce((n, it) => n + it.qty, 0);
// Cobra el precio de reoferta si está puesto (§3.11), igual que el backend, para que el
// total mostrado coincida con lo cobrado (el backend recalcula y es la fuente de verdad).
export const selectTotal = (items: CartItem[]): number =>
  items.reduce((sum, it) => sum + priceToPay(it.product) * it.qty, 0);
