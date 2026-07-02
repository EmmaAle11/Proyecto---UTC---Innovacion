import { getJson, postJson, patchJson } from '../../shared/api/client';
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
  orderNumber: number;
  status: OrderStatus;
  total: number;
  customer: string;
  email: string;
  items: ApiOrderItem[];
  payment: { method: PaymentMethod; status: PaymentStatus } | null;
  createdAt: string;
  readyAt: string | null;
  scheduledFor: string | null;
  startBy: string | null;
  branchId: string | null;
  branchName: string | null;
}

/** Cuerpo de alta: SOLO producto + cantidad + método (el backend pone precios/total). */
export interface OrderWritePayload {
  items: { productId: string; quantity: number }[];
  payMethod: PaymentMethod;
  /** Recogida programada (ISO). Opcional: si falta, el pedido es inmediato (spec #4). */
  scheduledFor?: string;
  /** Sucursal de recogida elegida (§3.12). */
  branchId?: string;
  branchName?: string;
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

/** Código de pedido legible: `U-` + número secuencial a 5 dígitos (U-00001). */
export function formatOrderCode(orderNumber: number): string {
  return `U-${String(orderNumber).padStart(5, '0')}`;
}

/**
 * Mapea el pedido del backend al shape de display `AdminOrder` (el cliente y el admin
 * comparten el mismo modelo de presentación). El `code` es el número secuencial real
 * del backend (U-00001); `createdLabel`/`waitingMin` se derivan de los timestamps.
 */
export function toOrder(a: ApiOrder): AdminOrder {
  return {
    id: a.id,
    code: formatOrderCode(a.orderNumber),
    customer: a.customer,
    email: a.email,
    status: a.status,
    total: a.total,
    items: a.items.map((it) => ({ name: it.name, qty: it.quantity })),
    createdLabel: hhmm(a.createdAt),
    waitingMin: minutesSince(a.createdAt),
    payMethod: a.payment?.method ?? 'efectivo',
    payStatus: a.payment?.status ?? 'pending',
    readyAt: a.readyAt,
    scheduledFor: a.scheduledFor,
    startBy: a.startBy,
    branchName: a.branchName,
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

/** GET /orders/all → todos los pedidos (admin: cola/dashboard). */
export async function fetchAllOrders(token?: string): Promise<AdminOrder[]> {
  const rows = await getJson<ApiOrder[]>('/orders/all', token);
  return rows.map(toOrder);
}

/** Semáforo de congestión calculado en el servidor (D-019). */
export interface ApiCongestion {
  count: number;
  level: 'verde' | 'amarillo' | 'rojo';
  yellow: number;
  red: number;
}

/** GET /orders/congestion → semáforo global (el cliente lo ve sin acceder a pedidos ajenos). */
export async function fetchCongestion(token?: string): Promise<ApiCongestion> {
  return getJson<ApiCongestion>('/orders/congestion', token);
}

/** Umbrales del semáforo, ajustables por el admin (G2/§3.14). */
export interface CongestionThresholds {
  yellow: number;
  red: number;
}

/** GET /settings/congestion → umbrales actuales (cualquier usuario autenticado). */
export async function fetchCongestionThresholds(
  token?: string,
): Promise<CongestionThresholds> {
  return getJson<CongestionThresholds>('/settings/congestion', token);
}

/** PATCH /settings/congestion → ajusta los umbrales (admin). Persiste server-side. */
export async function updateCongestionThresholds(
  yellow: number,
  red: number,
  token?: string,
): Promise<CongestionThresholds> {
  return patchJson<CongestionThresholds>(
    '/settings/congestion',
    { yellow, red },
    token,
  );
}

/** Métricas del negocio para el admin (F5/§3.1): más vendido + hora pico. */
export interface TopProduct {
  productId: string;
  name: string;
  qty: number;
}
export interface PeakHour {
  hour: number;
  count: number;
}
export interface OrderMetrics {
  topProducts: TopProduct[];
  peakHour: PeakHour | null;
}

/** GET /orders/metrics → métricas (admin). */
export async function fetchOrderMetrics(token?: string): Promise<OrderMetrics> {
  return getJson<OrderMetrics>('/orders/metrics', token);
}

/** PATCH /orders/:id/status → transición de estado (admin, BR-004 la valida el backend). */
export async function updateOrderStatus(
  id: string,
  status: OrderStatus,
  token?: string,
): Promise<AdminOrder> {
  return toOrder(await patchJson<ApiOrder>(`/orders/${id}/status`, { status }, token));
}

/** PATCH /orders/:id/cancel → el cliente cancela SU pedido (§3.8, solo si pending). */
export async function cancelOrder(id: string, token?: string): Promise<AdminOrder> {
  return toOrder(await patchJson<ApiOrder>(`/orders/${id}/cancel`, {}, token));
}

/** PATCH /orders/:id/extend → el cliente difiere SU pedido (§3.10, ready→ready_later). */
export async function extendOrder(id: string, token?: string): Promise<AdminOrder> {
  return toOrder(await patchJson<ApiOrder>(`/orders/${id}/extend`, {}, token));
}
