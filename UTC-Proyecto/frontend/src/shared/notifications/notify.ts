import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';

/**
 * Emisor de notificaciones del SISTEMA OPERATIVO, en dos frentes (no son la misma API):
 *  - Web (Chrome/Edge/Firefox): API `Notification` del navegador. Suena con la
 *    pestaña abierta; el permiso debe pedirse desde un gesto del usuario.
 *  - Nativo (Android/iOS, emulador o dispositivo): `expo-notifications` (notificación
 *    LOCAL inmediata). `expo-notifications` NO soporta web (docs v56), por eso el split.
 *
 * Esto NO es push remota (servidor → dispositivo con la app cerrada): es una
 * notificación local disparada por la propia app al detectar un cambio de estado
 * del pedido contra el backend (BR-015 = fuente de verdad). Honesto por la regla #0.
 */

const ANDROID_CHANNEL = 'pedidos';

// En foreground (app abierta) mostrar la notificación como banner + en la lista (API SDK 56).
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: () =>
      Promise.resolve({
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
  });
}

/** ¿Esta plataforma puede emitir notificaciones del SO? (web sin soporte → false). */
export function notificationsSupported(): boolean {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
  return true;
}

export type NotifPermission = 'granted' | 'denied' | 'undetermined';

/** Estado del permiso SIN pedirlo (para pintar el botón "Activar avisos"). */
export async function notificationPermission(): Promise<NotifPermission> {
  if (Platform.OS === 'web') {
    if (!notificationsSupported()) return 'denied';
    const p = window.Notification.permission; // 'default' | 'granted' | 'denied'
    return p === 'default' ? 'undetermined' : p;
  }
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted'
    ? 'granted'
    : status === 'denied'
      ? 'denied'
      : 'undetermined';
}

/**
 * Pide permiso de notificaciones. En web DEBE invocarse desde un gesto del usuario
 * (botón). En Android crea el canal antes de pedir. Devuelve true si quedó concedido.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') {
    if (!notificationsSupported()) return false;
    const res = await window.Notification.requestPermission();
    return res === 'granted';
  }
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL, {
      name: 'Pedidos',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 200, 100, 200],
    });
  }
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

/** Emite UNA notificación local del SO. No hace nada si no hay permiso/soporte. */
export async function emitNotification(title: string, body: string): Promise<void> {
  if (Platform.OS === 'web') {
    if (notificationsSupported() && window.Notification.permission === 'granted') {
      new window.Notification(title, { body });
    }
    return;
  }
  await Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // inmediata
  });
}
