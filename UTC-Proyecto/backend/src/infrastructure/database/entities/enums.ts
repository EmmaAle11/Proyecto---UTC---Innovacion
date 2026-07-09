// Enumerados del dominio (ver docs/arquitectura/architecture-propuesta.md §5.0).

// OrderStatus es concepto de DOMINIO: la fuente única vive en modules/orders. Infra la
// re-exporta para TypeORM (@Column enum) y para no romper los imports existentes; los
// valores string son idénticos, así que la columna enum de Postgres no cambia.
export { OrderStatus } from '../../../modules/orders/domain/entities/Order';

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
