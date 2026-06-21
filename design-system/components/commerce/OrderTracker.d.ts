import * as React from 'react';

export interface OrderStep { key: string; label: string; }

/**
 * Indicador de progreso del pedido a lo largo de su ciclo de vida.
 */
export interface OrderTrackerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Pasos (default: Pagado → Preparación → Listo → Recogido). */
  steps?: OrderStep[];
  /** Índice del paso activo (0-based). */
  current?: number;
  /** Nota bajo el paso activo (p.ej. temporizador). */
  note?: string;
}

export function OrderTracker(props: OrderTrackerProps): JSX.Element;
