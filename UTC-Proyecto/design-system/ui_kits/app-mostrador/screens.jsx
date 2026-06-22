/* UTC Pick Sazón · UI kit — app screens. Depends on window globals from ui.jsx. */

const LogoMark = ({ size = 34, bg = 'var(--naranja-500)', pin = '#fff' }) => (
  <span style={{ width: size, height: size, borderRadius: size * 0.28, background: bg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
    <svg width={size * 0.6} height={size * 0.6} viewBox="0 0 96 96"><path d="M48 22c-11.6 0-21 9.1-21 20.4 0 14.2 17.6 29.3 19.6 31a2.2 2.2 0 0 0 2.8 0c2-1.7 19.6-16.8 19.6-31C69 31.1 59.6 22 48 22Z" fill={pin}/><circle cx="48" cy="42" r="8.4" fill={bg}/></svg>
  </span>
);
const MsGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 23 23" style={{ flex: 'none' }}><rect x="1" y="1" width="10" height="10" fill="#F25022"/><rect x="12" y="1" width="10" height="10" fill="#7FBA00"/><rect x="1" y="12" width="10" height="10" fill="#00A4EF"/><rect x="12" y="12" width="10" height="10" fill="#FFB900"/></svg>
);
const Wordmark = ({ light }) => (
  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 22, letterSpacing: '-0.02em', color: light ? '#fff' : 'var(--azul-700)' }}>
    Pick <span style={{ color: light ? 'var(--naranja-400)' : 'var(--naranja-500)' }}>Sazón</span>
  </span>
);

/* ============ LOGIN ============ */
function Login({ onLogin }) {
  useIcons();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'var(--azul-700)', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -90, right: -70, width: 240, height: 240, borderRadius: '50%', background: 'rgba(227,65,0,0.22)' }}></div>
      <div style={{ position: 'absolute', bottom: 120, left: -80, width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}></div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 30px', zIndex: 2 }}>
        <LogoMark size={64} bg="var(--naranja-500)" />
        <h1 style={{ color: '#fff', fontSize: 40, lineHeight: 1.02, margin: '26px 0 14px' }}>Pide fácil,<br/>recoge con sabor.</h1>
        <p style={{ color: 'var(--azul-200)', fontSize: 16, lineHeight: 1.5, margin: 0, maxWidth: 300 }}>
          Tus antojos del recreo, listos cuando llegas a la cooperativa. Sin filas, sin esperas a ciegas.
        </p>
      </div>
      <div style={{ padding: '0 24px 38px', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Button variant="secondary" size="lg" fullWidth onClick={onLogin} leftIcon={<MsGlyph />} style={{ justifyContent: 'center', gap: 10 }}>Continuar con Outlook</Button>
        <Button variant="ghost" size="lg" fullWidth style={{ color: '#fff', border: '1px solid rgba(255,255,255,.25)' }} onClick={onLogin}>Continuar como invitado</Button>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--azul-300)', margin: '6px 0 0', lineHeight: 1.5 }}>Inicia con tu cuenta institucional <b style={{ color: 'var(--azul-100)' }}>@utc.edu.ec</b><br/>Modalidad Pick Up · Recoge en tienda</p>
      </div>
    </div>
  );
}

/* ============ HOME / MENU ============ */
function Home({ cat, setCat, onOpen, cartCount, onCart, onOrders }) {
  useIcons();
  const list = cat === 'Todo' ? MENU : MENU.filter(m => m.cat === cat);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* header */}
      <div style={{ padding: '4px 20px 12px', flex: 'none' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><LogoMark size={32} /><Wordmark /></div>
          <button onClick={onOrders} style={{ position: 'relative', width: 42, height: 42, borderRadius: '50%', border: '1px solid var(--border-subtle)', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ width: 20, height: 20, display: 'inline-flex', color: 'var(--azul-700)' }}><Ic n="receipt" /></span>
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 48, padding: '0 14px', background: '#fff', border: '1px solid var(--border-default)', borderRadius: 14 }}>
          <span style={{ width: 18, height: 18, color: 'var(--text-muted)', display: 'inline-flex' }}><Ic n="search" /></span>
          <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>¿Qué se te antoja hoy?</span>
        </div>
      </div>
      {/* categories */}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '2px 20px 14px', flex: 'none' }} className="noscroll">
        {CATS.map(c => <Chip key={c} selected={c === cat} onClick={() => setCat(c)}>{c}</Chip>)}
      </div>
      {/* grid */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 110px', minHeight: 0 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {list.map(m => (
            <div key={m.id} onClick={() => onOpen(m)} style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 10, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', display: 'flex', flexDirection: 'column' }}>
              <Media icon={m.icon} height={104}>
                {m.popular && <span style={{ position: 'absolute', top: 7, left: 7 }}><Badge tone="primary"><span style={{ marginRight: 2 }}>🔥</span>Popular</Badge></span>}
                {m.ready != null && <span style={{ position: 'absolute', top: 7, right: 7 }}><Badge tone="ready" dot>Listo</Badge></span>}
              </Media>
              <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 14.5, color: 'var(--text-heading)', lineHeight: 1.2, margin: '9px 0 5px' }}>{m.name}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginBottom: 9 }}>
                {m.ready != null ? <span style={{ color: 'var(--lima-600)', fontWeight: 600 }}>Listo hace {m.ready} min</span> : <span>⏱ {m.prep} min de espera</span>}
              </div>
              <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color: 'var(--text-heading)' }}>${m.price}</span>
                <span style={{ width: 34, height: 34, borderRadius: 11, background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 700 }}>+</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* cart bar */}
      {cartCount > 0 && (
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 18, zIndex: 8 }}>
          <Button variant="primary" size="lg" fullWidth onClick={onCart}
            style={{ justifyContent: 'space-between' }}
            leftIcon={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 18, height: 18, display: 'inline-flex' }}><Ic n="shopping-bag" /></span>{cartCount} en tu pedido</span>}
            rightIcon={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Ver pedido <span style={{ width: 18, height: 18, display: 'inline-flex' }}><Ic n="arrow-right" /></span></span>}>
            <span></span>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ============ PRODUCT DETAIL ============ */
function Product({ item, onBack, onAdd }) {
  const [qty, setQty] = useState(1);
  useIcons();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0, background: '#fff' }}>
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: 110 }}>
        <div style={{ position: 'relative', height: 280, background: 'linear-gradient(135deg, var(--azul-50), var(--naranja-50))', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ width: 96, height: 96, color: 'var(--azul-300)', display: 'inline-flex' }}><Ic n={item.icon} /></span>
          <button onClick={onBack} style={{ position: 'absolute', top: 12, left: 16, width: 42, height: 42, borderRadius: '50%', border: 'none', background: 'rgba(255,255,255,.92)', boxShadow: 'var(--shadow-sm)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <span style={{ width: 20, height: 20, color: 'var(--azul-700)', display: 'inline-flex' }}><Ic n="arrow-left" /></span>
          </button>
          {item.popular && <span style={{ position: 'absolute', bottom: 14, left: 20 }}><Badge tone="primary"><span style={{ marginRight: 2 }}>🔥</span>Popular esta semana</Badge></span>}
        </div>
        <div style={{ padding: '20px 22px 0' }}>
          <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--naranja-600)', marginBottom: 6 }}>{item.cat}</div>
          <h2 style={{ fontSize: 27, margin: '0 0 10px' }}>{item.name}</h2>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {item.ready != null
              ? <Badge tone="ready" dot>Listo hace {item.ready} min</Badge>
              : <Badge tone="cooking" dot>Se prepara en ~{item.prep} min</Badge>}
            <Badge tone="neutral" icon={<span style={{ width: 13, height: 13, marginRight: 2, display: 'inline-flex' }}><Ic n="map-pin" /></span>}>Recoger en tienda</Badge>
          </div>
          <p style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--gris-700)', margin: '0 0 22px' }}>{item.desc}</p>
          <div style={{ height: 1, background: 'var(--border-subtle)', margin: '0 0 18px' }}></div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-heading)' }}>Cantidad</span>
            <QtyStepper value={qty} min={1} max={10} onChange={setQty} />
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 20px 26px', background: '#fff', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: 14, alignItems: 'center' }}>
        <Button variant="primary" size="lg" fullWidth onClick={() => onAdd(item, qty)} style={{ justifyContent: 'space-between' }}>
          <span>Agregar {qty > 1 ? `×${qty}` : ''}</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>${item.price * qty}</span>
        </Button>
      </div>
    </div>
  );
}

/* ============ CART / CHECKOUT ============ */
function Cart({ cart, setQty, onBack, onPay }) {
  const [pay, setPay] = useState('mercadopago');
  useIcons();
  const total = cart.reduce((s, c) => s + c.price * c.qty, 0);
  const maxPrep = cart.reduce((m, c) => Math.max(m, c.prep || 0), 0);
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 20px 12px', flex: 'none' }}>
        <button onClick={onBack} style={{ width: 40, height: 40, borderRadius: '50%', border: '1px solid var(--border-subtle)', background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <span style={{ width: 20, height: 20, color: 'var(--azul-700)', display: 'inline-flex' }}><Ic n="arrow-left" /></span>
        </button>
        <h2 style={{ fontSize: 22, margin: 0 }}>Tu pedido</h2>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px 200px', minHeight: 0 }}>
        {/* pickup notice */}
        <div style={{ display: 'flex', gap: 12, padding: 14, background: 'var(--azul-50)', borderRadius: 16, marginBottom: 18 }}>
          <span style={{ width: 22, height: 22, color: 'var(--azul-700)', display: 'inline-flex', flex: 'none', marginTop: 1 }}><Ic n="map-pin" /></span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)' }}>Recoges en Cooperativa UTC</div>
            <div style={{ fontSize: 12.5, color: 'var(--gris-600)', marginTop: 2 }}>Listo en ~{maxPrep} min · ventana de recogida 10–20 min</div>
          </div>
        </div>
        {/* items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {cart.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: 12, alignItems: 'center', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 16, padding: 10 }}>
              <span style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg, var(--azul-50), var(--naranja-50))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                <span style={{ width: 24, height: 24, color: 'var(--azul-300)', display: 'inline-flex' }}><Ic n={c.icon} /></span>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-heading)' }}>{c.name}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14, color: 'var(--naranja-600)', marginTop: 2 }}>${c.price}</div>
              </div>
              <QtyStepper value={c.qty} min={0} max={10} size="sm" onChange={(v) => setQty(c.id, v)} />
            </div>
          ))}
        </div>
        {/* payment */}
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-heading)', margin: '22px 0 10px' }}>Método de pago</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { k: 'mercadopago', l: 'Mercado Pago', s: 'Saldo o tarjeta guardada', i: 'wallet' },
            { k: 'paypal', l: 'PayPal', s: 'Tu cuenta PayPal', i: 'circle-dollar-sign' },
            { k: 'tdc', l: 'Tarjeta de crédito (TDC)', s: 'Visa · Mastercard · Amex', i: 'credit-card' },
            { k: 'tdd', l: 'Tarjeta de débito (TDD)', s: 'Débito de tu banco', i: 'landmark' },
            { k: 'efectivo', l: 'Efectivo al recoger', s: 'Paga en el mostrador de la cooperativa', i: 'banknote' },
          ].map(p => (
            <button key={p.k} onClick={() => setPay(p.k)} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 14, cursor: 'pointer', background: '#fff', textAlign: 'left',
              border: pay === p.k ? '2px solid var(--naranja-500)' : '1px solid var(--border-default)' }}>
              <span style={{ width: 38, height: 38, borderRadius: 10, flex: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: pay === p.k ? 'var(--naranja-50)' : 'var(--gris-100)' }}>
                <span style={{ width: 19, height: 19, color: pay === p.k ? 'var(--naranja-600)' : 'var(--azul-700)', display: 'inline-flex' }}><Ic n={p.i} /></span>
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span style={{ display: 'block', fontWeight: 700, fontSize: 14.5, color: 'var(--text-heading)' }}>{p.l}</span>
                <span style={{ display: 'block', fontSize: 11.5, color: 'var(--text-muted)', marginTop: 1 }}>{p.s}</span>
              </span>
              <span style={{ width: 20, height: 20, borderRadius: '50%', flex: 'none', border: pay === p.k ? '6px solid var(--naranja-500)' : '2px solid var(--border-strong)' }}></span>
            </button>
          ))}
        </div>
      </div>
      {/* pay bar */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 20px 26px', background: '#fff', borderTop: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 14, color: 'var(--text-muted)' }}>Total</span>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 22, color: 'var(--text-heading)' }}>${total}</span>
        </div>
        <Button variant="primary" size="lg" fullWidth onClick={onPay} rightIcon={<Ic n="arrow-right" />}>{pay === 'efectivo' ? 'Confirmar y enviar a cocina' : 'Pagar y enviar a cocina'}</Button>
      </div>
    </div>
  );
}

/* ============ ORDER TRACKING ============ */
function Tracking({ total, onHome }) {
  const [step, setStep] = useState(1);
  useIcons();
  useEffect(() => {
    const t1 = setTimeout(() => setStep(2), 3200);
    return () => clearTimeout(t1);
  }, []);
  const ready = step >= 2;
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 22px 30px', minHeight: 0 }}>
        <div style={{ textAlign: 'center', padding: '14px 0 22px' }}>
          <div style={{ width: 76, height: 76, borderRadius: '50%', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: ready ? 'var(--lima-50)' : 'var(--state-cooking-bg)' }}>
            <span style={{ width: 38, height: 38, display: 'inline-flex', color: ready ? 'var(--lima-500)' : 'var(--mango-600)' }}><Ic n={ready ? 'check-circle-2' : 'chef-hat'} /></span>
          </div>
          <h2 style={{ fontSize: 24, margin: '0 0 6px' }}>{ready ? '¡Tu pedido está listo!' : 'Estamos preparando tu pedido'}</h2>
          <p style={{ fontSize: 14.5, color: 'var(--gris-600)', margin: 0 }}>{ready ? 'Pásale a recogerlo a la cooperativa.' : 'Te avisamos en cuanto esté en el mostrador.'}</p>
        </div>

        {/* pickup code */}
        <div style={{ background: 'var(--azul-700)', borderRadius: 20, padding: '20px 22px', color: '#fff', marginBottom: 18, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -30, width: 130, height: 130, borderRadius: '50%', background: 'rgba(227,65,0,0.25)' }}></div>
          <div style={{ fontSize: 12, color: 'var(--azul-200)', fontWeight: 600, letterSpacing: '.04em', marginBottom: 6, position: 'relative' }}>CÓDIGO DE RECOGIDA</div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 40, letterSpacing: '.06em', position: 'relative' }}>A-204</div>
          <div style={{ fontSize: 12.5, color: 'var(--azul-200)', marginTop: 4, position: 'relative' }}>Muéstralo en el mostrador de la cooperativa</div>
        </div>

        {/* tracker */}
        <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: '22px 14px', marginBottom: 16, boxShadow: 'var(--shadow-sm)' }}>
          <OrderTracker current={step} note={ready ? 'Listo hace 0 min' : '~12 min'} />
        </div>

        {ready && (
          <div style={{ display: 'flex', gap: 12, padding: 14, background: 'var(--state-ready-bg)', borderRadius: 16, marginBottom: 8 }}>
            <span style={{ width: 22, height: 22, color: 'var(--lima-600)', display: 'inline-flex', flex: 'none' }}><Ic n="timer" /></span>
            <div style={{ fontSize: 13, color: 'var(--lima-600)', lineHeight: 1.45 }}>
              <b>Recoge en 10–20 min</b> para que llegue calientito. Pasado ese tiempo podría volver a ofertarse con la etiqueta “Preparados”.
            </div>
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '14px 20px 26px', background: '#fff', borderTop: '1px solid var(--border-subtle)' }}>
        <Button variant={ready ? 'primary' : 'secondary'} size="lg" fullWidth onClick={onHome}>{ready ? 'Volver al menú' : 'Seguir explorando el menú'}</Button>
      </div>
    </div>
  );
}

Object.assign(window, { Login, Home, Product, Cart, Tracking, LogoMark, Wordmark });
