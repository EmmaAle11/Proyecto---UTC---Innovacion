import React from 'react';

const SIZES = { sm: 32, md: 40, lg: 56 };
const PALETTE = [
  ['var(--naranja-100)', 'var(--naranja-700)'],
  ['var(--azul-100)', 'var(--azul-700)'],
  ['var(--lima-100)', 'var(--lima-600)'],
  ['var(--mango-100)', 'var(--mango-600)'],
];

function initials(name) {
  if (!name) return '?';
  const p = name.trim().split(/\s+/);
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

/**
 * Avatar de usuario: imagen o iniciales con color derivado del nombre.
 */
export function Avatar({ name = '', src, size = 'md', style, ...rest }) {
  const dim = SIZES[size] || SIZES.md;
  const idx = (name.charCodeAt(0) || 0) % PALETTE.length;
  const [bg, fg] = PALETTE[idx];
  const base = {
    width: dim, height: dim, borderRadius: '50%', flex: 'none',
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    overflow: 'hidden', background: bg, color: fg,
    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: dim * 0.4,
    border: '1px solid rgba(2,22,66,.06)', ...style,
  };
  return React.createElement('span', { style: base, ...rest },
    src
      ? React.createElement('img', { src, alt: name, style: { width: '100%', height: '100%', objectFit: 'cover' } })
      : initials(name)
  );
}
