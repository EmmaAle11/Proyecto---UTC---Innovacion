import { Global, Module } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

/**
 * Logging/auditoría TRANSVERSAL. `@Global` porque `AuditLogService` se inyecta desde varios
 * bounded contexts (auth, orders) y es cross-cutting (como el dispatcher de eventos). Antes se
 * re-declaraba como provider en cada módulo — AuthModule se quedó sin él y rompía el arranque
 * (DI). Un único provider global lo resuelve para todos y elimina esos duplicados.
 */
@Global()
@Module({
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class LoggingModule {}
