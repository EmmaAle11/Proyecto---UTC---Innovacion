import React from 'react';
import { Text as RNText, StyleSheet, TextProps, TextStyle } from 'react-native';
import { fonts, text } from '../theme/tokens';
import { useA11yStore, A11Y_TEXT_SCALE } from '../a11y/a11y.store';

/**
 * Primitivas tipográficas del sistema "Editorial Street-Food".
 * Centralizan las familias cargadas con expo-font para no repetir `fontFamily`
 * en cada pantalla. Cada una acepta `color` y `style` para ajustes puntuales.
 *
 * Accesibilidad (F4): leen el store `a11y` — "Texto grande" escala el `fontSize`
 * FINAL (incluye overrides inline) y "Alto contraste" oscurece el color por defecto
 * (respeta cualquier `color` explícito, para no romper los acentos de marca).
 *
 *  Display  → titulares enormes (Bricolage ExtraBold)
 *  Heading  → encabezados de sección (Bricolage Bold)
 *  Title    → títulos de tarjeta (Plus Jakarta Bold)
 *  Body     → texto corrido (Plus Jakarta Regular)
 *  Label    → etiquetas/overlines (Plus Jakarta SemiBold, mayúsculas)
 *  Mono     → números, turnos, códigos, semáforo (Space Mono)
 */

type BaseProps = TextProps & { color?: string };

function make(baseStyle: TextStyle, defaultColor: string, contrastColor: string) {
  return function TypeComponent({ color, style, ...rest }: BaseProps) {
    const largeText = useA11yStore((s) => s.largeText);
    const highContrast = useA11yStore((s) => s.highContrast);

    const flat = StyleSheet.flatten([baseStyle, style]) as TextStyle;
    const scaled: TextStyle | null =
      largeText && typeof flat.fontSize === 'number'
        ? {
            fontSize: Math.round(flat.fontSize * A11Y_TEXT_SCALE),
            ...(typeof flat.lineHeight === 'number'
              ? { lineHeight: Math.round(flat.lineHeight * A11Y_TEXT_SCALE) }
              : {}),
          }
        : null;
    // Sin color explícito → usamos el contrastado cuando "Alto contraste" está activo.
    const resolvedColor = color ?? (highContrast ? contrastColor : defaultColor);

    return <RNText {...rest} style={[flat, { color: resolvedColor }, scaled]} />;
  };
}

export const Display = make(
  { fontFamily: fonts.displayBlack, fontSize: 34, lineHeight: 38, letterSpacing: -0.6 },
  text.heading,
  text.heading,
);

export const Heading = make(
  { fontFamily: fonts.display, fontSize: 23, lineHeight: 27, letterSpacing: -0.3 },
  text.heading,
  text.heading,
);

export const Title = make(
  { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 21, letterSpacing: -0.1 },
  text.body,
  '#0B1220',
);

export const Body = make(
  { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  text.body,
  '#0B1220',
);

export const Label = make(
  { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  text.muted,
  text.body,
);

export const Mono = make(
  { fontFamily: fonts.mono, fontSize: 14, letterSpacing: 0.5 },
  text.body,
  '#0B1220',
);
