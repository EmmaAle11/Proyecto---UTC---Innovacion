import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './presentation/health/health.controller';
import { AuthModule } from './presentation/auth/auth.module';
import { ProductsModule } from './presentation/products/products.module';
import { OrdersModule } from './modules/orders/presentation/orders.module';
import { NotificationsModule } from './modules/notifications/presentation/notifications.module';
import { SettingsModule } from './presentation/settings/settings.module';
import { EventsModule } from './shared/events/events.module';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { JwtAuthGuard } from './presentation/auth/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/auth/guards/roles.guard';
import { LoggingModule } from './shared/logging/logging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]), // default global (rules §8)
    PassportModule,
    DatabaseModule,
    LoggingModule, // AuditLogService global (auth + orders lo inyectan)
    EventsModule, // dispatcher global de Domain Events (orders ▷ notifications)
    AuthModule,
    ProductsModule,
    OrdersModule,
    NotificationsModule,
    SettingsModule,
  ],
  controllers: [HealthController],
  // Orden de guards globales: rate-limit → JWT (autenticación) → roles (autorización).
  providers: [
    JwtStrategy,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
