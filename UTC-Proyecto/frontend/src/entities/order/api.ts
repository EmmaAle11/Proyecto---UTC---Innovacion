import { getJson, postJson } from '../../shared/api/client';
import type { AdminOrder } from './admin-mock';
import type {
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from './model/types';

/** Línea del pedido tal como la devuelve el backend (`OrderResponse`). */
export interface ApiOrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

/** Pedido del backend (`/orders`). Refleja `OrderResponse` (dinero ya `number`, fechas ISO). */
export interface ApiOrder {
  id: string;
  status: OrderStatus;
  total: number;
  customer: string;
  email: string;
  items: ApiOrderItem[];
  payment: { method: PaymentMethod; status: PaymentStatus } | null;
  createdAt: string;
  readyAt: string | null;
}

/** Cuerpo de alta: SOLO producto + cantidad + método (el backend pone precios/total). */
export interface OrderWritePayload {
  items: { productId: string; quantity: number }[];
  payMethod: PaymentMethod;
}

/** 'HH:MM' (hora local) desde un ISO. */
function hhmm(iso: string): string {
  const d = new Date(iso);
  return `${`${d.getHours()}`.padStart(2, '0')}:${`${d.getMinutes()}`.padStart(2, '0')}`;
}

/** Minutos transcurridos desde un ISO (no negativos). */
function minutesSince(iso: string): number {
  const ms = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

/**
 * Mapea el pedido del backend al shape de display `AdminOrder` (el cliente y el admin
 * comparten el mismo modelo de presentación). El `code` se deriva del id (el esquema no
 * guarda turno secuencial); `createdLabel`/`waitingMin` se derivan de los timestamps.
 */
export function toOrder(a: ApiOrder): AdminOrder {
  return {
    id: a.id,
    code: `A-${a.id.replace(/-/g, '').slice(0, 4).toUpperCase()}`,
    customer: a.customer,
    email: a.email,
    status: a.status,
    total: a.total,
    items: a.items.map((it) => ({ name: it.name, qty: it.quantity })),
    createdLabel: hhmm(a.createdAt),
    waitingMin: minutesSince(a.createdAt),
    payMethod: a.payment?.method ?? 'efectivo',
    payStatus: a.payment?.status ?? 'pending',
  };
}

/** POST /orders → crea el pedido del cliente (backend snapshotea precio/total, BR-015). */
export async function createOrder(
  payload: OrderWritePayload,
  token?: string,
): Promise<AdminOrder> {
  return toOrder(await postJson<ApiOrder>('/orders', payload, token));
}

/** GET /orders → mis pedidos (BR-014: el backend filtra por el JWT). */
export async function fetchMyOrders(token?: string): Promise<AdminOrder[]> {
  const rows = await getJson<ApiOrder[]>('/orders', token);
  return rows.map(toOrder);
}
