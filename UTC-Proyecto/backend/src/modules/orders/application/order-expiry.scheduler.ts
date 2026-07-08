import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { OrdersService } from './orders.service';

/** Cada cuánto se barre la cola en busca de recogidas vencidas (E6/§3.8). */
const SWEEP_INTERVAL_MS = 60 * 1000;

/**
 * Barredor de la ventana de recogida (E6/§3.8): cada minuto marca `not_picked_up`
 * los pedidos `ready` cuyo `pickup_deadline` ya pasó. Sin dependencia de scheduler
 * externo (setInterval con `unref` para no bloquear el cierre del proceso).
 */
@Injectable()
export class OrderExpiryScheduler implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(OrderExpiryScheduler.name);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(private readonly orders: OrdersService) {}

  onModuleInit(): void {
    this.timer = setInterval(() => {
      void this.sweep();
    }, SWEEP_INTERVAL_MS);
    // No debe mantener vivo el proceso por sí solo (tests, shutdown).
    this.timer.unref?.();
  }

  onModuleDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  private async sweep(): Promise<void> {
    try {
      const n = await this.orders.expireOverdue();
      if (n > 0) this.logger.log(`Ventana vencida: ${n} pedido(s) → not_picked_up`);
    } catch (e) {
      this.logger.warn(
        `No se pudo barrer recogidas vencidas: ${e instanceof Error ? e.message : e}`,
      );
    }
  }
}
