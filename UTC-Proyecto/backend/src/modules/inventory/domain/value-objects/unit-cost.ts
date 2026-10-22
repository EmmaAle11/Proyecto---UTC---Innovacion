import { ValueObject } from '../../../../kernel/domain/ValueObject';
import { DomainError } from '../../../../kernel/domain/DomainError';

/**
 * Costo por unidad base (g | ml | pza) de un insumo. Invariante: no negativo, precisión de
 * SEIS decimales (plan 04 D2 / motor-de-costeo §4): un aceite de $37/L son $0.037000/ml, y con
 * 2 decimales ($0.04) el error es ~8% por plato.
 *
 * Se almacena en MICRO-UNIDADES ENTERAS (monto × 1e6) para eliminar el float drift igual que
 * `Money` usa centavos. El redondeo a 6 decimales ocurre UNA sola vez, en `of()`. El redondeo a
 * 2 decimales (dinero real) se hace SOLO al final, sobre el total de una línea — nunca por gramo.
 */
const MICRO = 1_000_000;

export class UnitCost extends ValueObject<number> {
  private constructor(micros: number) {
    super(micros);
  }

  /** Factory validante desde un monto decimal (p. ej. 0.037 → 37000 micros). */
  static of(amount: number): UnitCost {
    if (!Number.isFinite(amount)) {
      throw new DomainError('Costo unitario inválido');
    }
    if (amount < 0) {
      throw new DomainError('El costo unitario no puede ser negativo');
    }
    return new UnitCost(Math.round(amount * MICRO));
  }

  static zero(): UnitCost {
    return new UnitCost(0);
  }

  /** Costo de una cantidad (en unidad base) a este costo unitario. Devuelve micros exactos. */
  private microsFor(baseQty: number): number {
    return this.props * baseQty;
  }

  /** Monto decimal con 6 decimales (para persistir en NUMERIC(14,6)). */
  get amount(): number {
    return this.props / MICRO;
  }

  /** Representación `"0.037000"` lista para columnas `numeric(14,6)` de Postgres. */
  toString(): string {
    return this.amount.toFixed(6);
  }

  /**
   * Costo en dinero real (2 decimales) de `baseQty` unidades a este costo unitario.
   * Redondea UNA sola vez, al final de la línea (plan 04 R5). Devuelve un `number` con 2 decimales.
   */
  lineTotal(baseQty: number): number {
    if (!Number.isFinite(baseQty) || baseQty < 0) {
      throw new DomainError('Cantidad base inválida');
    }
    return Math.round(this.microsFor(baseQty) / MICRO / 0.01) * 0.01;
  }
}
