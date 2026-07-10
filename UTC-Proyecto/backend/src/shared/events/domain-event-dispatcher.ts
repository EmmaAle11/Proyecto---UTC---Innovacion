import { Injectable } from '@nestjs/common';
import type { EntityManager } from 'typeorm';
import type { DomainEvent } from '../../kernel/domain/DomainEvent';

/**
 * Consumidor de Domain Events. Corre DENTRO de la transacción del productor (recibe su
 * `EntityManager`), de modo que su efecto (p. ej. escribir el outbox) es ATÓMICO con el
 * cambio que originó el evento: o se persiste todo, o nada.
 */
export interface DomainEventHandler {
  handle(event: DomainEvent, manager: EntityManager): Promise<void>;
}

/**
 * Despachador EN PROCESO de Domain Events (Context Map: orders ▷ notifications "por evento,
 * no llamada directa"). Los handlers se AUTO-registran (OCP: se agregan consumidores sin
 * tocar al productor ni al despachador). No hay bus/cola: a esta escala, el despacho síncrono
 * dentro de la tx es suficiente y da atomicidad gratis. Upgrade path: si aparece un consumidor
 * que debe correr fuera de la tx (email, push remoto), se agrega un relay que lee el outbox.
 */
@Injectable()
export class DomainEventDispatcher {
  private readonly handlers: DomainEventHandler[] = [];

  register(handler: DomainEventHandler): void {
    this.handlers.push(handler);
  }

  /** Despacha cada evento a cada handler, en la tx dada. El orden de handlers es de registro. */
  async dispatch(
    events: readonly DomainEvent[],
    manager: EntityManager,
  ): Promise<void> {
    for (const event of events) {
      for (const handler of this.handlers) {
        await handler.handle(event, manager);
      }
    }
  }
}
