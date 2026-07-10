/**
 * kernel — Value Object: objeto de dominio SIN identidad, definido por su VALOR e INMUTABLE.
 * Dos VOs son iguales si sus valores son iguales (a diferencia de Entity, igual por id).
 * Puro: sin NestJS, sin TypeORM. Las subclases validan en su factory y lanzan DomainError.
 */
export abstract class ValueObject<T> {
  protected constructor(protected readonly props: T) {}

  /** Igualdad estructural por valor (los VOs de este proyecto envuelven un primitivo). */
  equals(other?: ValueObject<T>): boolean {
    if (other == null) return false;
    if (other.constructor !== this.constructor) return false;
    return this.props === other.props;
  }
}
