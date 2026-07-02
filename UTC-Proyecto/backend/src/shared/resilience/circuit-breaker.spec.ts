import {
  CircuitBreaker,
  CircuitOpenError,
} from './circuit-breaker';

describe('CircuitBreaker (C4/BR-010)', () => {
  const ok = () => Promise.resolve('ok');
  const boom = () => Promise.reject(new Error('gateway caído'));

  it('permanece cerrado y deja pasar mientras no se alcance el umbral', async () => {
    const cb = new CircuitBreaker({ failureThreshold: 3, cooldownMs: 1000 });
    await expect(cb.execute(ok)).resolves.toBe('ok');
    expect(cb.currentState).toBe('closed');
  });

  it('abre tras N fallos consecutivos y luego rechaza al instante (fail-fast)', async () => {
    let t = 0;
    const cb = new CircuitBreaker({ failureThreshold: 2, cooldownMs: 1000, now: () => t });
    await expect(cb.execute(boom)).rejects.toThrow('gateway caído');
    await expect(cb.execute(boom)).rejects.toThrow('gateway caído'); // 2º fallo → abre
    expect(cb.currentState).toBe('open');
    // Con el circuito abierto NO llama a fn: rechaza con CircuitOpenError.
    const fn = jest.fn(boom);
    await expect(cb.execute(fn)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(fn).not.toHaveBeenCalled();
  });

  it('pasa a half-open tras el enfriamiento y cierra si la prueba va bien', async () => {
    let t = 0;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, now: () => t });
    await expect(cb.execute(boom)).rejects.toThrow(); // abre
    expect(cb.currentState).toBe('open');
    t = 1000; // pasa el enfriamiento
    expect(cb.currentState).toBe('half_open');
    await expect(cb.execute(ok)).resolves.toBe('ok'); // prueba OK → cierra
    expect(cb.currentState).toBe('closed');
  });

  it('en half-open, un fallo vuelve a abrir el circuito', async () => {
    let t = 0;
    const cb = new CircuitBreaker({ failureThreshold: 1, cooldownMs: 1000, now: () => t });
    await expect(cb.execute(boom)).rejects.toThrow(); // abre
    t = 1000;
    await expect(cb.execute(boom)).rejects.toThrow('gateway caído'); // prueba falla → reabre
    expect(cb.currentState).toBe('open');
  });
});
