import { create } from 'zustand';
import { ApiError } from '../../../shared/api/client';
import { QUEUE_STATUSES, type AdminOrder } from '../../../entities/order/admin-types';
import type { OrderStatus } from '../../../entities/order/model/types';
import {
  createOrder,
  fetchMyOrders,
  fetchAllOrders,
  updateOrderStatus,
  cancelOrder,
  extendOrder,
  type OrderWritePayload,
} from '../../../entities/order/api';

/**
 * Store ÚNICO de pedidos, compartido por el ADMIN y el CLIENTE (UI-first).
 * Es la fuente de verdad común: lo que el admin marca (su tag de estado) lo ve el
 * cliente en su seguimiento, y un pedido que el cliente envía aparece en la cola
 * del admin. En el "turno de datos" este store se respalda con `UTC_PROJECT_DB`.
 */
export type Order = AdminOrder;

/** Pedidos con una transición en vuelo: evita PATCH solapados sobre el mismo id (last-writer-wins). */
const statusInFlight = new Set<string>();

/** Cuerpo del checkout: SOLO producto + cantidad + método (el backend pone precio/total). */
export type NewOrderInput = OrderWritePayload;

interface OrdersState {
  orders: Order[];
  /** Pedido que el cliente sigue ahora mismo (seteado al pagar o al abrir el seguimiento). */
  activeOrderId: string | null;
  loading: boolean;
  loaded: boolean;
  error: boolean;
  /** Cambia el estado de un pedido (admin, `PATCH /orders/:id/status`; BR-004 la valida el backend). Optimista con revert. */
  setStatus: (id: string, status: OrderStatus, token?: string) => Promise<void>;
  /**
   * El cliente envía un pedido (`POST /orders`); el backend snapshotea precio/total.
   * `buildDemo` (opcional) sólo se usa en `__DEV__` si el backend no responde: crea un
   * pedido local para que el flujo de checkout funcione en la demo sin servidor.
   */
  placeOrder: (
    input: NewOrderInput,
    token?: string,
    buildDemo?: () => Order,
  ) => Promise<Order>;
  /** Carga los pedidos del cliente (`GET /orders`, BR-014). */
  loadMine: (token?: string) => Promise<void>;
  /** Carga TODOS los pedidos (admin, `GET /orders/all`): cola + dashboard. */
  loadAll: (token?: string, branchId?: string) => Promise<void>;
  /** El cliente cancela SU pedido (`PATCH /orders/:id/cancel`, §3.8: solo si pending). */
  cancelMine: (id: string, token?: string) => Promise<void>;
  /** El cliente difiere SU pedido (`PATCH /orders/:id/extend`, §3.10: ready→ready_later). */
  extendMine: (id: string, token?: string) => Promise<void>;
  /** Marca cuál es el pedido activo del cliente (para el seguimiento). */
  setActiveOrder: (id: string) => void;
}

export const useOrdersStore = create<OrdersState>((set, get) => ({
  orders: [],
  activeOrderId: null,
  loading: false,
  loaded: false,
  error: false,
  setStatus: async (id, status, token) => {
    if (statusInFlight.has(id)) return; // ya hay una transición en curso para este pedido
    const prev = get().orders.find((o) => o.id === id);
    if (!prev) return;
    statusInFlight.add(id);
    // Optimista: refleja al instante; revierte si el backend rechaza.
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) }));
    try {
      const updated = await updateOrderStatus(id, status, token);
      set((s) => ({ orders: s.orders.map((o) => (o.id === id ? updated : o)) }));
    } catch (e) {
      set((s) => ({
        orders: s.orders.map((o) =>
          o.id === id ? { ...o, status: prev.status } : o,
        ),
      }));
      throw e;
    } finally {
      statusInFlight.delete(id);
    }
  },
  setActiveOrder: (id) => set({ activeOrderId: id }),
  placeOrder: async (input, token, buildDemo) => {
    try {
      const created = await createOrder(input, token);
      set((st) => ({
        orders: [created, ...st.orders.filter((o) => o.id !== created.id)],
        activeOrderId: created.id,
      }));
      return created;
    } catch (e) {
      // Demo (dev): si NO hay backend (fallo de conectividad, status 0) se crea un pedido local
      // para no dejar muerto el checkout. Un rechazo de NEGOCIO del servidor (409 sin stock, 400)
      // NO se enmascara: debe propagar para que el cliente vea "se agotó" (D-052).
      const isConnectivity = e instanceof ApiError && e.status === 0;
      if (__DEV__ && buildDemo && isConnectivity) {
        const local = buildDemo();
        set((st) => ({ orders: [local, ...st.orders], activeOrderId: local.id }));
        return local;
      }
      throw e;
    }
  },
  loadMine: async (token) => {
    if (get().loading) return;
    set({ loading: true, error: false });
    try {
      const rows = await fetchMyOrders(token);
      set({ orders: rows, loaded: true });
    } catch (e) {
      console.warn('[orders] error al cargar:', e instanceof Error ? e.message : e);
      // Prod: sin mock (BR-015). Dev: conserva los pedidos actuales (demo).
      if (!__DEV__) set({ orders: [], error: true });
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  loadAll: async (token, branchId) => {
    if (get().loading) return;
    set({ loading: true, error: false });
    try {
      const rows = await fetchAllOrders(token, branchId);
      set({ orders: rows, loaded: true });
    } catch (e) {
      console.warn(
        '[orders] error al cargar (admin):',
        e instanceof Error ? e.message : e,
      );
      if (!__DEV__) set({ orders: [], error: true });
      set({ loaded: true });
    } finally {
      set({ loading: false });
    }
  },
  cancelMine: async (id, token) => {
    const updated = await cancelOrder(id, token);
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? updated : o)) }));
  },
  extendMine: async (id, token) => {
    const updated = await extendOrder(id, token);
    set((s) => ({ orders: s.orders.map((o) => (o.id === id ? updated : o)) }));
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

/** Ventana del pedido programado (~20 min antes de recoger): igual que SCHEDULE_WINDOW_MIN del backend. */
const SEMAFORO_WINDOW_MS = 20 * 60 * 1000;

/**
 * Semáforo de congestión (D-019): cola = pending + preparing + ready.
 * Umbrales parametrizables (personalización del admin, D-021): Verde `< yellow`,
 * Amarillo `yellow..red`, Rojo `> red`.
 * Un pedido PROGRAMADO no cuenta hasta que se abre su ventana (H4/§3.15): así el
 * semáforo del admin coincide con el server-side y no se infla antes de tiempo.
 */
export function selectSemaforo(
  orders: Order[],
  yellow = 5,
  red = 10,
  now: number = Date.now(),
): { count: number; level: 'verde' | 'amarillo' | 'rojo' } {
  const count = orders.filter((o) => {
    if (!QUEUE_STATUSES.includes(o.status)) return false;
    if (o.scheduledFor && new Date(o.scheduledFor).getTime() > now + SEMAFORO_WINDOW_MS) return false;
    return true;
  }).length;
  const level = count < yellow ? 'verde' : count <= red ? 'amarillo' : 'rojo';
  return { count, level };
}

/** KPIs del día para el dashboard. */
export function selectKpis(orders: Order[]) {
  return {
    pedidos: orders.length,
    // Ingreso = dinero cobrado: tarjeta/online ya pagada (`paid`, salvo cancelado) MÁS
    // efectivo entregado (`picked_up` = se cobró en el mostrador; su payStatus sigue `pending`).
    ingresos: orders
      .filter((o) => o.status === 'picked_up' || (o.payStatus === 'paid' && o.status !== 'cancelled'))
      .reduce((sum, o) => sum + o.total, 0),
    entregados: orders.filter((o) => o.status === 'picked_up').length,
  };
}
