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
