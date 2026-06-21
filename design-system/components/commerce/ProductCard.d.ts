import * as React from 'react';
import { BadgeTone } from '../core/Badge';

/**
 * Tarjeta de producto del menú (compone Badge). Imagen opcional; si no hay
 * imagen, muestra un bloque tintado con `icon`.
 *
 * @startingPoint section="Commerce" subtitle="Tarjeta de producto con precio y tiempo de espera" viewport="280x320"
 */
export interface ProductCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Nombre del producto. */
  name: string;
  /** Precio (número sin símbolo, p.ej. 38). */
  price: number | string;
  /** Minutos de preparación estimados. */
  prepMin?: number;
  /** Categoría (eyebrow). */
  category?: string;
  /** URL de imagen del producto. */
  image?: string;
  /** Ícono de respaldo si no hay imagen (ReactNode). */
  icon?: React.ReactNode;
  /** Texto del badge de estado (p.ej. "Listo"). */
  status?: string;
  /** Tono del badge de estado. */
  tone?: BadgeTone;
  /** Minutos desde que quedó listo (muestra "Listo hace N min"). */
  readyAgo?: number;
  /** Marca el producto como popular. */
  popular?: boolean;
  /** Callback del botón +. */
  onAdd?: () => void;
}

export function ProductCard(props: ProductCardProps): JSX.Element;
