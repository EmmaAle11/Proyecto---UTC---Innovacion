import React from 'react';

/**
 * Selector de cantidad − N + para el carrito.
 */
export function QtyStepper({ value = 1, min = 1, max = 99, onChange, size = 'md', style, ...rest }) {
  const dim = size === 'sm' ? 30 : 36;
  const set = (n) => { const v = Math.max(min, Math.min(max, n)); if (v !== value && onChange) onChange(v); };
  const btn = (label, on, disabled) => React.createElement('button', {
    type: 'button', onClick: on, disabled, 'aria-label': label,
    style: {
      width: dim, height: dim, borderRadius: '50%', flex: 'none',
      border: '1.5px solid var(--border-default)', background: '#fff',
      color: disabled ? 'var(--text-subtle)' : 'var(--text-heading)',
      fontSize: size === 'sm' ? 17 : 19, fontWeight: 700, lineHeight: 1,
      cursor: disabled ? 'not-allowed' : 'pointer',
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background var(--dur-fast), border-color var(--dur-fast)',
    },
    onMouseEnter: (e) => { if (!disabled) { e.currentTarget.style.background = 'var(--gris-50)'; e.currentTarget.style.borderColor = 'var(--border-strong)'; } },
    onMouseLeave: (e) => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = 'var(--border-default)'; },
  }, label);
  return React.createElement('div', {
    style: { display: 'inline-flex', alignItems: 'center', gap: 12, ...style }, ...rest,
  }, [
    btn('−', () => set(value - 1), value <= min),
    React.createElement('span', {
      key: 'v', className: 'num',
      style: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: size === 'sm' ? 15 : 17, color: 'var(--text-heading)', minWidth: 22, textAlign: 'center' },
    }, value),
    btn('+', () => set(value + 1), value >= max),
  ]);
}
