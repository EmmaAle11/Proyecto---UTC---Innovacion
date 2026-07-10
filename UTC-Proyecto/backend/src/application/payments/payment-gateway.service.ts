import { Injectable, Logger } from '@nestjs/common';
import { PaymentStatus } from '../../domain/enums';
import { CircuitBreaker } from '../../shared/resilience/circuit-breaker';

/**
 * Pasarela de pago (SIMULADA, D-006): autoriza cobros con tarjeta/online. En un caso
 * real aquí iría el fetch a Mercado Pago / PayPal / procesador de tarjeta; hoy se
 * SIMULA la aprobación. Va protegida por un circuit breaker (C4/BR-010): si la
 * pasarela empezara a fallar, el circuito abre y rechaza rápido en vez de encolar
 * timeouts. El efectivo NO pasa por aquí (se cobra en el mostrador).
 */
@Injectable()
export class PaymentGatewayService {
  private readonly logger = new Logger(PaymentGatewayService.name);
  private readonly breaker = new CircuitBreaker({
    failureThreshold: 3,
    cooldownMs: 30_000,
  });

  /** Autoriza el cobro; devuelve el estado de pago. Lanza si la pasarela/circuito rechaza. */
  async authorize(amountMxn: number): Promise<PaymentStatus> {
    await this.breaker.execute(() => this.callGateway(amountMxn));
    return PaymentStatus.PAID;
  }

  /** Estado del circuito (para health/diagnóstico). */
  get circuitState(): string {
    return this.breaker.currentState;
  }

  /**
   * Llamada a la "pasarela". Simulada: aprueba montos válidos. El circuit breaker
   * envuelve esta llamada, así que si en el futuro fuera un fetch real y empezara a
   * fallar, el breaker cortaría tras `failureThreshold` fallos.
   */
  private callGateway(amountMxn: number): Promise<void> {
    if (!Number.isFinite(amountMxn) || amountMxn <= 0) {
      return Promise.reject(new Error('Monto de pago inválido'));
    }
    return Promise.resolve();
  }
}
