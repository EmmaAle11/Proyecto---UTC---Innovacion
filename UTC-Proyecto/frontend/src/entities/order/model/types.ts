/** Estados del pedido (enum `order_status` del esquema, architecture §5). */
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked_up' | 'not_picked_up' | 'cancelled' | 'ready_later';

/** Pedido activo en curso (para la pestaña Pedidos y el Seguimiento). */
export interface ActiveOrder {
  code: string; // código de recogida (p. ej. A-204)
  status: OrderStatus;
  trackerStep: number; // 0 Pagado · 1 En preparación · 2 Listo · 3 Recogido
  etaLabel: string; // "~12 min"
}

/** Entrada del historial de pedidos. */
export interface OrderHistoryEntry {
  id: string;
  code: string;
  whenLabel: string; // "Ayer · 13:20"
  summary: string; // "Hamburguesa de la casa +1"
  total: number;
}
