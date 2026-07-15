import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../../../infrastructure/database/entities/order.entity';
import { OrderItemEntity } from '../../../infrastructure/database/entities/order-item.entity';
import { PaymentEntity } from '../../../infrastructure/database/entities/payment.entity';
import { ProductEntity } from '../../../infrastructure/database/entities/product.entity';
import { UserProfileEntity } from '../../../infrastructure/database/entities/user-profile.entity';
import { PreparationTimeEntity } from '../../../infrastructure/database/entities/preparation-time.entity';
import { AppSettingsEntity } from '../../../infrastructure/database/entities/app-settings.entity';
import { FinishedGoodEntity } from '../../../infrastructure/database/entities/finished-good.entity';
import { StockMovementEntity } from '../../../infrastructure/database/entities/stock-movement.entity';
import { OrdersService } from '../application/orders.service';
import { OrderExpiryScheduler } from '../application/order-expiry.scheduler';
import { PaymentGatewayService } from '../../../application/payments/payment-gateway.service';
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
      FinishedGoodEntity,
      StockMovementEntity,
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
