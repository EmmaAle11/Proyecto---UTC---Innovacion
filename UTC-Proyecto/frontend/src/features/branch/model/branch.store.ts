import { create } from 'zustand';
import type { Branch } from '../../../entities/branch/model/types';
import { DEFAULT_BRANCH } from '../../../entities/branch/mock';

interface BranchState {
  selected: Branch;
  manual: boolean; // true si el usuario eligió a mano → no se sobreescribe con la más cercana
  selectByUser: (b: Branch) => void;
  selectNearest: (b: Branch) => void;
}

/** Sucursal de recogida seleccionada (UI). Por defecto la sede CDMX. */
export const useBranchStore = create<BranchState>((set) => ({
  selected: DEFAULT_BRANCH,
  manual: false,
  selectByUser: (b) => set({ selected: b, manual: true }),
  selectNearest: (b) => set((s) => (s.manual ? s : { selected: b, manual: false })),
}));
