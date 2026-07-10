import { Global, Module } from '@nestjs/common';
import { DomainEventDispatcher } from './domain-event-dispatcher';

/**
 * Módulo GLOBAL del despachador de Domain Events: un único dispatcher compartido por el
 * productor (orders) y los consumidores (notifications) sin acoplarlos entre sí. Global
 * porque el dispatcher es infraestructura transversal, como el logging/audit.
 */
@Global()
@Module({
  providers: [DomainEventDispatcher],
  exports: [DomainEventDispatcher],
})
export class EventsModule {}
