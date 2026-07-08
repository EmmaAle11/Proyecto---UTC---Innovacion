import { DomainError } from '../../../../kernel/domain/DomainError';
import {
  assertProductInvariants,
  ProductInvariantFields,
} from '../../domain/product.policy';

const base: ProductInvariantFields = {
  price: 50,
  reofferPrice: null,
  minStock: 0,
  maxStock: null,
};

describe('assertProductInvariants (BR-006/BR-011)', () => {
  it('pasa con campos válidos', () => {
    expect(() => assertProductInvariants(base)).not.toThrow();
  });

  it('maxStock >= minStock: rechaza maxStock menor', () => {
    expect(() =>
      assertProductInvariants({ ...base, minStock: 10, maxStock: 5 }),
    ).toThrow(DomainError);
  });

  it('maxStock == minStock: permitido', () => {
    expect(() =>
      assertProductInvariants({ ...base, minStock: 5, maxStock: 5 }),
    ).not.toThrow();
  });

  it('maxStock null: no valida cota superior', () => {
    expect(() =>
      assertProductInvariants({ ...base, minStock: 99, maxStock: null }),
    ).not.toThrow();
  });

  it('reofferPrice < price: rechaza reoferta >= precio', () => {
    expect(() =>
      assertProductInvariants({ ...base, price: 50, reofferPrice: 50 }),
    ).toThrow(DomainError);
    expect(() =>
      assertProductInvariants({ ...base, price: 50, reofferPrice: 60 }),
    ).toThrow(DomainError);
  });

  it('reofferPrice válido (menor al precio): permitido', () => {
    expect(() =>
      assertProductInvariants({ ...base, price: 50, reofferPrice: 30 }),
    ).not.toThrow();
  });
});
