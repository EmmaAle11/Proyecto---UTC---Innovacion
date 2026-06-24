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
// Familias reales cargadas en App.tsx con expo-font (@expo-google-fonts/*).
// El nombre = clave exacta registrada en useFonts() = nombre del módulo de la fuente.
export const fonts = {
  // Display / titulares — Bricolage Grotesque (editorial, con carácter)
  display: 'BricolageGrotesque_700Bold',
  displayBlack: 'BricolageGrotesque_800ExtraBold',
  displaySemi: 'BricolageGrotesque_600SemiBold',
  // Cuerpo — Plus Jakarta Sans (limpia, legible)
  body: 'PlusJakartaSans_400Regular',
  bodyMedium: 'PlusJakartaSans_500Medium',
  bodySemi: 'PlusJakartaSans_600SemiBold',
  bodyBold: 'PlusJakartaSans_700Bold',
  // Números / turnos / códigos / semáforo — Space Mono (aire de "ticket")
  mono: 'SpaceMono_400Regular',
  monoBold: 'SpaceMono_700Bold',
} as const;

// Tokens semánticos: aliases legibles sobre las rampas de color.
export const text = {
  heading: colors.azul[700],
  body: colors.gris[800],
  muted: colors.gris[500],
  subtle: colors.gris[400],
  onInk: colors.blanco, // texto sobre superficies navy
  onInkMuted: colors.azul[200],
} as const;
export const border = { subtle: colors.gris[200], default: colors.gris[300], strong: colors.gris[400] } as const;
export const surface = {
  page: colors.gris[50],
  card: colors.blanco,
  ink: colors.azul[900], // navy profundo para secciones editoriales oscuras
  inkSoft: colors.azul[800],
} as const;

/** Sombras suaves para tarjetas y elementos flotantes (cross-platform). */
export const shadow = {
  card: { shadowColor: '#0A1430', shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  floating: { shadowColor: '#0A1430', shadowOpacity: 0.18, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 9 },
} as const;

/** Colores de estado de producto/pedido: bg (fondo de la píldora), fg (texto), dot (punto). */
export const state = {
  cooking: { bg: colors.mango[50], fg: colors.mango[600], dot: colors.mango[400] },
  ready: { bg: colors.lima[50], fg: colors.lima[600], dot: colors.lima[500] },
  reoffer: { bg: colors.naranja[50], fg: colors.naranja[700], dot: colors.naranja[500] },
} as const;
