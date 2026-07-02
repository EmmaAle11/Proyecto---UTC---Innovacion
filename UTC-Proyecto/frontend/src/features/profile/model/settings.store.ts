import { create } from 'zustand';

/**
 * Ajustes del cliente (avisos), UI-first en memoria. La ACCESIBILIDAD (texto grande,
 * contraste, reducir movimiento) vive ahora en `shared/a11y/a11y.store` (F4) y sí
 * aplica en toda la app; aquí solo queda el aviso de "pedido listo".
 */
interface ClientSettings {
  notifyReady: boolean;
  set: (patch: Partial<Omit<ClientSettings, 'set'>>) => void;
}

export const useClientSettingsStore = create<ClientSettings>((set) => ({
  // Arranca apagado: encenderlo PIDE el permiso del SO (no puede estar "on" sin permiso).
  notifyReady: false,
  set: (patch) => set(patch),
}));
