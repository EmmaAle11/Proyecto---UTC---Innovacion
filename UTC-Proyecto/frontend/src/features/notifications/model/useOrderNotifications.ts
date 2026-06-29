import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useOrdersStore } from '../../orders/model/orders.store';
import { useClientSettingsStore } from '../../profile/model/settings.store';
import { notificationFor } from './messages';
import { emitNotification } from '../../../shared/notifications/notify';
import type { OrderStatus } from '../../../entities/order/model/types';

const POLL_MS = 15000;

/**
 * Vigila los pedidos del CLIENTE y emite una notificación local del SO cuando uno
 * cambia de estado a un evento BR-012 (aceptado/listo/cancelado/no recogido).
 *
 * Cómo:
 *  1. Se suscribe al store de pedidos. Mientras NO está "armado" sólo SIEMBRA el
 *     estado de cada pedido (sin avisar). Se ARMA en cuanto el store reporta `loaded`
 *     (= ya hubo una carga real del backend), sembrando ese snapshot ANTES de armar.
 *     A partir de ahí, sólo las transiciones POSTERIORES avisan.
 *  2. Hace una carga real inmediata + sondea `loadMine` cada 15 s (solo foreground)
 *     para traer los cambios que hace el admin (BR-015 = fuente de verdad).
 *
 * Por qué armar con `loaded` y no con la promesa de `loadMine`: el store arranca
 * pre-poblado con mocks (UI-first) y varias pantallas llaman `loadMine` en paralelo
 * (su guard `if(loading) return` hace early-return). Atar el armado a la promesa
 * propia podía encenderlo ANTES de que llegara el fetch real (carrera). Observar
 * `loaded` arma justo cuando los datos reales ya entraron al store, sin carrera.
 * De-dup (BR-012 "no duplicar"): un estado por pedido en el mapa; respeta `notifyReady`.
 */
export function useOrderNotifications(token?: string): void {
  const lastStatus = useRef<Map<string, OrderStatus>>(new Map());
  const armed = useRef(false);

  useEffect(() => {
    const map = lastStatus.current;

    function process(
      orders: { id: string; status: OrderStatus; code: string }[],
      notify: boolean,
    ) {
      for (const o of orders) {
        const prev = map.get(o.id);
        map.set(o.id, o.status);
        if (!notify || prev === undefined || prev === o.status) continue;
        if (!useClientSettingsStore.getState().notifyReady) continue;
        const msg = notificationFor(prev, o.status, o.code);
        if (msg) void emitNotification(msg.title, msg.body);
      }
    }

    // Siembra inicial (sin avisar). Si ya hubo una carga real antes, arma de una vez.
    const init = useOrdersStore.getState();
    process(init.orders, false);
    if (init.loaded) armed.current = true;

    const unsub = useOrdersStore.subscribe((s) => {
      if (armed.current) {
        process(s.orders, true); // armado → avisa transiciones reales
        return;
      }
      process(s.orders, false); // aún no armado → sólo siembra
      if (s.loaded) armed.current = true; // 1ª carga real ya sembrada → armar
    });

    let timer: ReturnType<typeof setInterval> | null = null;
    if (token) {
      void useOrdersStore.getState().loadMine(token); // primera carga real
      timer = setInterval(() => {
        if (AppState.currentState === 'active') {
          void useOrdersStore.getState().loadMine(token);
        }
      }, POLL_MS);
    }

    return () => {
      unsub();
      if (timer) clearInterval(timer);
      armed.current = false; // reinicia baseline al desmontar / cambiar de cuenta
      map.clear();
    };
  }, [token]);
}
