/* UTC Pick Sazón · UI kit — shared primitives, phone shell, sample data.
   Self-contained cosmetic mirror of the design-system components so the
   kit renders standalone. Exports to window for the screen files. */

const { useState, useEffect, useRef } = React;

/* ---- icon helper: re-run lucide after every render ---- */
function useIcons(dep) {
  useEffect(() => { if (window.lucide) window.lucide.createIcons(); });
}
const Ic = ({ n, s }) => <i data-lucide={n} style={s}></i>;

/* ---- Button ---- */
function Button({ variant = 'primary', size = 'md', leftIcon, rightIcon, fullWidth, disabled, onClick, children, style }) {
  const sizes = {
    sm: { height: 36, padding: '0 14px', fontSize: 13, radius: 10 },
    md: { height: 46, padding: '0 18px', fontSize: 15, radius: 14 },
    lg: { height: 54, padding: '0 22px', fontSize: 16, radius: 18 },
  }[size];
  const variants = {
    primary: { background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-primary)', border: '1px solid transparent' },
    institutional: { background: 'var(--azul-700)', color: '#fff', border: '1px solid transparent' },
    secondary: { background: '#fff', color: 'var(--text-heading)', border: '1px solid var(--border-default)' },
    ghost: { background: 'transparent', color: 'var(--text-heading)', border: '1px solid transparent' },
  }[variant];
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
      height: sizes.height, padding: sizes.padding, borderRadius: sizes.radius,
      fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: sizes.fontSize, lineHeight: 1,
      cursor: disabled ? 'not-allowed' : 'pointer', width: fullWidth ? '100%' : undefined,
      opacity: disabled ? 0.5 : 1, transition: 'filter .12s', ...variants, ...style,
    }}
      onMouseDown={e => e.currentTarget.style.filter = 'brightness(0.94)'}
      onMouseUp={e => e.currentTarget.style.filter = 'none'}
      onMouseLeave={e => e.currentTarget.style.filter = 'none'}>
      {leftIcon && <span style={{ display: 'inline-flex', width: 18, height: 18 }}>{leftIcon}</span>}
      {children}
      {rightIcon && <span style={{ display: 'inline-flex', width: 18, height: 18 }}>{rightIcon}</span>}
    </button>
  );
}

/* ---- Badge ---- */
function Badge({ tone = 'neutral', dot, icon, children, style }) {
  const tones = {
    neutral: ['var(--gris-100)', 'var(--gris-700)', 'var(--gris-400)'],
    primary: ['var(--naranja-50)', 'var(--naranja-700)', 'var(--naranja-500)'],
    cooking: ['var(--state-cooking-bg)', 'var(--state-cooking-fg)', 'var(--state-cooking-dot)'],
    ready: ['var(--state-ready-bg)', 'var(--state-ready-fg)', 'var(--state-ready-dot)'],
    reoffer: ['var(--state-reoffer-bg)', 'var(--state-reoffer-fg)', 'var(--state-reoffer-dot)'],
    success: ['var(--lima-50)', 'var(--lima-600)', 'var(--lima-500)'],
  }[tone];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 10px',
      borderRadius: 999, background: tones[0], color: tones[1], fontWeight: 700, fontSize: 12, lineHeight: 1, whiteSpace: 'nowrap', ...style }}>
      {dot && <span style={{ width: 7, height: 7, borderRadius: '50%', background: tones[2] }}></span>}
      {icon}{children}
    </span>
  );
}

/* ---- Chip ---- */
function Chip({ selected, icon, children, onClick }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, height: 38, padding: icon ? '0 15px 0 12px' : '0 15px',
      borderRadius: 999, cursor: 'pointer', fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: 14, whiteSpace: 'nowrap',
      border: selected ? '1px solid var(--naranja-500)' : '1px solid var(--border-default)',
      background: selected ? 'var(--naranja-500)' : '#fff', color: selected ? '#fff' : 'var(--text-heading)',
      boxShadow: selected ? 'var(--shadow-primary)' : 'var(--shadow-xs)', flex: 'none',
    }}>
      {icon && <span style={{ display: 'inline-flex', width: 16, height: 16 }}>{icon}</span>}{children}
    </button>
  );
}

/* ---- product media block (tinted, icon fallback) ---- */
function Media({ icon, height = 120, children }) {
  return (
    <div style={{ position: 'relative', height, borderRadius: 14, overflow: 'hidden',
      background: 'linear-gradient(135deg, var(--azul-50), var(--naranja-50))',
      display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <span style={{ width: 42, height: 42, color: 'var(--azul-300)', display: 'inline-flex' }}><Ic n={icon} /></span>
      {children}
    </div>
  );
}

/* ---- QtyStepper ---- */
function QtyStepper({ value, min = 1, max = 20, onChange, size = 'md' }) {
  const dim = size === 'sm' ? 30 : 38;
  const B = ({ label, on, off }) => (
    <button onClick={off ? undefined : on} disabled={off} style={{ width: dim, height: dim, borderRadius: '50%',
      border: '1.5px solid var(--border-default)', background: '#fff', color: off ? 'var(--text-subtle)' : 'var(--text-heading)',
      fontSize: 18, fontWeight: 700, cursor: off ? 'not-allowed' : 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{label}</button>
  );
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12 }}>
      <B label="−" on={() => onChange(value - 1)} off={value <= min} />
      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, minWidth: 22, textAlign: 'center', color: 'var(--text-heading)' }}>{value}</span>
      <B label="+" on={() => onChange(value + 1)} off={value >= max} />
    </div>
  );
}

/* ---- OrderTracker ---- */
function OrderTracker({ current, note }) {
  const steps = [
    { k: 'paid', l: 'Pagado' }, { k: 'cooking', l: 'En preparación' },
    { k: 'ready', l: 'Listo' }, { k: 'picked', l: 'Recogido' },
  ];
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
      {steps.map((s, i) => {
        const done = i < current, active = i === current;
        const color = done ? 'var(--lima-500)' : active ? 'var(--naranja-500)' : 'var(--gris-300)';
        return (
          <React.Fragment key={s.k}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 62, flex: 'none' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: done || active ? color : '#fff', border: done || active ? 'none' : '2px solid var(--gris-300)',
                color: '#fff', fontSize: 13, fontWeight: 700, boxShadow: active ? 'var(--shadow-primary)' : 'none' }}>
                {done ? '✓' : active ? '●' : ''}
              </div>
              <div style={{ marginTop: 7, fontSize: 11, fontWeight: active ? 700 : 600, textAlign: 'center', lineHeight: 1.2,
                color: active ? 'var(--text-heading)' : done ? 'var(--lima-600)' : 'var(--text-subtle)' }}>{s.l}</div>
              {active && note && <div style={{ marginTop: 3, fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--naranja-600)' }}>{note}</div>}
            </div>
            {i < steps.length - 1 && <div style={{ flex: 1, height: 3, borderRadius: 3, marginTop: 11.5, background: i < current ? 'var(--lima-500)' : 'var(--gris-200)' }}></div>}
          </React.Fragment>
        );
      })}
    </div>
  );
}

/* ---- Phone shell ---- */
function Phone({ children, onHome }) {
  return (
    <div style={{ width: 390, height: 800, background: '#000', borderRadius: 46, padding: 11, boxShadow: 'var(--shadow-xl)', flex: 'none' }}>
      <div style={{ width: '100%', height: '100%', background: 'var(--surface-page)', borderRadius: 36, overflow: 'hidden', position: 'relative', display: 'flex', flexDirection: 'column' }}>
        {/* status bar */}
        <div style={{ height: 44, flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 26px', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 14, color: 'var(--text-heading)', zIndex: 5 }}>
          <span style={{ fontFamily: 'var(--font-mono)' }}>9:41</span>
          <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', top: 9, width: 110, height: 26, background: '#000', borderRadius: 14 }}></span>
          <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}>
            <span style={{ width: 16, height: 11, display: 'inline-flex' }}><Ic n="signal" /></span>
            <span style={{ width: 18, height: 11, display: 'inline-flex' }}><Ic n="battery-full" /></span>
          </span>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---- sample data ---- */
const CATS = ['Todo', 'Aguas frescas', 'Quesadillas', 'Hamburguesas', 'Papas', 'Snacks', 'Postres', 'Combos'];
const MENU = [
  { id: 1, name: 'Quesadilla de tinga', cat: 'Quesadillas', price: 38, prep: 12, icon: 'utensils-crossed', popular: true, desc: 'Tortilla de maíz hecha al momento, tinga de pollo, queso oaxaca derretido y crema.' },
  { id: 2, name: 'Combo estudiante', cat: 'Combos', price: 50, prep: 13, icon: 'package', popular: true, desc: 'Quesadilla a elegir + agua fresca natural del día. El antojo completo del recreo.' },
  { id: 3, name: 'Hamburguesa de la casa', cat: 'Hamburguesas', price: 65, prep: 15, icon: 'beef', popular: true, desc: 'Doble carne, queso amarillo, tocino y aderezo especial de la cooperativa.' },
  { id: 4, name: 'Papas con queso', cat: 'Papas', price: 32, prep: 8, icon: 'utensils', desc: 'Papas a la francesa bañadas en queso amarillo fundido.' },
  { id: 5, name: 'Agua de jamaica', cat: 'Aguas frescas', price: 18, prep: 0, icon: 'cup-soda', ready: 4, desc: 'Agua fresca de flor de jamaica, natural y bien fría.' },
  { id: 6, name: 'Boneless BBQ', cat: 'Snacks', price: 58, prep: 14, icon: 'drumstick', desc: 'Trozos de pollo empanizado bañados en salsa BBQ, con aderezo ranch.' },
  { id: 7, name: 'Papas a la francesa', cat: 'Papas', price: 28, prep: 7, icon: 'utensils', desc: 'Clásicas, doraditas y crujientes, con sal al gusto.' },
  { id: 8, name: 'Esquites en vaso', cat: 'Snacks', price: 22, prep: 6, icon: 'soup', desc: 'Granos de elote tierno, mayonesa, queso, limón y chile.' },
  { id: 9, name: 'Gelatina de mosaico', cat: 'Postres', price: 15, prep: 0, icon: 'cake-slice', ready: 9, desc: 'Gelatina de leche con cubos de colores. Postre fresquito.' },
  { id: 10, name: 'Agua de horchata', cat: 'Aguas frescas', price: 18, prep: 0, icon: 'cup-soda', desc: 'Horchata de arroz con canela, dulce y cremosa.' },
];

Object.assign(window, { React, useState, useEffect, useRef, useIcons, Ic, Button, Badge, Chip, Media, QtyStepper, OrderTracker, Phone, CATS, MENU });
