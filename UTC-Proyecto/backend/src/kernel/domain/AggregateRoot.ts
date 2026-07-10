import { Entity } from './Entity';
import type { DomainEvent } from './DomainEvent';

/**
 * Raíz de agregado: la única entidad por la que se entra a un grupo consistente de objetos
 * y que protege sus invariantes. Además acumula los Domain Events que ocurren durante sus
 * transiciones; el adapter los extrae con `pullEvents` tras persistir y los despacha DENTRO
 * de la misma transacción (shared/events/DomainEventDispatcher → bounded context notifications).
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _events: DomainEvent[] = [];

  /** Registra un evento ocurrido en el agregado (lo usan las transiciones de la subclase). */
  protected record(event: DomainEvent): void {
    this._events.push(event);
  }

  /** Extrae y LIMPIA los eventos acumulados (idempotente: una segunda llamada da []). */
  pullEvents(): DomainEvent[] {
    const events = this._events;
    this._events = [];
    return events;
  }
}
