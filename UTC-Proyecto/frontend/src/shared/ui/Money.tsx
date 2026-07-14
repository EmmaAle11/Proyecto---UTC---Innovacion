import React from 'react';
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { colors, fonts } from '../theme';

/**
 * Billetes y monedas de "UTC Pesos" (Universidad Tres Culturas) — dibujados en VECTOR.
 *
 * POR QUÉ VECTOR Y NO UNA IMAGEN POR DENOMINACIÓN:
 * el valor NO está horneado en el arte: lo imprime la app encima del lienzo. Un solo
 * componente cubre las 12 denominaciones de MXN; agregar una más cuesta un renglón en
 * `DENOMS`, cero arte. Además: transparencia real, nítido a cualquier escala y teñible
 * con los tokens de la paleta.
 *
 * Los .png de `assets/billete.png` / `assets/moneda.png` son PLANTILLAS de referencia
 * del diseñador. Cuando entregue las finales (con alfa y SIN cifra impresa), se sustituye
 * el cuerpo de <BillArt/> / <CoinArt/> por un <Image/> y el número sigue saliendo de aquí.
 */

// ————————————————————————————————————————————————————————————————
// Denominaciones REALES de MXN. El arte es UTC; el valor es peso mexicano,
// porque quien está en mostrador tiene que cuadrar la caja al final del día.
// Ojo: $20 existe como billete Y como moneda — por eso la llave es `kind + value`.
// ————————————————————————————————————————————————————————————————
export const BILL_VALUES = [20, 50, 100, 200, 500, 1000] as const;
export const COIN_VALUES = [0.5, 1, 2, 5, 10, 20] as const;

export type MoneyKind = 'billete' | 'moneda';

/** Tinte de cada billete: color propio para reconocerlo de un vistazo, como el dinero real. */
const BILL_TINT: Record<number, { ink: string; paper: string }> = {
  20: { ink: colors.azul[500], paper: colors.azul[50] },
  50: { ink: colors.naranja[500], paper: colors.naranja[50] },
  100: { ink: colors.lima[500], paper: colors.lima[50] },
  200: { ink: colors.mango[600], paper: colors.mango[50] },
  500: { ink: colors.azul[700], paper: colors.azul[100] },
  1000: { ink: colors.naranja[700], paper: colors.naranja[100] },
};

/** Las monedas son metálicas: chicas en plata (gris), grandes en latón (mango). */
const COIN_TINT = (value: number) =>
  value >= 5
    ? { ring: colors.mango[600], face: colors.mango[100], edge: colors.mango[400] }
    : { ring: colors.gris[500], face: colors.gris[100], edge: colors.gris[300] };

/** "$0.50" para centavos, "$20" para enteros — sin decimales inútiles. */
export function denomLabel(value: number): string {
  return value < 1 ? `$${value.toFixed(2)}` : `$${value}`;
}

// ————————————————————————————————————————————————————————————————
// BILLETE
// ————————————————————————————————————————————————————————————————

/** Proporción del billete mexicano real (≈2.1:1); alto se deriva del ancho. */
const BILL_RATIO = 0.47;

export function BillNote({ value, width = 96 }: { value: number; width?: number }) {
  const h = width * BILL_RATIO;
  const { ink, paper } = BILL_TINT[value] ?? BILL_TINT[100];
  const id = `bill${value}`;

  return (
    <Svg width={width} height={h} viewBox="0 0 200 94">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={paper} />
          <Stop offset="1" stopColor={colors.blanco} />
        </LinearGradient>
      </Defs>

      {/* Papel */}
      <Rect x="1" y="1" width="198" height="92" rx="7" fill={`url(#${id})`} stroke={ink} strokeWidth="2" />
      {/* Guilloché: marco interior punteado, como el dinero de verdad */}
      <Rect x="8" y="8" width="184" height="78" rx="4" fill="none" stroke={ink} strokeWidth="1" strokeDasharray="3 3" opacity={0.45} />

      {/* Medallón de la mascota (silueta: cuerpo redondo + pico + copete) */}
      <G opacity={0.9}>
        <Ellipse cx="46" cy="47" rx="26" ry="28" fill={ink} opacity={0.12} />
        <Circle cx="46" cy="49" r="17" fill={ink} opacity={0.55} />
        <Circle cx="40" cy="45" r="4" fill={colors.blanco} />
        <Circle cx="52" cy="45" r="4" fill={colors.blanco} />
        <Circle cx="40" cy="45" r="2" fill={colors.azul[900]} />
        <Circle cx="52" cy="45" r="2" fill={colors.azul[900]} />
        <Path d="M42 54 h8 l-4 5 z" fill={colors.mango[400]} />
        <Path d="M38 32 q8 -9 16 0" fill="none" stroke={ink} strokeWidth="2.5" strokeLinecap="round" />
      </G>

      {/* EL VALOR — lo escribe la app, no el arte. Aquí está la razón de ser del componente. */}
      <SvgText
        x="178"
        y="60"
        textAnchor="end"
        fontFamily={fonts.displayBlack}
        fontSize="38"
        fill={ink}
      >
        {value}
      </SvgText>
      <SvgText x="178" y="76" textAnchor="end" fontFamily={fonts.mono} fontSize="8" fill={ink} opacity={0.75}>
        UTC · PESOS
      </SvgText>
      {/* Cifra chica en la esquina opuesta (el eco del billete real) */}
      <SvgText x="16" y="24" fontFamily={fonts.monoBold} fontSize="11" fill={ink}>
        {value}
      </SvgText>
    </Svg>
  );
}

// ————————————————————————————————————————————————————————————————
// MONEDA
// ————————————————————————————————————————————————————————————————

export function CoinPiece({ value, size = 56 }: { value: number; size?: number }) {
  const { ring, face, edge } = COIN_TINT(value);
  const id = `coin${String(value).replace('.', '_')}`;
  // Las de centavos llevan 2 líneas ("0.50"), así que bajan un punto de tamaño.
  const isCents = value < 1;

  return (
    <Svg width={size} height={size} viewBox="0 0 100 100">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors.blanco} />
          <Stop offset="0.5" stopColor={face} />
          <Stop offset="1" stopColor={edge} />
        </LinearGradient>
      </Defs>

      {/* Canto + cara: dos anillos concéntricos = lectura inmediata de "moneda" */}
      <Circle cx="50" cy="50" r="48" fill={edge} />
      <Circle cx="50" cy="50" r="44" fill={`url(#${id})`} stroke={ring} strokeWidth="2" />
      <Circle cx="50" cy="50" r="35" fill="none" stroke={ring} strokeWidth="1" strokeDasharray="2 3" opacity={0.5} />

      {/* EL VALOR — otra vez: lo imprime la app. */}
      <SvgText
        x="50"
        y={isCents ? 57 : 63}
        textAnchor="middle"
        fontFamily={fonts.displayBlack}
        fontSize={isCents ? 26 : 36}
        fill={ring}
      >
        {value < 1 ? '50' : value}
      </SvgText>
      {isCents && (
        <SvgText x="50" y="72" textAnchor="middle" fontFamily={fonts.mono} fontSize="11" fill={ring}>
          ¢
        </SvgText>
      )}
    </Svg>
  );
}

/** Fachada única: la UI pide "dame un $50 en billete" sin saber qué SVG hay detrás. */
export function MoneyPiece({ kind, value, size }: { kind: MoneyKind; value: number; size?: number }) {
  return kind === 'billete' ? <BillNote value={value} width={size ?? 96} /> : <CoinPiece value={value} size={size ?? 56} />;
}
