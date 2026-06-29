import { create } from 'zustand';

/** Tipo de tarjeta de pago (BR-009, sin efectivo: ese es fijo "en mostrador"). */
export type CardKind = 'mercado_pago' | 'tdc' | 'tdd' | 'paypal';

export type CardColor = 'azul500' | 'azul700' | 'white';

export interface PaymentCard {
  id: string;
  brand: string; // etiqueta visible
  kind: CardKind;
  holder: string; // titular o correo
  last4: string; // últimos 4 (o referencia)
  color: CardColor;
}

/** Catálogo de tipos para el alta/edición; el color y la etiqueta se derivan del tipo. */
export const CARD_KINDS: { kind: CardKind; label: string; color: CardColor }[] = [
  { kind: 'mercado_pago', label: 'Mercado Pago', color: 'azul500' },
  { kind: 'tdc', label: 'Tarjeta de crédito', color: 'azul700' },
  { kind: 'tdd', label: 'Tarjeta de débito', color: 'azul700' },
  { kind: 'paypal', label: 'PayPal', color: 'white' },
];

function makeId(): string {
  return `c_${Date.now().toString(36)}_${Math.floor(Math.random() * 1e6).toString(36)}`;
}

interface WalletState {
  cards: PaymentCard[];
  add: (input: { kind: CardKind; holder: string; last4: string }) => void;
  update: (id: string, patch: { kind?: CardKind; holder?: string; last4?: string }) => void;
  remove: (id: string) => void;
}

function fromKind(kind: CardKind): { brand: string; color: CardColor } {
  const meta = CARD_KINDS.find((k) => k.kind === kind) ?? CARD_KINDS[0];
  return { brand: meta.label, color: meta.color };
}

/** Cartera del cliente (UI-first, en memoria). Pagos reales en una versión futura (D-006). */
export const useWalletStore = create<WalletState>((set) => ({
  cards: [
    { id: 'seed-mp', brand: 'Mercado Pago', kind: 'mercado_pago', holder: 'ALUMNO UTC', last4: '4242', color: 'azul500' },
    { id: 'seed-pp', brand: 'PayPal', kind: 'paypal', holder: 'alumno@edu.utc.mx', last4: '0094', color: 'white' },
  ],
  add: ({ kind, holder, last4 }) =>
    set((s) => ({
      cards: [...s.cards, { id: makeId(), holder, last4, kind, ...fromKind(kind) }],
    })),
  update: (id, patch) =>
    set((s) => ({
      cards: s.cards.map((c) =>
        c.id === id
          ? { ...c, ...patch, ...(patch.kind ? fromKind(patch.kind) : {}) }
          : c,
      ),
    })),
  remove: (id) => set((s) => ({ cards: s.cards.filter((c) => c.id !== id) })),
}));
