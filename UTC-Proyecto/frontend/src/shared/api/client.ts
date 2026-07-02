import Constants from 'expo-constants';

// El backend NestJS corre en la máquina de desarrollo en el puerto 3002.
// En Expo Go (teléfono físico) 'localhost' apunta al teléfono, no a la PC →
// derivamos la IP del host del dev server de Expo (Constants.expoConfig.hostUri).
const BACKEND_PORT = 3002;

function resolveBaseUrl(): string {
  // 1) Override por variable de entorno (ideal en modo --tunnel): EXPO_PUBLIC_API_URL.
  //    Ej.: EXPO_PUBLIC_API_URL=http://192.168.1.81:3002 npx expo start --tunnel
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;
  // 2) Override por app.json / EAS (https://… en prod).
  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  if (extra?.apiUrl) return extra.apiUrl;
  // 3) Derivar del host del dev server (modo LAN). OJO: en --tunnel ese host es el de
  //    ngrok (no la IP de la PC), así que ahí hay que usar EXPO_PUBLIC_API_URL (paso 1).
  const hostUri = Constants.expoConfig?.hostUri; // p.ej. "192.168.1.5:8081"
  const host = hostUri?.split(':')[0];
  return host ? `http://${host}:${BACKEND_PORT}` : `http://localhost:${BACKEND_PORT}`;
}

export const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

/**
 * Renovador de sesión, inyectado por `features/auth` (no acoplamos `shared`→`features`).
 * Si una petición AUTENTICADA recibe 401 (access token vencido), el cliente pide un
 * token fresco (con el refresh_token) y reintenta UNA vez. Sin esto, tras ~5 min todas
 * las acciones protegidas (p. ej. reoferta del admin) fallaban con "Unauthorized".
 */
let tokenRefresher: (() => Promise<string | null>) | null = null;
export function setTokenRefresher(
  fn: (() => Promise<string | null>) | null,
): void {
  tokenRefresher = fn;
}

/** Corre `doFetch(token)`; si da 401 y hay refresher, renueva el token y reintenta 1 vez. */
async function fetchWithRefresh(
  doFetch: (token?: string) => Promise<Response>,
  token?: string,
): Promise<Response> {
  const res = await doFetch(token);
  if (res.status !== 401 || !token || !tokenRefresher) return res;
  const fresh = await tokenRefresher().catch(() => null);
  return fresh ? doFetch(fresh) : res;
}

/** Envía JSON (POST/PATCH) al backend; lanza `ApiError` con el mensaje del servidor si no es ok.
 *  Adjunta `Authorization: Bearer` si se pasa `token` (rutas protegidas). Timeout 12 s; el header
 *  `bypass-tunnel-reminder` evita la página de aviso de localtunnel cuando se expone por túnel. */
async function sendJson<T>(
  method: 'POST' | 'PATCH',
  path: string,
  body: unknown,
  token?: string,
): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const doFetch = (t?: string) => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'bypass-tunnel-reminder': 'true',
    };
    if (t) headers.Authorization = `Bearer ${t}`;
    return fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  };
  let res: Response;
  try {
    res = await fetchWithRefresh(doFetch, token);
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu red.', 0);
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const m = data.message;
    const message = Array.isArray(m)
      ? String(m[0])
      : typeof m === 'string'
        ? m
        : 'Algo salió mal, intenta de nuevo';
    throw new ApiError(message, res.status);
  }
  return data as T;
}

/** POST JSON (con token opcional para rutas protegidas). */
export function postJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  return sendJson<T>('POST', path, body, token);
}

/** PATCH JSON (edición parcial; token para rutas protegidas). */
export function patchJson<T>(path: string, body: unknown, token?: string): Promise<T> {
  return sendJson<T>('PATCH', path, body, token);
}

/** GET JSON al backend. Adjunta `Authorization: Bearer` si se pasa `token`
 *  (rutas protegidas por el guard JWT). Mismo timeout/errores que `postJson`. */
export async function getJson<T>(path: string, token?: string): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  const doFetch = (t?: string) => {
    const headers: Record<string, string> = { 'bypass-tunnel-reminder': 'true' };
    if (t) headers.Authorization = `Bearer ${t}`;
    return fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers,
      signal: controller.signal,
    });
  };
  let res: Response;
  try {
    res = await fetchWithRefresh(doFetch, token);
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. Revisa tu red.', 0);
  } finally {
    clearTimeout(timer);
  }
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) {
    const m = data.message;
    const message = Array.isArray(m)
      ? String(m[0])
      : typeof m === 'string'
        ? m
        : 'Algo salió mal, intenta de nuevo';
    throw new ApiError(message, res.status);
  }
  return data as T;
}
