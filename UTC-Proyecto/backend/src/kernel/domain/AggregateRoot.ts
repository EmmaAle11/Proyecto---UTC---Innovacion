import { DomainEvent } from './DomainEvent';
import { Entity } from './Entity';

/**
 * Raíz de agregado: entidad que protege invariantes y acumula eventos de dominio.
 * El emisor `record()`; la capa de aplicación/infra hace `pullEvents()` tras persistir.
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _events: DomainEvent[] = [];

  protected record(event: DomainEvent): void {
    this._events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = this._events;
    this._events = [];
    return events;
  }
}
