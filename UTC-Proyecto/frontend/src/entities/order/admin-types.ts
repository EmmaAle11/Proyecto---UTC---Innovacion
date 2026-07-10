import type { OrderStatus, PaymentMethod, PaymentStatus } from './model/types';
import type { BadgeTone } from '../../shared/ui/Badge';

/**
 * Tipos y constantes de display del pedido en el lado ADMIN (vocabulario REAL, lo usa el
 * camino de la API — stores/pantallas). No es dato falso: `AdminOrder` es la forma que la app
 * consume y los metadatos son etiquetas de UI por estado / método / status de pago.
 */
export interface AdminOrderItem {
  name: string;
  qty: number;
}

export interface AdminOrder {
  id: string; // 'O-001'
  code: string; // número de pedido 'U-00001'
  customer: string;
  email: string;
  status: OrderStatus;
  total: number;
  items: AdminOrderItem[];
  createdLabel: string; // hora del servidor 'HH:MM'
  waitingMin: number; // minutos en cola
  payMethod: PaymentMethod;
  payStatus: PaymentStatus;
  readyAt?: string | null; // ISO: momento en que pasó a 'listo' (para "listo hace X min", §3.8)
  scheduledFor?: string | null; // ISO de recogida programada (spec #4); null/undef = inmediato
  startBy?: string | null; // ISO: hora sugerida para empezar a preparar (spec #4)
  branchName?: string | null; // sucursal de recogida (§3.12)
}

/** Etiqueta + tono de píldora por estado de pedido (enum order_status). */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; tone: BadgeTone }
> = {
  pending: { label: 'Pendiente', tone: 'neutral' },
  preparing: { label: 'En preparación', tone: 'cooking' },
  ready: { label: 'Listo', tone: 'ready' },
  picked_up: { label: 'Recogido', tone: 'success' },
  not_picked_up: { label: 'No recogido', tone: 'reoffer' },
  cancelled: { label: 'Cancelado', tone: 'neutral' },
  ready_later: { label: 'Para después', tone: 'primary' },
};

export const PAY_METHOD_LABEL: Record<PaymentMethod, string> = {
  mercado_pago: 'Mercado Pago',
  paypal: 'PayPal',
  tdc: 'Tarjeta crédito',
  tdd: 'Tarjeta débito',
  efectivo: 'Efectivo',
};

export const PAY_STATUS_LABEL: Record<PaymentStatus, string> = {
  paid: 'Pagado',
  pending: 'Pendiente',
  failed: 'Rechazado',
  refunded: 'Reembolsado',
};

/** Estados que cuentan para el semáforo de congestión (D-019). */
export const QUEUE_STATUSES: OrderStatus[] = ['pending', 'preparing', 'ready'];
