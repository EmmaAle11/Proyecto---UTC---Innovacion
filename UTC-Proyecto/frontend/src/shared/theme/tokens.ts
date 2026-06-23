export const colors = {
  naranja: { 50: '#FFF1EB', 100: '#FFDDCF', 200: '#FFB89E', 300: '#FB8D63', 400: '#F26336', 500: '#E34100', 600: '#C23500', 700: '#9C2B00', 800: '#762200', 900: '#511800' },
  azul: { 50: '#EDF1FA', 100: '#D4DCF1', 200: '#A6B6E0', 300: '#6982C9', 400: '#3358B8', 500: '#1A4099', 600: '#0A2E7A', 700: '#021E5E', 800: '#021642', 900: '#010E2E' },
  gris: { 50: '#F6F7F9', 100: '#EDEFF3', 200: '#DEE2EA', 300: '#C7CDD9', 400: '#9BA4B5', 500: '#6C7689', 600: '#4A5468', 700: '#353D4E', 800: '#232A38', 900: '#141926' },
  lima: { 50: '#EAF7EE', 100: '#C8ECD3', 500: '#15915B', 600: '#0F7549' },
  mango: { 50: '#FFF7E6', 100: '#FFE9B8', 400: '#F2A900', 600: '#B07700' },
  rojo: { 50: '#FDECEC', 500: '#D7263D', 600: '#B01B30' },
  blanco: '#FFFFFF',
  primary: '#E34100',
  institutional: '#021E5E',
} as const;

export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, card: 20, pill: 999 } as const;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;
export const fonts = { display: 'BricolageGrotesque', body: 'PlusJakartaSans', mono: 'SpaceMono' } as const;

// Tokens semánticos (mapeados de design-system/tokens/colors.css). Aliases sobre las rampas.
export const text = { heading: colors.azul[700], muted: colors.gris[500], subtle: colors.gris[400] } as const;
export const border = { subtle: colors.gris[200], default: colors.gris[300], strong: colors.gris[400] } as const;
export const surface = { page: colors.gris[50] } as const;

/** Colores de estado de producto/pedido: bg (fondo de la píldora), fg (texto), dot (punto). */
export const state = {
  cooking: { bg: colors.mango[50], fg: colors.mango[600], dot: colors.mango[400] },
  ready: { bg: colors.lima[50], fg: colors.lima[600], dot: colors.lima[500] },
  reoffer: { bg: colors.naranja[50], fg: colors.naranja[700], dot: colors.naranja[500] },
} as const;
