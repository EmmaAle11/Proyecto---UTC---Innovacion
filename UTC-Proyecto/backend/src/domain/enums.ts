/**
 * Vocabulario de dominio de los contextos clásicos (identity, products-CRUD, payments).
 * PURO: sin NestJS, sin TypeORM — sólo valores. La capa de infraestructura re-exporta
 * estos enums (barrel en infrastructure/database/entities/enums.ts) para que las columnas
 * `@Column enum` de TypeORM los usen sin invertir la dirección de dependencias.
 *
 * OrderStatus NO vive aquí: es de un contexto con slice propio (modules/orders/domain).
 */

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum ProductStatus {
  POR_PREPARAR = 'por_preparar',
  PREPARADO = 'preparado',
  SIN_TIEMPO_ESPERA = 'sin_tiempo_espera',
  CALENTANDO = 'calentando',
  NO_DISPONIBLE = 'no_disponible',
}

export enum PaymentMethod {
  MERCADO_PAGO = 'mercado_pago',
  PAYPAL = 'paypal',
  TDC = 'tdc',
  TDD = 'tdd',
  EFECTIVO = 'efectivo',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/** De dónde salió una unidad de `finished_goods` (D-052, Plan 08). Producción en lote
 *  ("cuajé 20"), una unidad NO recogida, o una cancelada ya lista — la provenance distingue la
 *  causa de la pérdida para el costeo/auditoría (Plan 04). */
export enum FinishedGoodSource {
  PRODUCCION = 'produccion',
  NO_RECOGIDO = 'no_recogido',
  CANCELADO = 'cancelado',
}

/** Tipo de movimiento de inventario (D-052). Por ahora solo MERMA (baja); Plan 04 añadirá
 *  entradas/salidas de insumos. Columna `text` + CHECK (no enum pg) para crecer sin ALTER. */
export enum StockMovementType {
  MERMA = 'merma',
}

/** Motivo de una merma (D-052). `caducado` = una `finished_good` venció su `expires_at` (rompe el
 *  bucle de reoferta). Plan 04 añadirá `cambio_de_aceite`, etc. */
export enum StockMovementReason {
  CADUCADO = 'caducado',
}
