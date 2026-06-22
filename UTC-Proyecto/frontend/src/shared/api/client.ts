import Constants from 'expo-constants';

// El backend NestJS corre en la máquina de desarrollo en el puerto 3001.
// En Expo Go (teléfono físico) 'localhost' apunta al teléfono, no a la PC →
// derivamos la IP del host del dev server de Expo (Constants.expoConfig.hostUri).
const BACKEND_PORT = 3001;

function resolveBaseUrl(): string {
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

/** POST JSON al backend; lanza `ApiError` con el mensaje del servidor si la respuesta no es ok. */
export async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
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
