import React from 'react';

/**
 * Chip de categoría / filtro seleccionable (papas, aguas, quesadillas…).
 */
export function Chip({ selected = false, icon, children, onClick, style, ...rest }) {
  const [hover, setHover] = React.useState(false);
  const base = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    height: 38, padding: icon ? '0 16px 0 13px' : '0 16px',
    borderRadius: 'var(--radius-pill)', cursor: 'pointer',
    fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, lineHeight: 1,
    whiteSpace: 'nowrap', userSelect: 'none',
    transition: 'all var(--dur-fast) var(--ease-standard)',
    border: selected ? '1px solid var(--naranja-500)' : '1px solid var(--border-default)',
    background: selected ? 'var(--naranja-500)' : (hover ? 'var(--gris-50)' : '#fff'),
    color: selected ? '#fff' : 'var(--text-heading)',
    boxShadow: selected ? 'var(--shadow-primary)' : 'var(--shadow-xs)',
    ...style,
  };
  return React.createElement('button', {
    type: 'button', onClick, style: base,
    onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    'aria-pressed': selected, ...rest,
  }, [
    icon ? React.createElement('span', { key: 'i', style: { display: 'inline-flex', width: 17, height: 17 } }, icon) : null,
    React.createElement('span', { key: 'l' }, children),
  ]);
}
