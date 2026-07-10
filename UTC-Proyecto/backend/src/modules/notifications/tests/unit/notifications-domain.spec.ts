import {
  NotificationType,
  notificationTypeForEvent,
} from '../../domain/notification-type';
import { renderNotification } from '../../domain/notification-content';

describe('notificationTypeForEvent (mapeo evento orders → tipo notificación, BR-012)', () => {
  it('mapea los 4 eventos notificables', () => {
    expect(notificationTypeForEvent('order.accepted')).toBe(
      NotificationType.ORDER_ACCEPTED,
    );
    expect(notificationTypeForEvent('order.readied')).toBe(
      NotificationType.ORDER_READIED,
    );
    expect(notificationTypeForEvent('order.cancelled')).toBe(
      NotificationType.ORDER_CANCELLED,
    );
    expect(notificationTypeForEvent('order.not_picked_up')).toBe(
      NotificationType.ORDER_NOT_PICKED_UP,
    );
  });

  it('devuelve null para un evento no notificable', () => {
    expect(notificationTypeForEvent('order.picked_up')).toBeNull();
    expect(notificationTypeForEvent('desconocido')).toBeNull();
  });
});

describe('renderNotification (contenido BR-012 en el servidor)', () => {
  it('rinde el folio U-00042 y un mensaje por tipo', () => {
    const ready = renderNotification(NotificationType.ORDER_READIED, 42);
    expect(ready.body).toContain('U-00042');
    expect(ready.title).toContain('listo');
  });

  it('cubre los 4 tipos sin caer en default', () => {
    for (const type of Object.values(NotificationType)) {
      const content = renderNotification(type, 1);
      expect(content.title.length).toBeGreaterThan(0);
      expect(content.body).toContain('U-00001');
    }
  });
});
