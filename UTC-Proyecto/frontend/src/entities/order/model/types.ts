/** Estados del pedido (enum `order_status` del esquema, architecture §5). */
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked_up' | 'not_picked_up' | 'cancelled' | 'ready_later';
