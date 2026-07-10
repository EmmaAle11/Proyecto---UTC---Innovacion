import { ValueObject } from '../../../../kernel/domain/ValueObject';
import { DomainError } from '../../../../kernel/domain/DomainError';

/**
 * Cantidad de una línea de pedido. Invariante: entero ≥ 1 (§7 "cantidad mayor a 0").
 * Mismo invariante que fuerza el CHECK de BD; aquí lo protege el dominio en el constructor.
 */
export class Quantity extends ValueObject<number> {
  private constructor(value: number) {
    super(value);
  }

  /** Factory validante. Lanza DomainError (la presentación lo mapea a 400, D-039). */
  static of(value: number): Quantity {
    if (!Number.isInteger(value) || value < 1) {
      throw new DomainError('La cantidad debe ser un entero mayor o igual a 1');
    }
    return new Quantity(value);
  }

  get value(): number {
    return this.props;
  }
}
