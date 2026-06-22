import * as React from 'react';

/**
 * Chip de categoría/filtro seleccionable. Estado activo = naranja sólido.
 */
export interface ChipProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Activo/seleccionado. */
  selected?: boolean;
  /** Ícono opcional (ReactNode). */
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Chip(props: ChipProps): JSX.Element;
