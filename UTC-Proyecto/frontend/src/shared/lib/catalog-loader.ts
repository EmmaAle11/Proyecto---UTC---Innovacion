/**
 * Carga de catálogo compartida por el store del cliente y el del admin.
 *
 * Política única (BR-015): de-dup si ya está cargando; en éxito reemplaza
 * `products`; ante fallo cae al mock **solo en desarrollo** (`__DEV__`) para no
 * dejar la demo vacía; en **producción** deja el catálogo vacío y marca `error`
 * (no se mezclan datos mock con el camino real). Genérico: no importa nada de
 * `entities`/`features` (respeta FSD: `shared` no sube de capa).
 */
export interface LoadableCatalogState<T> {
  products: T[];
  loading: boolean;
  loaded: boolean;
  error: boolean;
}

export function createCatalogLoader<T, S extends LoadableCatalogState<T>>(
  set: (partial: Partial<S>) => void,
  get: () => S,
  fetcher: (token?: string) => Promise<T[]>,
  mock: T[],
  tag: string,
): (token?: string) => Promise<void> {
  return async (token) => {
    if (get().loading) return; // de-dup: varias pantallas pueden pedirlo a la vez
    set({ loading: true, error: false } as Partial<S>);
    try {
      const rows = await fetcher(token);
      set({ products: rows, loaded: true } as Partial<S>);
    } catch (e) {
      console.warn(`[${tag}] error al cargar:`, e instanceof Error ? e.message : e);
      if (__DEV__) {
        set({ products: mock, loaded: true } as Partial<S>); // red de seguridad (demo)
      } else {
        set({ products: [] as T[], loaded: true, error: true } as Partial<S>); // prod: sin mock
      }
    } finally {
      set({ loading: false } as Partial<S>);
    }
  };
}
