/** Estados del pedido (enum `order_status` del esquema, architecture §5). */
export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'picked_up' | 'not_picked_up' | 'cancelled' | 'ready_later';

/** Método de pago (enum `payment_method` del backend, BR-009). */
export type PaymentMethod = 'mercado_pago' | 'paypal' | 'tdc' | 'tdd' | 'efectivo';

/** Estado del pago (enum `payment_status` del backend). */
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
