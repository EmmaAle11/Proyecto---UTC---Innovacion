import { DomainError } from '../../../../kernel/domain/DomainError';

/**
 * Identificadores TIPADOS (branded types). En runtime siguen siendo `string` (serializan y
 * viajan a TypeORM sin conversión), pero el compilador impide mezclar un OrderId con un
 * ProductId o pasar un `string` suelto: hay que construirlos con su factory. El mapper es el
 * ÚNICO punto que traduce `string` de BD ↔ id tipado del dominio.
 */

declare const orderIdBrand: unique symbol;
export type OrderId = string & { readonly [orderIdBrand]: true };

declare const productIdBrand: unique symbol;
export type ProductId = string & { readonly [productIdBrand]: true };

/** Valida que un id crudo no venga vacío antes de marcarlo. */
function ensureNonEmpty(value: string, kind: string): void {
  if (typeof value !== 'string' || value.length === 0) {
    throw new DomainError(`${kind} inválido`);
  }
}

export const OrderId = {
  of(value: string): OrderId {
    ensureNonEmpty(value, 'OrderId');
    return value as OrderId;
  },
};

export const ProductId = {
  of(value: string): ProductId {
    ensureNonEmpty(value, 'ProductId');
    return value as ProductId;
  },
};
