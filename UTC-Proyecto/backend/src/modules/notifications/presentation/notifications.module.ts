import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationEntity } from '../../../infrastructure/database/entities/notification.entity';
import { NotificationsService } from '../application/notifications.service';
import { OrderEventsHandler } from '../infrastructure/order-events.handler';
import { NotificationsController } from './notifications.controller';

/**
 * Bounded context `notifications` (D-045). Consume los Domain Events de orders (via el
 * `DomainEventDispatcher` global) y los materializa en el outbox; expone la lectura al cliente.
 * `OrderEventsHandler` se auto-registra en el dispatcher al iniciar (OnModuleInit).
 */
@Module({
  imports: [TypeOrmModule.forFeature([NotificationEntity])],
  controllers: [NotificationsController],
  providers: [NotificationsService, OrderEventsHandler],
})
export class NotificationsModule {}
