import { create } from 'zustand';

/**
 * Ajustes del cliente (accesibilidad + avisos), UI-first en memoria (como los del
 * admin). Los toggles sí cambian de estado y persisten durante la sesión; aplicarlos
 * a toda la app (escala de texto, contraste) es un siguiente paso.
 */
interface ClientSettings {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  notifyReady: boolean;
  set: (patch: Partial<Omit<ClientSettings, 'set'>>) => void;
}

export const useClientSettingsStore = create<ClientSettings>((set) => ({
  largeText: false,
  highContrast: false,
  reduceMotion: false,
  // Arranca apagado: encenderlo PIDE el permiso del SO (no puede estar "on" sin permiso).
  notifyReady: false,
  set: (patch) => set(patch),
}));
