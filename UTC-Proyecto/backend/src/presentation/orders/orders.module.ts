import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { OrderItemEntity } from '../../infrastructure/database/entities/order-item.entity';
import { PaymentEntity } from '../../infrastructure/database/entities/payment.entity';
import { ProductEntity } from '../../infrastructure/database/entities/product.entity';
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import { PreparationTimeEntity } from '../../infrastructure/database/entities/preparation-time.entity';
import { AppSettingsEntity } from '../../infrastructure/database/entities/app-settings.entity';
import { OrdersService } from '../../application/orders/orders.service';
import { OrderExpiryScheduler } from '../../application/orders/order-expiry.scheduler';
import { PaymentGatewayService } from '../../application/payments/payment-gateway.service';
import { OrdersController } from './orders.controller';
import { ORDER_REPOSITORY } from '../../domain/order/order.repository';
import { TypeOrmOrderRepository } from '../../modules/orders/infrastructure/persistence/order.repository';

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
    { provide: ORDER_REPOSITORY, useClass: TypeOrmOrderRepository },
  ],
})
export class OrdersModule {}
