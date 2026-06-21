import * as React from 'react';

/**
 * Control de cantidad − N + para items del carrito.
 */
export interface QtyStepperProps {
  /** Cantidad actual. */
  value?: number;
  /** Mínimo (default 1). */
  min?: number;
  /** Máximo (default 99). */
  max?: number;
  /** Callback con la nueva cantidad. */
  onChange?: (value: number) => void;
  /** Tamaño. Default 'md'. */
  size?: 'sm' | 'md';
  style?: React.CSSProperties;
}

export function QtyStepper(props: QtyStepperProps): JSX.Element;
