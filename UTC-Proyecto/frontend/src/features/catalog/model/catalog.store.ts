import { create } from 'zustand';
import type { Product } from '../../../entities/product/model/types';
import { fetchProducts } from '../../../entities/product/api';
import { PRODUCTS } from '../../../entities/product/mock';
import {
  createCatalogLoader,
  type LoadableCatalogState,
} from '../../../shared/lib/catalog-loader';

/**
 * Catálogo del cliente, compartido entre Inicio y Detalle (mismos productos, mismos
 * ids). Carga desde `GET /products` vía `createCatalogLoader` (política BR-015
 * compartida con el admin). Como Home y ProductScreen leen de aquí, los ids son
 * siempre consistentes (no se mezclan UUID reales con ids del mock).
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
    PRODUCTS,
    'catalog',
  ),
  getById: (id) => get().products.find((p) => p.id === id),
}));
