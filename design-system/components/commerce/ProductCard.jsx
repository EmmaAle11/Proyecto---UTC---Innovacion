import React from 'react';
import { Badge } from '../core/Badge.jsx';

/**
 * Tarjeta de producto del menú: imagen, nombre, precio, tiempo de espera y
 * botón de agregar. Estado `cooking` / `ready` / `reoffer` muestra badge.
 */
export function ProductCard({
  name, price, prepMin, category, image, icon,
  status, tone = 'cooking', readyAgo, popular = false,
  onAdd, style, ...rest
}) {
  const [hover, setHover] = React.useState(false);
  const statusEl = status
    ? React.createElement(Badge, { tone, dot: true, size: 'sm' }, status)
    : null;

  const media = React.createElement('div', {
    style: {
      position: 'relative', height: 132, borderRadius: 'var(--radius-md)',
      overflow: 'hidden', background: image ? '#fff' : 'var(--azul-50)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12,
    },
  }, [
    image
      ? React.createElement('img', { key: 'img', src: image, alt: name, style: { width: '100%', height: '100%', objectFit: 'cover' } })
      : React.createElement('span', { key: 'ic', style: { color: 'var(--azul-300)', display: 'inline-flex', width: 40, height: 40 } }, icon),
    popular ? React.createElement('span', {
      key: 'pop', style: { position: 'absolute', top: 8, left: 8 },
    }, React.createElement(Badge, { tone: 'primary', size: 'sm', icon: '🔥' }, 'Popular')) : null,
    statusEl ? React.createElement('span', { key: 'st', style: { position: 'absolute', top: 8, right: 8 } }, statusEl) : null,
  ]);

  const addBtn = React.createElement('button', {
    type: 'button', onClick: onAdd, 'aria-label': 'Agregar ' + name,
    onMouseEnter: () => setHover(true), onMouseLeave: () => setHover(false),
    style: {
      width: 40, height: 40, borderRadius: 'var(--radius-md)', flex: 'none',
      border: 'none', cursor: 'pointer', color: '#fff',
      background: hover ? 'var(--color-primary-hover)' : 'var(--color-primary)',
      boxShadow: 'var(--shadow-primary)', fontSize: 22, fontWeight: 700, lineHeight: 1,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      transition: 'background var(--dur-fast), transform var(--dur-fast)',
      transform: hover ? 'scale(1.05)' : 'scale(1)',
    },
  }, '+');

  return React.createElement('div', {
    style: {
      background: 'var(--surface-card)', border: '1px solid var(--border-subtle)',
      borderRadius: 'var(--radius-card)', padding: 12, boxShadow: 'var(--shadow-sm)',
      display: 'flex', flexDirection: 'column', ...style,
    }, ...rest,
  }, [
    media,
    category ? React.createElement('div', {
      key: 'cat', style: { fontSize: 11, fontWeight: 700, letterSpacing: '.05em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: 4 },
    }, category) : null,
    React.createElement('div', {
      key: 'name', style: { fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: 'var(--text-heading)', lineHeight: 1.2, marginBottom: 6 },
    }, name),
    React.createElement('div', {
      key: 'meta', style: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, fontSize: 12.5, color: 'var(--text-muted)' },
    }, [
      prepMin != null ? React.createElement('span', { key: 'p', style: { display: 'inline-flex', alignItems: 'center', gap: 4 } }, '⏱ ' + prepMin + ' min') : null,
      readyAgo != null ? React.createElement('span', { key: 'r', style: { color: 'var(--lima-600)', fontWeight: 600 } }, 'Listo hace ' + readyAgo + ' min') : null,
    ]),
    React.createElement('div', {
      key: 'foot', style: { marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
    }, [
      React.createElement('span', {
        key: 'price', className: 'num',
        style: { fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 19, color: 'var(--text-heading)' },
      }, '$' + price),
      addBtn,
    ]),
  ]);
}
