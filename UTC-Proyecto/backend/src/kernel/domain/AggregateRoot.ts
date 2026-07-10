import { Entity } from './Entity';

/**
 * Raíz de agregado: la única entidad por la que se entra a un grupo consistente de objetos
 * y que protege sus invariantes. Hoy es un MARCADOR semántico sobre `Entity` (distingue un
 * agregado de una entidad simple).
 *
 * ponytail: la maquinaria de domain events (record/pullEvents/DomainEvent) se retiró por
 * YAGNI — ningún agregado emitía y nadie despachaba (rung 1). Vuelve, con su dispatcher y un
 * suscriptor real, cuando exista el bounded context `notifications` (bounded-contexts.md).
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {}
