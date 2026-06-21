import React from 'react';

/**
 * Superficie/tarjeta base: fondo blanco, radio 20, sombra suave.
 * `interactive` añade elevación al hover. `pad` controla el relleno.
 */
export function Card({ interactive = false, pad = 'md', as = 'div', children, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const PADS = { none: 0, sm: 12, md: 16, lg: 20 };
  const base = {
    background: 'var(--surface-card)',
    border: '1px solid var(--border-subtle)',
    borderRadius: 'var(--radius-card)',
    padding: PADS[pad] ?? PADS.md,
    boxShadow: interactive && hover ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
    transform: interactive && hover ? 'translateY(-2px)' : 'none',
    transition: 'box-shadow var(--dur-base) var(--ease-standard), transform var(--dur-base) var(--ease-standard)',
    cursor: interactive ? 'pointer' : 'default',
    ...style,
  };
  return React.createElement(as, {
    style: base,
    onMouseEnter: interactive ? () => setHover(true) : undefined,
    onMouseLeave: interactive ? () => setHover(false) : undefined,
    ...rest,
  }, children);
}
