import React from 'react';
import { Text as RNText, TextProps, TextStyle } from 'react-native';
import { fonts, text } from '../theme/tokens';

/**
 * Primitivas tipográficas del sistema "Editorial Street-Food".
 * Centralizan las familias cargadas con expo-font para no repetir `fontFamily`
 * en cada pantalla. Cada una acepta `color` y `style` para ajustes puntuales.
 *
 *  Display  → titulares enormes (Bricolage ExtraBold)
 *  Heading  → encabezados de sección (Bricolage Bold)
 *  Title    → títulos de tarjeta (Plus Jakarta Bold)
 *  Body     → texto corrido (Plus Jakarta Regular)
 *  Label    → etiquetas/overlines (Plus Jakarta SemiBold, mayúsculas)
 *  Mono     → números, turnos, códigos, semáforo (Space Mono)
 */

type BaseProps = TextProps & { color?: string };

function make(baseStyle: TextStyle, defaultColor: string) {
  return function TypeComponent({ color, style, ...rest }: BaseProps) {
    return <RNText {...rest} style={[baseStyle, { color: color ?? defaultColor }, style]} />;
  };
}

export const Display = make(
  { fontFamily: fonts.displayBlack, fontSize: 34, lineHeight: 38, letterSpacing: -0.6 },
  text.heading,
);

export const Heading = make(
  { fontFamily: fonts.display, fontSize: 23, lineHeight: 27, letterSpacing: -0.3 },
  text.heading,
);

export const Title = make(
  { fontFamily: fonts.bodyBold, fontSize: 16, lineHeight: 21, letterSpacing: -0.1 },
  text.body,
);

export const Body = make(
  { fontFamily: fonts.body, fontSize: 14, lineHeight: 20 },
  text.body,
);

export const Label = make(
  { fontFamily: fonts.bodySemi, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
  text.muted,
);

export const Mono = make(
  { fontFamily: fonts.mono, fontSize: 14, letterSpacing: 0.5 },
  text.body,
);
