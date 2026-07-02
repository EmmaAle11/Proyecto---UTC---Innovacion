import { create } from 'zustand';
import { setTokenRefresher } from '../../../shared/api/client';
import { refreshSession } from '../api/auth.api';

export interface Session {
  accessToken: string;
  refreshToken: string;
  email: string;
  role: 'admin' | 'user';
}

interface SessionState {
  session: Session | null;
  setSession: (s: Session) => void;
  clear: () => void;
}

/** Sesión del cliente en memoria (demo). Persistencia con expo-secure-store es un siguiente paso. */
export const useSessionStore = create<SessionState>((set) => ({
  session: null,
  setSession: (session) => set({ session }),
  clear: () => set({ session: null }),
}));

// Refresco automático de sesión (al 401): renueva con el refresh_token y actualiza la
// sesión; si el refresh ya no vale, cierra sesión. Evita que, tras vencer el access
// token (~5 min), las acciones protegidas fallen con "Unauthorized" (p. ej. reoferta).
setTokenRefresher(async () => {
  const s = useSessionStore.getState().session;
  if (!s?.refreshToken) return null;
  try {
    const t = await refreshSession(s.refreshToken);
    useSessionStore.getState().setSession({
      ...s,
      accessToken: t.access_token,
      refreshToken: t.refresh_token,
    });
    return t.access_token;
  } catch {
    useSessionStore.getState().clear();
    return null;
  }
});
