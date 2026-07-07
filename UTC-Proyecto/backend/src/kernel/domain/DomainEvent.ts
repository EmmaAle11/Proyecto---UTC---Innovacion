/** Algo que ya pasó en el dominio. Nombre en pasado (OrderCancelled). */
export abstract class DomainEvent {
  readonly occurredOn: Date;

  protected constructor(occurredOn: Date = new Date()) {
    this.occurredOn = occurredOn;
  }
}
