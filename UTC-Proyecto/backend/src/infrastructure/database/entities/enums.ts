// Enumerados del dominio (ver docs/arquitectura/architecture-propuesta.md §5.0).

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  NOT_PICKED_UP = 'not_picked_up',
  CANCELLED = 'cancelled',
  READY_LATER = 'ready_later',
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
