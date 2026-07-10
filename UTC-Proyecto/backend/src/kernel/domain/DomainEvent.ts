/**
 * kernel — Domain Event: algo relevante que YA ocurrió en el dominio (nombre en pasado).
 * Lo emite un AggregateRoot (via `record`) y lo despacha el adapter tras persistir, DENTRO
 * de la misma transacción (ver shared/events/DomainEventDispatcher). Puro: sin framework.
 */
export abstract class DomainEvent {
  /**
   * Discriminador ESTABLE del evento (p. ej. 'order.readied'). Se persiste y se usa para
   * rutear/de-duplicar; no debe cambiar aunque se renombre la clase.
   */
  abstract readonly eventType: string;

  /** Hora del suceso = hora del servidor (BR-005); se inyecta para mantener el dominio determinista. */
  constructor(public readonly occurredAt: Date) {}
}
