/** Notificación expuesta al cliente (GET /notifications/mine). Contenido ya renderizado. */
export interface NotificationResponse {
  id: string;
  orderId: string;
  orderNumber: number;
  /** Tipo de notificación (NotificationType). */
  type: string;
  title: string;
  body: string;
  /** Hora del suceso en ISO 8601 (hora del servidor). */
  occurredAt: string;
}
