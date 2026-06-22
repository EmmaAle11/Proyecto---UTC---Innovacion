import * as React from 'react';

/**
 * Campo de texto con etiqueta, ícono y validación.
 */
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Etiqueta sobre el campo. */
  label?: string;
  /** Texto de ayuda debajo. */
  hint?: string;
  /** Mensaje de error (pinta el borde en rojo). */
  error?: string;
  /** Ícono a la izquierda (ReactNode). */
  leftIcon?: React.ReactNode;
}

export function Input(props: InputProps): JSX.Element;
