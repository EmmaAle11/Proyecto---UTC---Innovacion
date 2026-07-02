/**
 * Circuit breaker (BR-010 / C4): protege una dependencia frágil (aquí, la pasarela
 * de pago) para no seguir golpeándola cuando ya está fallando. Tres estados:
 *
 *  - `closed`    → pasa las llamadas; cuenta fallos consecutivos.
 *  - `open`      → al llegar al umbral de fallos, corta: rechaza AL INSTANTE durante
 *                  `cooldownMs` (fail-fast, no espera timeouts).
 *  - `half_open` → pasado el enfriamiento, deja pasar llamada(s) de prueba: si van
 *                  bien, cierra; si una falla, vuelve a abrir. (Breaker simple: no
 *                  limita a UNA sonda concurrente; con la pasarela simulada síncrona
 *                  no hay ventana. Para una pasarela real conviene un semáforo de 1.)
 *
 * `now` es inyectable para poder probar el enfriamiento sin relojes reales.
 */
export type CircuitState = 'closed' | 'open' | 'half_open';

export class CircuitOpenError extends Error {
  constructor(message = 'Servicio de pago no disponible, intenta en un momento') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

export interface CircuitBreakerOptions {
  /** Fallos consecutivos para abrir el circuito. */
  failureThreshold: number;
  /** Milisegundos que el circuito permanece abierto antes de probar (half-open). */
  cooldownMs: number;
  /** Reloj inyectable (default `Date.now`). */
  now?: () => number;
}

export class CircuitBreaker {
  private state: CircuitState = 'closed';
  private failures = 0;
  private openedAt = 0;
  private readonly now: () => number;

  constructor(private readonly opts: CircuitBreakerOptions) {
    this.now = opts.now ?? (() => Date.now());
  }

  /** Estado actual (recalcula el paso a half-open si ya pasó el enfriamiento). */
  get currentState(): CircuitState {
    if (this.state === 'open' && this.now() - this.openedAt >= this.opts.cooldownMs) {
      return 'half_open';
    }
    return this.state;
  }

  /** Ejecuta `fn` respetando el circuito. Lanza `CircuitOpenError` si está abierto. */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.now() - this.openedAt < this.opts.cooldownMs) {
        throw new CircuitOpenError();
      }
      this.state = 'half_open'; // toca probar
    }
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
  }

  private onFailure(): void {
    this.failures += 1;
    // En half-open cualquier fallo reabre; en closed, al llegar al umbral.
    if (this.state === 'half_open' || this.failures >= this.opts.failureThreshold) {
      this.state = 'open';
      this.openedAt = this.now();
    }
  }
}
