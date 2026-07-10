/**
 * Vocabulario del contexto `notifications`: los tipos de notificación que se materializan en
 * el outbox. Son un concepto PROPIO (no el nombre del evento de orders), para que orders pueda
 * renombrar sus eventos sin migrar datos. El handler traduce el evento de orders a este tipo.
 */
export enum NotificationType {
  ORDER_ACCEPTED = 'order_accepted',
  ORDER_READIED = 'order_readied',
  ORDER_CANCELLED = 'order_cancelled',
  ORDER_NOT_PICKED_UP = 'order_not_picked_up',
}

/** Mapa evento de orders (eventType) → tipo de notificación. Solo los notificables (BR-012). */
const EVENT_TYPE_TO_NOTIFICATION: Readonly<Record<string, NotificationType>> = {
  'order.accepted': NotificationType.ORDER_ACCEPTED,
  'order.readied': NotificationType.ORDER_READIED,
  'order.cancelled': NotificationType.ORDER_CANCELLED,
  'order.not_picked_up': NotificationType.ORDER_NOT_PICKED_UP,
};

/** Devuelve el tipo de notificación para un evento, o null si ese evento no notifica. */
export function notificationTypeForEvent(
  eventType: string,
): NotificationType | null {
  return EVENT_TYPE_TO_NOTIFICATION[eventType] ?? null;
}
