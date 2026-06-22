import * as React from 'react';

/**
 * Contenedor de superficie con la estética de tarjeta de la marca.
 */
export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  /** Eleva al pasar el cursor. */
  interactive?: boolean;
  /** Relleno interno. Default 'md'. */
  pad?: 'none' | 'sm' | 'md' | 'lg';
  /** Etiqueta HTML a renderizar. Default 'div'. */
  as?: keyof JSX.IntrinsicElements;
  children?: React.ReactNode;
}

export function Card(props: CardProps): JSX.Element;
