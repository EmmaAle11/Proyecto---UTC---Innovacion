import { create } from 'zustand';

export interface Session {
  accessToken: string;
  refreshToken: string;
  email: string;
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
