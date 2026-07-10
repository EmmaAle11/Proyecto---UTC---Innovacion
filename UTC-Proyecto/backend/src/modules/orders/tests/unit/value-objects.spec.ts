import { DomainError } from '../../../../kernel/domain/DomainError';
import { Money } from '../../domain/value-objects/money';
import { Quantity } from '../../domain/value-objects/quantity';
import { OrderId, ProductId } from '../../domain/value-objects/ids';

describe('Money (centavos exactos, sin float drift)', () => {
  it('suma sin drift: 0.1 + 0.2 = 0.30 exacto', () => {
    const sum = Money.of(0.1).add(Money.of(0.2));
    expect(sum.amount).toBe(0.3); // con number puro sería 0.30000000000000004
    expect(sum.toString()).toBe('0.30');
  });

  it('times(cantidad) es exacto: 19.99 × 3 = 59.97', () => {
    expect(Money.of(19.99).times(Quantity.of(3)).amount).toBe(59.97);
  });

  it('redondea a 2 decimales al construir', () => {
    expect(Money.of(12.005).amount).toBe(12.01);
  });

  it('toString da formato numeric de Postgres', () => {
    expect(Money.of(38).toString()).toBe('38.00');
  });

  it('rechaza negativo y no-finito (invariante = CHECK de BD)', () => {
    expect(() => Money.of(-1)).toThrow(DomainError);
    expect(() => Money.of(Number.NaN)).toThrow(DomainError);
  });

  it('equals compara por valor', () => {
    expect(Money.of(5).equals(Money.of(5))).toBe(true);
    expect(Money.of(5).equals(Money.of(6))).toBe(false);
  });
});

describe('Quantity (entero ≥ 1, = CHECK quantity > 0)', () => {
  it('acepta enteros ≥ 1', () => {
    expect(Quantity.of(1).value).toBe(1);
    expect(Quantity.of(9).value).toBe(9);
  });

  it('rechaza 0, negativos y no-enteros', () => {
    expect(() => Quantity.of(0)).toThrow(DomainError);
    expect(() => Quantity.of(-2)).toThrow(DomainError);
    expect(() => Quantity.of(1.5)).toThrow(DomainError);
  });
});

describe('OrderId / ProductId (branded, no vacíos)', () => {
  it('construye desde string no vacío y sigue siendo el mismo string en runtime', () => {
    expect(OrderId.of('o1')).toBe('o1');
    expect(ProductId.of('p1')).toBe('p1');
  });

  it('rechaza vacío', () => {
    expect(() => OrderId.of('')).toThrow(DomainError);
    expect(() => ProductId.of('')).toThrow(DomainError);
  });
});
