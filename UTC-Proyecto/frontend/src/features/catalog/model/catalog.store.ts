import { create } from 'zustand';
import type { Product } from '../../../entities/product/model/types';
import { fetchProducts } from '../../../entities/product/api';
import {
  createCatalogLoader,
  type LoadableCatalogState,
} from '../../../shared/lib/catalog-loader';

/**
 * Catálogo del cliente, compartido entre Inicio y Detalle (mismos productos, mismos
 * ids). Carga desde `GET /products` vía `createCatalogLoader` (política BR-015
 * compartida con el admin); el backend es la única fuente (sin datos falsos).
 */
interface CatalogState extends LoadableCatalogState<Product> {
  load: (token?: string) => Promise<void>;
  getById: (id: string) => Product | undefined;
}

export const useCatalogStore = create<CatalogState>((set, get) => ({
  products: [],
  loading: false,
  loaded: false,
  error: false,
  load: createCatalogLoader<Product, CatalogState>(
    set,
    get,
    fetchProducts,
    'catalog',
  ),
  getById: (id) => get().products.find((p) => p.id === id),
}));
