import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../../../infrastructure/database/entities/order.entity';
import { OrderItemEntity } from '../../../infrastructure/database/entities/order-item.entity';
import { PaymentEntity } from '../../../infrastructure/database/entities/payment.entity';
import { ProductEntity } from '../../../infrastructure/database/entities/product.entity';
import { UserProfileEntity } from '../../../infrastructure/database/entities/user-profile.entity';
import { PreparationTimeEntity } from '../../../infrastructure/database/entities/preparation-time.entity';
import { AppSettingsEntity } from '../../../infrastructure/database/entities/app-settings.entity';
import { OrdersService } from '../application/orders.service';
import { OrderExpiryScheduler } from '../application/order-expiry.scheduler';
import { PaymentGatewayService } from '../../../application/payments/payment-gateway.service';
import { AuditLogService } from '../../../shared/logging/audit-log.service';
import { OrdersController } from './orders.controller';
import { ORDER_REPOSITORY } from '../domain/ports/order.repository.port';
import { TypeOrmOrderRepository } from '../infrastructure/persistence/order.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      PaymentEntity,
      ProductEntity,
      UserProfileEntity,
      PreparationTimeEntity,
      AppSettingsEntity,
    ]),
  ],
  controllers: [OrdersController],
  providers: [
    OrdersService,
    OrderExpiryScheduler,
    PaymentGatewayService,
    AuditLogService,
    { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
  ],
})
export class OrdersModule {}
