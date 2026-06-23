import type { ActiveOrder, OrderHistoryEntry } from './model/types';

/** Pedido activo demo (reemplazable por `GET /orders/active`). */
export const ACTIVE_ORDER: ActiveOrder = { code: 'A-204', status: 'preparing', trackerStep: 1, etaLabel: '~12 min' };

/** Historial demo (reemplazable por `GET /orders`). */
export const ORDER_HISTORY: OrderHistoryEntry[] = [
  { id: 'A-198', code: 'A-198', whenLabel: 'Ayer · 13:20', summary: 'Hamburguesa de la casa +1', total: 83 },
  { id: 'A-187', code: 'A-187', whenLabel: 'Lun · 11:05', summary: 'Agua de jamaica +2', total: 36 },
];
