import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useOrdersStore } from '../../orders/model/orders.store';
import { useSettingsStore } from '../../admin/model/settings.store';
import { scheduleView } from '../../../entities/order/schedule';
import { QUEUE_STATUSES, type AdminOrder } from '../../../entities/order/admin-types';
import { emitNotification } from '../../../shared/notifications/notify';

const POLL_MS = 15000;

/**
 * Aviso al NEGOCIO (admin) de pedidos PROGRAMADOS (spec #4): cuando un pedido
 * programado llega a su hora de empezar (`now ≥ startBy`) y sigue activo, emite una
 * notificación local del SO en el dispositivo del admin ("⏰ Empieza U-000NN").
 *
 * Mismo mecanismo que los avisos del cliente ([[useOrderNotifications]]): sondea
 * `loadAll` cada 15 s (foreground) y observa el store. De-dup por pedido (un aviso por
 * pedido, BR-012). Respeta el toggle `notifyOrders` del admin. Montado en AdminTabs.
 */
export function useScheduledAdminAlerts(token?: string): void {
  const alerted = useRef<Set<string>>(new Set());

  useEffect(() => {
    const seen = alerted.current;

    function evaluate(orders: AdminOrder[]) {
      if (!useSettingsStore.getState().notifyOrders) return;
      const now = Date.now();
      for (const o of orders) {
        if (!QUEUE_STATUSES.includes(o.status) || seen.has(o.id)) continue;
        const sv = scheduleView(o, now);
        if (!sv.isScheduled || !sv.isDue) continue;
        seen.add(o.id);
        void emitNotification(
          '⏰ Hora de preparar',
          `Empieza el pedido ${o.code} · recoge a las ${sv.pickupLabel}`,
        );
      }
    }

    evaluate(useOrdersStore.getState().orders);
    const unsub = useOrdersStore.subscribe((s) => evaluate(s.orders));

    let timer: ReturnType<typeof setInterval> | null = null;
    if (token) {
      timer = setInterval(() => {
        if (AppState.currentState === 'active') {
          void useOrdersStore.getState().loadAll(token);
        }
      }, POLL_MS);
    }

    return () => {
      unsub();
      if (timer) clearInterval(timer);
      // NO se limpia `seen`: el de-dup debe sobrevivir a un refresh de token (mismo
      // admin) para no re-avisar un pedido ya notificado. Al cerrar sesión el hook se
      // desmonta y el ref se descarta solo (Set nuevo en el próximo login).
    };
  }, [token]);
}
