import { NotificationType } from './notification-type';

export interface NotificationContent {
  title: string;
  body: string;
}

/** Folio legible del pedido (mismo formato que muestra la app: U-00001). */
function folio(orderNumber: number): string {
  return `U-${String(orderNumber).padStart(5, '0')}`;
}

/**
 * Contenido (título + cuerpo) de una notificación — BR-012 en el SERVIDOR (fuente única).
 * Función PURA; se renderiza al leer (no se almacena texto → el outbox queda normalizado).
 * Espeja los mensajes que hoy re-deriva el cliente; el objetivo es que el cliente los lea de
 * aquí y deje de duplicar la lógica de BR-012.
 */
export function renderNotification(
  type: NotificationType,
  orderNumber: number,
): NotificationContent {
  const ref = folio(orderNumber);
  switch (type) {
    case NotificationType.ORDER_ACCEPTED:
      return {
        title: 'Pedido aceptado 👨‍🍳',
        body: `La cocina empezó a preparar tu pedido ${ref}.`,
      };
    case NotificationType.ORDER_READIED:
      return {
        title: '¡Tu pedido está listo! 🛎️',
        body: `Pásale a recogerlo ${ref} en la cooperativa.`,
      };
    case NotificationType.ORDER_CANCELLED:
      return {
        title: 'Pedido cancelado',
        body: `Tu pedido ${ref} fue cancelado.`,
      };
    case NotificationType.ORDER_NOT_PICKED_UP:
      return {
        title: 'Pedido no recogido',
        body: `Pasó la ventana de recogida de tu pedido ${ref}.`,
      };
  }
}
