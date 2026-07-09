import { OrderStatus } from '../domain/entities/Order';
// ponytail: PaymentMethod/PaymentStatus aún se importan de infra (deuda de payments: ese
// bounded context todavía no tiene sus enums en dominio). Fuera del alcance de esta rebanada.
import {
  PaymentMethod,
  PaymentStatus,
} from '../../../infrastructure/database/entities/enums';

/** Semáforo de congestión calculado en el servidor (D-019). */
export interface CongestionResponse {
  count: number;
  level: 'verde' | 'amarillo' | 'rojo';
  yellow: number;
  red: number;
}

/** Línea del pedido expuesta al cliente (dinero ya como `number`). */
export interface OrderItemResponse {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/**
 * Contrato del pedido expuesto al cliente. Las columnas `numeric` se mapean a
 * `string` en TypeORM; aquí se normalizan a `number`. Las fechas a ISO.
 */
export interface OrderResponse {
  id: string;
  /** Número de pedido secuencial (la app lo muestra como `U-00001`). */
  orderNumber: number;
  status: OrderStatus;
  total: number;
  customer: string;
  email: string;
  items: OrderItemResponse[];
  payment: { method: PaymentMethod; status: PaymentStatus } | null;
  createdAt: string;
  readyAt: string | null;
  /** Hora de recogida programada (ISO) o `null` si es inmediato (spec #4). */
  scheduledFor: string | null;
  /** Hora sugerida para EMPEZAR a preparar (ISO) = `scheduledFor − prep estimada`; `null` si inmediato. */
  startBy: string | null;
  /** Sucursal de recogida (§3.12); `null` si no se registró. */
  branchId: string | null;
  branchName: string | null;
}
