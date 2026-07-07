/**
 * kernel — abstracción de dominio PURA. Sin NestJS, sin TypeORM.
 * Identidad por id; dos entidades son iguales si comparten id.
 */
export abstract class Entity<TId> {
  protected constructor(public readonly id: TId) {}

  equals(other?: Entity<TId>): boolean {
    return !!other && this.id === other.id;
  }
}
