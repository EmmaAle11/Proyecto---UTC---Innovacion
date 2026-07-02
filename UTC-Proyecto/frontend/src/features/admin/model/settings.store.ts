import { create } from 'zustand';

/**
 * Ajustes del administrador (personalización + accesibilidad), UI-first.
 * Hoy viven en memoria; se persisten en el "turno de datos". Lo que se cambia
 * aquí se refleja en vivo (p. ej. los umbrales mueven el semáforo del Dashboard).
 */
interface AdminSettings {
  // Personalización
  branchName: string;
  address: string;
  schedule: string;
  semaforoYellow: number; // pasa a Amarillo al llegar a este número en cola
  semaforoRed: number; // pasa a Rojo al superar este número
  // Accesibilidad: vive en `shared/a11y/a11y.store` (F4), no aquí.
  notifyOrders: boolean;
  /** Actualiza uno o varios ajustes. */
  set: (patch: Partial<Omit<AdminSettings, 'set'>>) => void;
}

export const useSettingsStore = create<AdminSettings>((set) => ({
  branchName: 'UTC Tlalpan',
  address: 'Calz. de Tlalpan 639, Álamos, CDMX',
  schedule: 'Recreo · 9:00 – 11:00',
  semaforoYellow: 5,
  semaforoRed: 10,
  // Arranca apagado: activarlo pide el permiso del SO (no puede notificar sin permiso).
  notifyOrders: false,
  set: (patch) => set(patch),
}));
