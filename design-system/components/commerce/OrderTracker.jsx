import React from 'react';

const DEFAULT_STEPS = [
  { key: 'paid', label: 'Pagado' },
  { key: 'cooking', label: 'En preparación' },
  { key: 'ready', label: 'Listo para recoger' },
  { key: 'picked', label: 'Recogido' },
];

/**
 * Línea de progreso del pedido (Pagado → Preparación → Listo → Recogido).
 * `current` = índice del paso activo. `note` muestra texto bajo el paso activo.
 */
export function OrderTracker({ steps = DEFAULT_STEPS, current = 1, note, style, ...rest }) {
  return React.createElement('div', {
    style: { display: 'flex', alignItems: 'flex-start', ...style }, ...rest,
  }, steps.map((step, i) => {
    const done = i < current;
    const active = i === current;
    const color = done ? 'var(--lima-500)' : active ? 'var(--naranja-500)' : 'var(--gris-300)';
    const node = React.createElement('div', {
      style: { display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 'none', width: 64 },
    }, [
      React.createElement('div', {
        key: 'dot',
        style: {
          width: 26, height: 26, borderRadius: '50%', flex: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: done || active ? color : '#fff',
          border: done || active ? 'none' : '2px solid var(--gris-300)',
          color: '#fff', fontSize: 14, fontWeight: 700,
          boxShadow: active ? 'var(--shadow-primary)' : 'none',
        },
      }, done ? '✓' : (active ? '●' : '')),
      React.createElement('div', {
        key: 'lbl',
        style: {
          marginTop: 8, fontSize: 11, fontWeight: active ? 700 : 600, textAlign: 'center',
          color: active ? 'var(--text-heading)' : done ? 'var(--lima-600)' : 'var(--text-subtle)',
          lineHeight: 1.25,
        },
      }, step.label),
      active && note ? React.createElement('div', {
        key: 'note', className: 'num',
        style: { marginTop: 4, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--naranja-600)' },
      }, note) : null,
    ]);
    const connector = i < steps.length - 1
      ? React.createElement('div', {
          style: { flex: 1, height: 3, borderRadius: 3, marginTop: 11.5, background: i < current ? 'var(--lima-500)' : 'var(--gris-200)' },
        })
      : null;
    return React.createElement(React.Fragment, { key: step.key }, [node, connector]);
  }));
}
