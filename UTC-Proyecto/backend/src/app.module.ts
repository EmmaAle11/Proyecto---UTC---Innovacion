import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { PassportModule } from '@nestjs/passport';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './presentation/health/health.controller';
import { AuthModule } from './presentation/auth/auth.module';
import { ProductsModule } from './presentation/products/products.module';
import { OrdersModule } from './presentation/orders/orders.module';
import { SettingsModule } from './presentation/settings/settings.module';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';
import { JwtAuthGuard } from './presentation/auth/guards/jwt-auth.guard';
import { RolesGuard } from './presentation/auth/guards/roles.guard';
import { AuditLogService } from './shared/logging/audit-log.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 60 }]), // default global (rules §8)
    PassportModule,
    DatabaseModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    SettingsModule,
  ],
  controllers: [HealthController],
  // Orden de guards globales: rate-limit → JWT (autenticación) → roles (autorización).
  providers: [
    JwtStrategy,
    AuditLogService, // global: inyectable en cualquier service/controller
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
