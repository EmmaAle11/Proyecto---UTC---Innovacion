import { DomainError } from '../../../kernel/domain/DomainError';

/**
 * Invariantes del catálogo (BR-006/BR-011). Reglas de dominio puras — sin Nest, sin
 * TypeORM. Antes vivían DUPLICADAS en ProductsService.create y .update; aquí viven UNA
 * vez y no se pueden volver a perder. La presentación/app mapea DomainError → 400 (D-039).
 *
 * ponytail: es una policy (función), NO un agregado. `products` es CRUD con dos guardas de
 * campo, no un límite de consistencia con ciclo de vida (a diferencia de Order). Un agregado
 * de ~14 campos aquí sería plomería sin payoff (regla 44/46, decision-matrix).
 */
export interface ProductInvariantFields {
  readonly price: number;
  readonly reofferPrice: number | null;
  readonly minStock: number;
  readonly maxStock: number | null;
}

export function assertProductInvariants(f: ProductInvariantFields): void {
  if (f.maxStock != null && f.maxStock < f.minStock) {
    throw new DomainError('max_stock debe ser mayor o igual a min_stock');
  }
  if (f.reofferPrice != null && f.reofferPrice >= f.price) {
    throw new DomainError('La reoferta debe ser menor al precio');
  }
}
