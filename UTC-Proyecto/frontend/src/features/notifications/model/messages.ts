import type { OrderStatus } from '../../../entities/order/model/types';

export interface OrderNotification {
  title: string;
  body: string;
}

/**
 * Mensaje de notificación para una transición de estado de pedido (BR-012).
 *
 * Eventos que SÍ avisan (BR-012): aceptado (→preparing), listo (→ready),
 * cancelado (→cancelled), no recogido (→not_picked_up). El resto (pending,
 * picked_up, ready_later) no genera aviso → devuelve null.
 *
 * Función PURA (sin efectos): el de-dup real lo hace quien la llama, recordando
 * el último estado por pedido. Aquí sólo se descarta el no-cambio (`prev===next`).
 */
export function notificationFor(
  prev: OrderStatus | null,
  next: OrderStatus,
  code?: string,
): OrderNotification | null {
  if (prev === next) return null; // sin cambio → sin aviso (de-dup base, BR-012)
  const ref = code ? ` ${code}` : '';
  switch (next) {
    case 'preparing':
      return {
        title: 'Pedido aceptado 👨‍🍳',
        body: `La cocina empezó a preparar tu pedido${ref}.`,
      };
    case 'ready':
      return {
        title: '¡Tu pedido está listo! 🛎️',
        body: `Pásale a recogerlo${ref} en la cooperativa.`,
      };
    case 'cancelled':
      return {
        title: 'Pedido cancelado',
        body: `Tu pedido${ref} fue cancelado.`,
      };
    case 'not_picked_up':
      return {
        title: 'Pedido no recogido',
        body: `Pasó la ventana de recogida de tu pedido${ref}.`,
      };
    default:
      return null; // pending / picked_up / ready_later → sin aviso
  }
}
