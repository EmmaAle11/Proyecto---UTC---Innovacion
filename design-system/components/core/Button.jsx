import React from 'react';

const SIZES = {
  sm: { height: 36, padding: '0 14px', fontSize: 13, radius: 'var(--radius-sm)', gap: 7, icon: 16 },
  md: { height: 44, padding: '0 18px', fontSize: 15, radius: 'var(--radius-md)', gap: 8, icon: 18 },
  lg: { height: 52, padding: '0 24px', fontSize: 16, radius: 'var(--radius-lg)', gap: 10, icon: 20 },
};

const VARIANTS = {
  primary: {
    background: 'var(--color-primary)', color: 'var(--color-on-primary)',
    border: '1px solid transparent', boxShadow: 'var(--shadow-primary)',
    hover: { background: 'var(--color-primary-hover)' },
  },
  institutional: {
    background: 'var(--color-institutional)', color: '#fff',
    border: '1px solid transparent', boxShadow: 'var(--shadow-sm)',
    hover: { background: 'var(--azul-600)' },
  },
  secondary: {
    background: '#fff', color: 'var(--text-heading)',
    border: '1px solid var(--border-default)', boxShadow: 'var(--shadow-xs)',
    hover: { background: 'var(--gris-50)', borderColor: 'var(--border-strong)' },
  },
  soft: {
    background: 'var(--naranja-50)', color: 'var(--naranja-700)',
    border: '1px solid transparent', boxShadow: 'none',
    hover: { background: 'var(--naranja-100)' },
  },
  ghost: {
    background: 'transparent', color: 'var(--text-heading)',
    border: '1px solid transparent', boxShadow: 'none',
    hover: { background: 'var(--gris-100)' },
  },
  danger: {
    background: 'var(--color-danger)', color: '#fff',
    border: '1px solid transparent', boxShadow: 'none',
    hover: { background: 'var(--rojo-600)' },
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  fullWidth = false,
  loading = false,
  disabled = false,
  type = 'button',
  href,
  children,
  style,
  ...rest
}) {
  const s = SIZES[size] || SIZES.md;
  const v = VARIANTS[variant] || VARIANTS.primary;
  const [hover, setHover] = React.useState(false);
  const isDisabled = disabled || loading;

  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    gap: s.gap, height: s.height, minWidth: s.height, padding: s.padding,
    fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: s.fontSize,
    lineHeight: 1, letterSpacing: '-0.005em', borderRadius: s.radius,
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : undefined, whiteSpace: 'nowrap',
    transition: 'background var(--dur-fast) var(--ease-standard), transform var(--dur-fast) var(--ease-standard), box-shadow var(--dur-fast) var(--ease-standard)',
    transform: hover && !isDisabled ? 'translateY(-1px)' : 'translateY(0)',
    opacity: isDisabled ? 0.5 : 1,
    ...v,
    ...(hover && !isDisabled ? v.hover : null),
    ...style,
  };
  delete base.hover;

  const iconWrap = (node) => node
    ? React.createElement('span', {
        style: { display: 'inline-flex', width: s.icon, height: s.icon, flex: 'none' },
      }, node)
    : null;

  const content = [
    loading
      ? React.createElement('span', {
          key: 'spin',
          style: {
            width: s.icon, height: s.icon, borderRadius: '50%',
            border: '2px solid currentColor', borderTopColor: 'transparent',
            display: 'inline-block', animation: 'utc-spin 0.7s linear infinite',
          },
        })
      : iconWrap(leftIcon),
    children != null ? React.createElement('span', { key: 'label' }, children) : null,
    iconWrap(rightIcon),
  ];

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: base,
  };

  if (href && !isDisabled) {
    return React.createElement('a', { href, ...handlers, ...rest }, content);
  }
  return React.createElement('button', { type, disabled: isDisabled, ...handlers, ...rest }, content);
}

if (typeof document !== 'undefined' && !document.getElementById('utc-spin-kf')) {
  const el = document.createElement('style');
  el.id = 'utc-spin-kf';
  el.textContent = '@keyframes utc-spin{to{transform:rotate(360deg)}}';
  document.head.appendChild(el);
}
