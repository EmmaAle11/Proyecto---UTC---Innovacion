import React from 'react';

/**
 * Campo de texto con etiqueta, ícono opcional, ayuda y estado de error.
 */
export function Input({
  label, hint, error, leftIcon, id, style, ...rest
}) {
  const [focus, setFocus] = React.useState(false);
  const inputId = id || React.useId();
  const borderColor = error
    ? 'var(--color-danger)'
    : focus ? 'var(--naranja-500)' : 'var(--border-default)';

  return React.createElement('div', { style: { display: 'flex', flexDirection: 'column', gap: 6, ...style } }, [
    label ? React.createElement('label', {
      key: 'l', htmlFor: inputId,
      style: { fontSize: 13, fontWeight: 600, color: 'var(--text-heading)' },
    }, label) : null,
    React.createElement('div', {
      key: 'wrap',
      style: {
        display: 'flex', alignItems: 'center', gap: 9,
        height: 48, padding: '0 14px', background: '#fff',
        border: `1.5px solid ${borderColor}`, borderRadius: 'var(--radius-md)',
        boxShadow: focus ? 'var(--ring-primary)' : 'none',
        transition: 'border-color var(--dur-fast), box-shadow var(--dur-fast)',
      },
    }, [
      leftIcon ? React.createElement('span', {
        key: 'i', style: { display: 'inline-flex', width: 18, height: 18, color: 'var(--text-muted)', flex: 'none' },
      }, leftIcon) : null,
      React.createElement('input', {
        key: 'in', id: inputId,
        onFocus: () => setFocus(true), onBlur: () => setFocus(false),
        style: {
          flex: 1, border: 'none', outline: 'none', background: 'transparent',
          fontFamily: 'var(--font-body)', fontSize: 15, color: 'var(--text-body)',
          minWidth: 0,
        }, ...rest,
      }),
    ]),
    error
      ? React.createElement('span', { key: 'e', style: { fontSize: 12, color: 'var(--color-danger)', fontWeight: 500 } }, error)
      : hint ? React.createElement('span', { key: 'h', style: { fontSize: 12, color: 'var(--text-muted)' } }, hint) : null,
  ]);
}
