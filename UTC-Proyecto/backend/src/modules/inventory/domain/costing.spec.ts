import { DomainError } from '../../../kernel/domain/DomainError';
import { UnitCost } from './value-objects/unit-cost';
import {
  grossQty,
  weightedAverageCost,
  productCost,
  productMargin,
} from './costing';

/**
 * Tests-trampa del motor de costeo (plan 04 Task 2 Step 6 / motor-de-costeo-design).
 * Cada uno blinda una trampa concreta donde el costo miente. Son dominio puro (sin DB).
 */
describe('costing · yield (rendimiento)', () => {
  it('SÍ se aplica — corte con hueso (yield 0.80): 500 g netos → 625 g brutos → $31.25', () => {
    // 3 kg / $150 = $0.05/g
    const costoPorGramo = UnitCost.of(150 / 3000);
    const bruto = grossQty(500, 0.8);
    expect(bruto).toBeCloseTo(625, 6);
    expect(costoPorGramo.lineTotal(bruto)).toBe(31.25);
  });

  it('NO se aplica — carne MOLIDA (yield 1.00): 130 g netos → 130 g brutos → $16.90', () => {
    // molida no tiene hueso; a $0.130/g (PROFECO). Si diera $21.13, alguien le metió yield 0.80.
    const costoPorGramo = UnitCost.of(0.13);
    const bruto = grossQty(130, 1.0);
    expect(bruto).toBe(130);
    expect(costoPorGramo.lineTotal(bruto)).toBe(16.9);
  });

  it('rechaza yield fuera de (0,1]', () => {
    expect(() => grossQty(100, 0)).toThrow(DomainError);
    expect(() => grossQty(100, 1.2)).toThrow(DomainError);
  });
});

describe('costing · CPP (costo promedio ponderado)', () => {
  it('mezcla dos lotes: 1000 g a $0.05 + 3000 g a $0.06 → $0.0575/g', () => {
    const nuevo = weightedAverageCost(
      1000,
      UnitCost.of(0.05),
      3000,
      UnitCost.of(0.06),
    );
    expect(nuevo.amount).toBeCloseTo(0.0575, 6);
  });

  it('stock 0 → NO divide entre cero: adopta el costo de la entrada', () => {
    const nuevo = weightedAverageCost(
      0,
      UnitCost.of(0.99),
      500,
      UnitCost.of(0.05),
    );
    expect(nuevo.amount).toBeCloseTo(0.05, 6);
  });

  it('rechaza stock negativo (BR-011) y entrada no positiva', () => {
    expect(() =>
      weightedAverageCost(-1, UnitCost.zero(), 1, UnitCost.of(0.05)),
    ).toThrow(DomainError);
    expect(() =>
      weightedAverageCost(100, UnitCost.of(0.05), 0, UnitCost.of(0.05)),
    ).toThrow(DomainError);
  });
});

describe('UnitCost · precisión de 6 decimales', () => {
  it('aceite $37/L = $0.037/ml; 15 ml → $0.56 (con 2 decimales por ml daría $0.60: 7% de error)', () => {
    const costo = UnitCost.of(37 / 1000);
    expect(costo.toString()).toBe('0.037000');
    expect(costo.lineTotal(15)).toBe(0.56);
  });

  it('redondea una sola vez al final, no por unidad base', () => {
    // 0.130000 * 130 = 16.9 exacto; la cadena conserva 6 decimales.
    expect(UnitCost.of(0.13).lineTotal(130)).toBe(16.9);
  });
});

describe('costing · productCost y margen', () => {
  it('suma varias líneas con su yield y redondea al final', () => {
    const costo = productCost([
      { netQty: 130, yieldPct: 1.0, unitCost: UnitCost.of(0.13) }, // molida → 16.90
      { netQty: 15, yieldPct: 1.0, unitCost: UnitCost.of(37 / 1000) }, // aceite → 0.555
    ]);
    // 16.9 + 0.555 = 17.455 → 17.46 (una sola vez, al final)
    expect(costo).toBe(17.46);
  });

  it('margen contra precio SIN IVA: $65 con IVA → base $56.03, no $65', () => {
    const m = productMargin(30.8, 65, 0.45);
    expect(m.precioSinIva).toBe(56.03);
    expect(m.margen).toBe(round2(56.03 - 30.8));
    // food cost 30.80/56.03 = 54.9% > 45% → bajo el mínimo
    expect(m.bajoElMinimo).toBe(true);
  });

  it('un producto dentro del techo no cae bajo el mínimo', () => {
    const m = productMargin(16.9, 65, 0.45);
    expect(m.foodCostPct).toBeLessThan(0.45);
    expect(m.bajoElMinimo).toBe(false);
  });
});

function round2(n: number): number {
  return Math.round(n / 0.01) * 0.01;
}
