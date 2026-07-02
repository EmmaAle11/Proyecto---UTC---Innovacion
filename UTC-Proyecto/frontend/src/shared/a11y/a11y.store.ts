import { create } from 'zustand';

/**
 * Preferencias de ACCESIBILIDAD (F4/§3.1), en `shared` para que las consuman las
 * primitivas de texto y cualquier pantalla sin romper FSD. Las pantallas de cuenta
 * (cliente y admin) las escriben; `Type` las lee para escalar el texto y subir el
 * contraste, y las animaciones se apagan con `reduceMotion`.
 */
interface A11yState {
  largeText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  set: (patch: Partial<Omit<A11yState, 'set'>>) => void;
}

/** Cuánto crece el texto cuando "Texto grande" está activo. */
export const A11Y_TEXT_SCALE = 1.18;

export const useA11yStore = create<A11yState>((set) => ({
  largeText: false,
  highContrast: false,
  reduceMotion: false,
  set: (patch) => set(patch),
}));
