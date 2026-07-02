import { create } from 'zustand';
import type { Branch } from '../../../entities/branch/model/types';

interface BranchState {
  /** Cooperativa seleccionada. `null` hasta que la geolocalización o el usuario la fijan. */
  selected: Branch | null;
  manual: boolean; // true si el usuario eligió a mano → no se sobreescribe con la más cercana
  selectByUser: (b: Branch) => void;
  selectNearest: (b: Branch) => void;
}

/**
 * Sucursal/cooperativa de recogida (UI). NO arranca precargada: se detecta por
 * geolocalización (la UTC más cercana) o la elige el usuario. Mismo store para el
 * cliente (dónde recoge) y el admin (qué cooperativa opera).
 */
export const useBranchStore = create<BranchState>((set) => ({
  selected: null,
  manual: false,
  selectByUser: (b) => set({ selected: b, manual: true }),
  selectNearest: (b) => set((s) => (s.manual ? s : { selected: b, manual: false })),
}));
