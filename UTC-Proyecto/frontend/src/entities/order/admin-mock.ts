import type { OrderStatus, PaymentMethod, PaymentStatus } from './model/types';
import type { BadgeTone } from '../../shared/ui/Badge';

/**
 * Mock del lado ADMIN: espeja el dataset demo sembrado en UTC_PROJECT_DB
 * (ver docs/datos/datos-demo.md) — 11 pedidos del recreo cubriendo los 7 estados.
 * Al llegar el "turno de datos" se reemplaza por `GET /admin/orders`.
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
export const ORDER_STATUS_META: Record<OrderStatus, { label: string; tone: BadgeTone }> = {
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

export const ADMIN_ORDERS: AdminOrder[] = [
  { id: 'O-001', code: 'U-00001', customer: 'Emmanuel Alejandre', email: 'prueba@edu.utc.mx', status: 'picked_up', total: 56, createdLabel: '09:31', waitingMin: 12, payMethod: 'tdc', payStatus: 'paid', items: [{ name: 'Quesadilla de tinga', qty: 1 }, { name: 'Agua de jamaica', qty: 1 }] },
  { id: 'O-002', code: 'U-00002', customer: 'Valeria Ramírez', email: 'valeria.ramirez@edu.utc.mx', status: 'preparing', total: 123, createdLabel: '09:50', waitingMin: 15, payMethod: 'mercado_pago', payStatus: 'paid', items: [{ name: 'Hamburguesa de la casa', qty: 1 }, { name: 'Boneless BBQ', qty: 1 }] },
  { id: 'O-003', code: 'U-00003', customer: 'Diego Hernández', email: 'diego.hernandez@edu.utc.mx', status: 'ready', total: 50, createdLabel: '09:40', waitingMin: 10, payMethod: 'efectivo', payStatus: 'pending', items: [{ name: 'Combo estudiante', qty: 1 }] },
  { id: 'O-004', code: 'U-00004', customer: 'Sofía Martínez', email: 'sofia.martinez@edu.utc.mx', status: 'pending', total: 59, createdLabel: '10:02', waitingMin: 3, payMethod: 'paypal', payStatus: 'pending', items: [{ name: 'Esquites en vaso', qty: 2 }, { name: 'Gelatina de mosaico', qty: 1 }] },
  { id: 'O-005', code: 'U-00005', customer: 'Carlos López', email: 'carlos.lopez@edu.utc.mx', status: 'not_picked_up', total: 50, createdLabel: '09:20', waitingMin: 45, payMethod: 'tdd', payStatus: 'paid', items: [{ name: 'Papas con queso', qty: 1 }, { name: 'Agua de horchata', qty: 1 }] },
  { id: 'O-006', code: '—', customer: 'Ana Torres', email: 'ana.torres@edu.utc.mx', status: 'cancelled', total: 38, createdLabel: '09:15', waitingMin: 0, payMethod: 'mercado_pago', payStatus: 'failed', items: [{ name: 'Quesadilla de tinga', qty: 1 }] },
  { id: 'O-007', code: 'U-00007', customer: 'Prueba Funcional', email: 'prueba.func.1782226408@edu.utc.mx', status: 'ready_later', total: 68, createdLabel: '09:25', waitingMin: 25, payMethod: 'tdc', payStatus: 'paid', items: [{ name: 'Combo estudiante', qty: 1 }, { name: 'Agua de jamaica', qty: 1 }] },
  { id: 'O-008', code: 'U-00008', customer: 'Sec Test', email: 'sec.test.1782236599@edu.utc.mx', status: 'picked_up', total: 58, createdLabel: '09:05', waitingMin: 14, payMethod: 'mercado_pago', payStatus: 'paid', items: [{ name: 'Boneless BBQ', qty: 1 }] },
  { id: 'O-009', code: 'U-00009', customer: 'Emmanuel Alejandre', email: 'prueba@edu.utc.mx', status: 'picked_up', total: 97, createdLabel: '08:55', waitingMin: 15, payMethod: 'tdc', payStatus: 'paid', items: [{ name: 'Hamburguesa de la casa', qty: 1 }, { name: 'Papas con queso', qty: 1 }] },
  { id: 'O-010', code: 'U-00010', customer: 'Diego Hernández', email: 'diego.hernandez@edu.utc.mx', status: 'picked_up', total: 40, createdLabel: '09:35', waitingMin: 8, payMethod: 'efectivo', payStatus: 'paid', items: [{ name: 'Esquites en vaso', qty: 1 }, { name: 'Agua de horchata', qty: 1 }] },
  { id: 'O-011', code: '—', customer: 'Valeria Ramírez', email: 'valeria.ramirez@edu.utc.mx', status: 'cancelled', total: 50, createdLabel: '09:48', waitingMin: 0, payMethod: 'mercado_pago', payStatus: 'refunded', items: [{ name: 'Combo estudiante', qty: 1 }] },
];
