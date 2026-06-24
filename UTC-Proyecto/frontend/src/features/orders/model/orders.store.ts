import { create } from 'zustand';
import { ADMIN_ORDERS, QUEUE_STATUSES, type AdminOrder } from '../../../entities/order/admin-mock';
import type { OrderStatus } from '../../../entities/order/model/types';

/**
 * Store ÚNICO de pedidos, compartido por el ADMIN y el CLIENTE (UI-first).
 * Es la fuente de verdad común: lo que el admin marca (su tag de estado) lo ve el
 * cliente en su seguimiento, y un pedido que el cliente envía aparece en la cola
 * del admin. En el "turno de datos" este store se respalda con `UTC_PROJECT_DB`.
 */
export type Order = AdminOrder;

export interface NewOrderInput {
  customer: string;
  email: string;
  items: { name: string; qty: number }[];
  total: number;
  payMethod: AdminOrder['payMethod'];
}

interface OrdersState {
  orders: Order[];
  /** Pedido que el cliente sigue ahora mismo (seteado al pagar o al abrir el seguimiento). */
  activeOrderId: string | null;
  /** Cambia el estado de un pedido (admin: Aceptar/Marcar listo/Entregar). Sincroniza ambos lados. */
  setStatus: (id: string, status: OrderStatus) => void;
  /** El cliente envía un pedido → entra como `pending` a la cola del admin. Devuelve su id. */
  placeOrder: (input: NewOrderInput) => string;
  /** Marca cuál es el pedido activo del cliente (para el seguimiento). */
  setActiveOrder: (id: string) => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: ADMIN_ORDERS,
  activeOrderId: null,
  setStatus: (id, status) =>
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) })),
  setActiveOrder: (id) => set({ activeOrderId: id }),
  placeOrder: ({ customer, email, items, total, payMethod }) => {
    const s = get();
    const n = s.orders.filter((o) => o.id.startsWith('CLI-')).length + 1;
    const id = `CLI-${n}`;
    const code = `A-${210 + n}`;
    const now = new Date();
    const createdLabel = `${`${now.getHours()}`.padStart(2, '0')}:${`${now.getMinutes()}`.padStart(2, '0')}`;
    const order: Order = {
      id,
      code,
      customer,
      email,
      status: 'pending',
      total,
      items,
      createdLabel,
      waitingMin: 0,
      payMethod,
      payStatus: payMethod === 'efectivo' ? 'pending' : 'paid',
    };
    set((st) => ({ orders: [order, ...st.orders], activeOrderId: id }));
    return id;
  },
}));

/** Paso del tracker del cliente (0 Pagado · 1 En preparación · 2 Listo · 3 Recogido). */
export function trackerStep(status: OrderStatus): number {
  switch (status) {
    case 'preparing':
      return 1;
    case 'ready':
    case 'ready_later':
      return 2;
    case 'picked_up':
      return 3;
    default:
      return 0; // pending / not_picked_up / cancelled
  }
}

/** Estados terminales (no en curso) para separar "Activo" de "Historial" en el cliente. */
export const TERMINAL_STATUSES: OrderStatus[] = ['picked_up', 'not_picked_up', 'cancelled'];

/**
 * Semáforo de congestión (D-019): cola = pending + preparing + ready.
 * Umbrales parametrizables (personalización del admin, D-021): Verde `< yellow`,
 * Amarillo `yellow..red`, Rojo `> red`.
 */
export function selectSemaforo(
  orders: Order[],
  yellow = 5,
  red = 10,
): { count: number; level: 'verde' | 'amarillo' | 'rojo' } {
  const count = orders.filter((o) => QUEUE_STATUSES.includes(o.status)).length;
  const level = count < yellow ? 'verde' : count <= red ? 'amarillo' : 'rojo';
  return { count, level };
}

/** KPIs del día para el dashboard. */
export function selectKpis(orders: Order[]) {
  return {
    pedidos: orders.length,
    ingresos: orders.filter((o) => o.payStatus === 'paid').reduce((sum, o) => sum + o.total, 0),
    entregados: orders.filter((o) => o.status === 'picked_up').length,
  };
}
