import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrderEntity } from '../../infrastructure/database/entities/order.entity';
import { OrderItemEntity } from '../../infrastructure/database/entities/order-item.entity';
import { PaymentEntity } from '../../infrastructure/database/entities/payment.entity';
import { ProductEntity } from '../../infrastructure/database/entities/product.entity';
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import { OrdersService } from '../../application/orders/orders.service';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      OrderEntity,
      OrderItemEntity,
      PaymentEntity,
      ProductEntity,
      UserProfileEntity,
    ]),
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
