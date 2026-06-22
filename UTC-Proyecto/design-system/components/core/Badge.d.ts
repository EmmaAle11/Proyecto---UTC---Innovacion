import * as React from 'react';

export type BadgeTone =
  | 'neutral' | 'primary' | 'institutional'
  | 'cooking' | 'ready' | 'reoffer'
  | 'success' | 'warning' | 'danger' | 'solid';

/**
 * Etiqueta compacta de estado. Usa `cooking` / `ready` / `reoffer` para los
 * estados de pedido de la cooperativa; el resto para metadatos genéricos.
 */
export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Color semántico. Default 'neutral'. */
  tone?: BadgeTone;
  /** Tamaño. Default 'md'. */
  size?: 'sm' | 'md';
  /** Muestra un punto de color antes del texto. */
  dot?: boolean;
  /** Ícono opcional (ReactNode). */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Badge(props: BadgeProps): JSX.Element;
