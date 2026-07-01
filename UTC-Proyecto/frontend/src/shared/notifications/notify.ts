import { Platform } from 'react-native';
import Constants from 'expo-constants';

/**
 * Emisor de notificaciones del SISTEMA OPERATIVO, en dos frentes (no son la misma API):
 *  - Web (Chrome/Edge/Firefox): API `Notification` del navegador. Suena con la
 *    pestaña abierta; el permiso debe pedirse desde un gesto del usuario.
 *  - Nativo (Android/iOS) EN UN DEV BUILD: `expo-notifications` (notificación LOCAL
 *    inmediata). `expo-notifications` NO soporta web (docs v56), por eso el split.
 *
 * ⚠️ Expo Go: desde SDK 53 `expo-notifications` removió el push remoto y **solo
 * importar el módulo revienta la app en Expo Go** (llama a `addPushTokenListener`).
 * Por eso el módulo se carga de forma PEREZOSA y SOLO fuera de Expo Go. En Expo Go
 * las notificaciones del SO quedan deshabilitadas (la app funciona igual; el
 * seguimiento del pedido es por polling contra el backend, BR-015). Regla #0.
 *
 * Esto NO es push remota (servidor → dispositivo con la app cerrada): es una
 * notificación local disparada por la propia app al detectar un cambio de estado.
 */

type NotifModule = typeof import('expo-notifications');

const ANDROID_CHANNEL = 'pedidos';
// Expo Go se identifica por executionEnvironment 'storeClient' (expo-constants).
const isExpoGo = Constants.executionEnvironment === 'storeClient';
// Notificaciones nativas del SO solo en dev build / standalone (nunca en Expo Go ni web).
const nativeNotifs = Platform.OS !== 'web' && !isExpoGo;

let _mod: NotifModule | null = null;
let _handlerSet = false;

/** Carga perezosa de expo-notifications (solo se invoca cuando `nativeNotifs` es true). */
function getNotifications(): NotifModule {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  _mod ??= require('expo-notifications') as NotifModule;
  if (!_handlerSet) {
    // En foreground mostrar la notificación como banner + en la lista (API SDK 56).
    _mod.setNotificationHandler({
      handleNotification: () =>
        Promise.resolve({
          shouldPlaySound: true,
          shouldSetBadge: false,
          shouldShowBanner: true,
          shouldShowList: true,
        }),
    });
    _handlerSet = true;
  }
  return _mod;
}

/** ¿Esta plataforma puede emitir notificaciones del SO? (web sin soporte o Expo Go → false). */
export function notificationsSupported(): boolean {
  if (Platform.OS === 'web') {
    return typeof window !== 'undefined' && 'Notification' in window;
  }
  return nativeNotifs;
}

export type NotifPermission = 'granted' | 'denied' | 'undetermined';

/** Estado del permiso SIN pedirlo (para pintar el botón "Activar avisos"). */
export async function notificationPermission(): Promise<NotifPermission> {
  if (Platform.OS === 'web') {
    if (!notificationsSupported()) return 'denied';
    const p = window.Notification.permission; // 'default' | 'granted' | 'denied'
    return p === 'default' ? 'undetermined' : p;
  }
  if (!nativeNotifs) return 'denied';
  const { status } = await getNotifications().getPermissionsAsync();
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
  if (!nativeNotifs) return false;
  const Notifications = getNotifications();
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
  if (!nativeNotifs) return;
  await getNotifications().scheduleNotificationAsync({
    content: { title, body },
    trigger: null, // inmediata
  });
}
