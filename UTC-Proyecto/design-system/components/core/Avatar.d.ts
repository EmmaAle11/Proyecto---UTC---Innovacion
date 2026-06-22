import * as React from 'react';

/**
 * Avatar circular: imagen si hay `src`, si no iniciales sobre color de marca.
 */
export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Nombre para iniciales y color. */
  name?: string;
  /** URL de imagen. */
  src?: string;
  /** Tamaño. Default 'md'. */
  size?: 'sm' | 'md' | 'lg';
}

export function Avatar(props: AvatarProps): JSX.Element;
