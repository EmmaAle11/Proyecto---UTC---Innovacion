import React from 'react';

const TONES = {
  neutral:  { bg: 'var(--gris-100)',          fg: 'var(--gris-700)',          dot: 'var(--gris-400)' },
  primary:  { bg: 'var(--naranja-50)',        fg: 'var(--naranja-700)',       dot: 'var(--naranja-500)' },
  institutional: { bg: 'var(--azul-50)',      fg: 'var(--azul-700)',          dot: 'var(--azul-500)' },
  cooking:  { bg: 'var(--state-cooking-bg)',  fg: 'var(--state-cooking-fg)',  dot: 'var(--state-cooking-dot)' },
  ready:    { bg: 'var(--state-ready-bg)',    fg: 'var(--state-ready-fg)',    dot: 'var(--state-ready-dot)' },
  reoffer:  { bg: 'var(--state-reoffer-bg)',  fg: 'var(--state-reoffer-fg)',  dot: 'var(--state-reoffer-dot)' },
  success:  { bg: 'var(--lima-50)',           fg: 'var(--lima-600)',          dot: 'var(--lima-500)' },
  warning:  { bg: 'var(--mango-50)',          fg: 'var(--mango-600)',         dot: 'var(--mango-400)' },
  danger:   { bg: 'var(--rojo-50)',           fg: 'var(--rojo-600)',          dot: 'var(--rojo-500)' },
  solid:    { bg: 'var(--naranja-500)',       fg: '#fff',                     dot: '#fff' },
};

const SIZES = {
  sm: { fontSize: 11, padding: '3px 8px', dot: 6, gap: 5 },
  md: { fontSize: 12.5, padding: '5px 11px', dot: 7, gap: 6 },
};

export function Badge({ tone = 'neutral', size = 'md', dot = false, icon, children, style, ...rest }) {
  const t = TONES[tone] || TONES.neutral;
  const s = SIZES[size] || SIZES.md;
  return React.createElement('span', {
    style: {
      display: 'inline-flex', alignItems: 'center', gap: s.gap,
      padding: s.padding, borderRadius: 'var(--radius-pill)',
      background: t.bg, color: t.fg,
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: s.fontSize,
      lineHeight: 1, letterSpacing: '0.005em', whiteSpace: 'nowrap', ...style,
    }, ...rest,
  }, [
    dot ? React.createElement('span', { key: 'd', style: { width: s.dot, height: s.dot, borderRadius: '50%', background: t.dot, flex: 'none' } }) : null,
    icon ? React.createElement('span', { key: 'i', style: { display: 'inline-flex', width: s.fontSize + 2, height: s.fontSize + 2 } }, icon) : null,
    children != null ? React.createElement('span', { key: 'l' }, children) : null,
  ]);
}
