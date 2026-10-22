import { DomainError } from '../../../kernel/domain/DomainError';
import { UnitCost } from './value-objects/unit-cost';

/**
 * Motor de costeo — funciones PURAS de dominio (plan 04 Task 2 / motor-de-costeo-design).
 * Sin DB, sin NestJS, sin TypeORM. Toda la aritmética de dinero del inventario vive aquí.
 */

/**
 * Rendimiento (yield): de lo que compras a lo que puedes usar. `bruto = neto / yield`.
 * El hueso, la grasa, la cáscara. Invariante: 0 < yield ≤ 1 (plan 04 §Modelo, CHECK en BD).
 * La carne MOLIDA es 1.00 (no tiene hueso); el corte con hueso 0.80; el elote en mazorca 0.55.
 */
export function grossQty(netQty: number, yieldPct: number): number {
  if (!Number.isFinite(netQty) || netQty < 0) {
    throw new DomainError('Cantidad neta inválida');
  }
  if (!Number.isFinite(yieldPct) || yieldPct <= 0 || yieldPct > 1) {
    throw new DomainError('El rendimiento debe estar en (0, 1]');
  }
  return netQty / yieldPct;
}

/**
 * Costo Promedio Ponderado (CPP, plan 04 D2) al recibir una compra:
 *   nuevo = (stock·promedio + qtyEntrada·costoEntrada) / (stock + qtyEntrada)
 * Landmines blindados:
 *  - stock actual 0 → NO divide entre cero: adopta el costo de la entrada (no hay promedio previo).
 *  - entrada 0 o negativa → DomainError (una compra mueve stock).
 *  - stock negativo → DomainError (BR-011: con stock negativo el promedio es basura).
 */
export function weightedAverageCost(
  currentStock: number,
  currentAvg: UnitCost,
  entryQty: number,
  entryCost: UnitCost,
): UnitCost {
  if (!Number.isFinite(currentStock) || currentStock < 0) {
    throw new DomainError('Stock actual inválido (no puede ser negativo)');
  }
  if (!Number.isFinite(entryQty) || entryQty <= 0) {
    throw new DomainError('La cantidad de entrada debe ser mayor a 0');
  }
  if (currentStock === 0) {
    return entryCost;
  }
  const numerator =
    currentStock * currentAvg.amount + entryQty * entryCost.amount;
  return UnitCost.of(numerator / (currentStock + entryQty));
}

/** Una línea de receta ya resuelta contra el catálogo de insumos. */
export interface CostedRecipeLine {
  netQty: number; // cantidad neta que pide la receta, en unidad base
  yieldPct: number; // rendimiento del insumo
  unitCost: UnitCost; // avg_unit_cost vigente del insumo (CPP)
}

/**
 * Costo teórico de un producto: Σ(bruta × costo) sobre sus insumos.
 * Redondea a 2 decimales UNA sola vez, al final del total — no por línea (plan 04 R5).
 */
export function productCost(lines: CostedRecipeLine[]): number {
  let micros = 0;
  for (const line of lines) {
    const gross = grossQty(line.netQty, line.yieldPct);
    micros += line.unitCost.amount * gross;
  }
  return Math.round(micros / 0.01) * 0.01;
}

export interface ProductMargin {
  costo: number;
  precioSinIva: number;
  foodCostPct: number;
  margen: number;
  bajoElMinimo: boolean;
}

/**
 * Margen de un producto (plan 04 D7). El precio de menú incluye IVA 16% (comida preparada):
 * el food cost y la ganancia se miden contra `precio / 1.16`, NUNCA contra el precio con IVA
 * (calcularlo contra el bruto infla el margen ~16 puntos).
 */
export function productMargin(
  costo: number,
  precioConIva: number,
  foodCostMax: number,
  ivaRate = 0.16,
): ProductMargin {
  if (!Number.isFinite(precioConIva) || precioConIva <= 0) {
    throw new DomainError('Precio inválido');
  }
  const precioSinIva = round2(precioConIva / (1 + ivaRate));
  const foodCostPct = precioSinIva === 0 ? 1 : costo / precioSinIva;
  return {
    costo: round2(costo),
    precioSinIva,
    foodCostPct,
    margen: round2(precioSinIva - costo),
    bajoElMinimo: foodCostPct > foodCostMax,
  };
}

function round2(n: number): number {
  return Math.round(n / 0.01) * 0.01;
}
