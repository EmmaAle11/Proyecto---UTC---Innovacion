// Puerto del catálogo de cooperativas (contexto `organization`). Habla en tipos puros:
// resuelve el estado de una sucursal SIN exponer infraestructura. El contexto `orders`
// depende de este puerto para validar la sucursal de recogida (UTC-F1-002, Zero Trust).
//
// `catalog_empty` es un hecho de estado de datos (no una regla): la APLICACIÓN decide qué
// hacer con él (en arranque de una sola cooperativa = permitir). El adapter no decide política.

/** Resolución de una sucursal contra el catálogo. */
export type BranchResolution =
  | 'active' // existe y está activa → recibe pedidos
  | 'not_found' // no existe o está inactiva → fail-closed
  | 'catalog_empty'; // aún no hay cooperativas registradas (bootstrap single-tenant)

export interface ICooperativaCatalog {
  /** Resuelve el estado de `id` contra el catálogo. Una sola operación lógica de lectura. */
  resolveBranch(id: string): Promise<BranchResolution>;
}

export const COOPERATIVA_CATALOG = Symbol('ICooperativaCatalog');
