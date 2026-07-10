import { ValueObject } from '../../../../kernel/domain/ValueObject';
import { DomainError } from '../../../../kernel/domain/DomainError';
import { Quantity } from './quantity';

/**
 * Dinero en MXN. Invariantes: no negativo y exactamente 2 decimales.
 *
 * Se almacena en CENTAVOS ENTEROS (no en un `number` con decimales) para eliminar el float
 * drift: sumar/multiplicar centavos es aritmética entera exacta, así que `subtotal` y `total`
 * cuadran con el CHECK `subtotal = round(unit_price*quantity,2)` de la BD sin re-redondear.
 * El redondeo ocurre UNA sola vez, al construir con `of()`.
 */
export class Money extends ValueObject<number> {
  private constructor(cents: number) {
    super(cents);
  }

  /** Factory validante desde un monto decimal (p. ej. 12.5 → 1250 centavos). */
  static of(amount: number): Money {
    if (!Number.isFinite(amount)) {
      throw new DomainError('Monto inválido');
    }
    if (amount < 0) {
      throw new DomainError('El monto no puede ser negativo');
    }
    return new Money(Math.round(amount * 100));
  }

  static zero(): Money {
    return new Money(0);
  }

  /** Suma exacta (centavos + centavos). */
  add(other: Money): Money {
    return new Money(this.props + other.props);
  }

  /** Precio unitario × cantidad (entero) → sigue siendo centavos exactos, sin redondear. */
  times(quantity: Quantity): Money {
    return new Money(this.props * quantity.value);
  }

  /** Monto decimal para el borde (persistencia/DTO): centavos → number con 2 decimales. */
  get amount(): number {
    return this.props / 100;
  }

  /** Representación `"12.34"` lista para columnas `numeric` de Postgres. */
  toString(): string {
    return this.amount.toFixed(2);
  }
}
