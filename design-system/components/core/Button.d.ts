import * as React from 'react';

export type ButtonVariant = 'primary' | 'institutional' | 'secondary' | 'soft' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

/**
 * Botón de acción de UTC Pick Sazón. Primary = naranja institucional (CTA),
 * institutional = azul, secondary/soft/ghost para acciones de menor jerarquía.
 *
 * @startingPoint section="Core" subtitle="Botón de acción con variantes e íconos" viewport="700x150"
 */
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Jerarquía visual. Default 'primary'. */
  variant?: ButtonVariant;
  /** Tamaño. Default 'md' (altura mínima de toque 44px). */
  size?: ButtonSize;
  /** Ícono a la izquierda del texto (ReactNode, p.ej. <i data-lucide>). */
  leftIcon?: React.ReactNode;
  /** Ícono a la derecha del texto. */
  rightIcon?: React.ReactNode;
  /** Ocupa todo el ancho disponible. */
  fullWidth?: boolean;
  /** Muestra spinner y deshabilita. */
  loading?: boolean;
  /** Renderiza como <a> con este href. */
  href?: string;
  children?: React.ReactNode;
}

export function Button(props: ButtonProps): JSX.Element;
