import { OrderEntity } from '../../../infrastructure/database/entities/order.entity';
import {
  OrderStatus,
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
}

/** Mapea la entidad persistida (con `items.product`, `payment`, `user`) al contrato de API. */
export function toOrderResponse(o: OrderEntity): OrderResponse {
  const fullName = [o.user?.firstName, o.user?.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return {
    id: o.id,
    orderNumber: o.orderNumber,
    status: o.status,
    total: Number(o.totalAmount),
    customer: fullName || 'Cliente',
    email: o.user?.email ?? '',
    items: (o.items ?? []).map((it) => ({
      productId: it.product?.id ?? '',
      name: it.product?.name ?? '',
      quantity: it.quantity,
      unitPrice: Number(it.unitPrice),
      subtotal: Number(it.subtotal),
    })),
    payment: o.payment
      ? { method: o.payment.method, status: o.payment.status }
      : null,
    createdAt: o.createdAt.toISOString(),
    readyAt: o.readyAt ? o.readyAt.toISOString() : null,
  };
}
