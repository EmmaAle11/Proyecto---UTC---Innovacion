/* UTC Pick Sazón · Propuesta B "Mostrador" — dirección alterna.
   Naranja-forward, tab bar inferior, feed en columna + rail "Listos ahora".
   Reutiliza primitivas de ui.jsx y Product/Cart/Tracking de screens.jsx. */

/* ---- bottom tab bar ---- */
function TabBar({ tab, setTab }) {
  useIcons();
  const items = [
    { k: 'inicio', l: 'Inicio', i: 'house' },
    { k: 'pedidos', l: 'Pedidos', i: 'receipt' },
    { k: 'perfil', l: 'Perfil', i: 'user' },
  ];
  return (
    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 66, background: '#fff', borderTop: '1px solid var(--border-subtle)', display: 'flex', zIndex: 6 }}>
      {items.map(it => {
        const on = tab === it.k;
        return (
          <button key={it.k} onClick={() => setTab(it.k)} style={{ flex: 1, border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, color: on ? 'var(--naranja-500)' : 'var(--gris-400)' }}>
            <span style={{ width: 22, height: 22, display: 'inline-flex' }}><Ic n={it.i} /></span>
            <span style={{ fontSize: 11, fontWeight: on ? 700 : 600 }}>{it.l}</span>
          </button>
        );
      })}
    </div>
  );
}

/* ---- LOGIN B (orange) ---- */
function LoginB({ onLogin }) {
  useIcons();
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: 'linear-gradient(160deg, var(--naranja-500), var(--naranja-600))', color: '#fff', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: -70, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.10)' }}></div>
      <div style={{ position: 'absolute', bottom: 150, left: -70, width: 190, height: 190, borderRadius: '50%', background: 'rgba(2,22,66,0.12)' }}></div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 30px', zIndex: 2 }}>
        <span style={{ width: 64, height: 64, borderRadius: 18, background: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="38" height="38" viewBox="0 0 96 96"><path d="M48 22c-11.6 0-21 9.1-21 20.4 0 14.2 17.6 29.3 19.6 31a2.2 2.2 0 0 0 2.8 0c2-1.7 19.6-16.8 19.6-31C69 31.1 59.6 22 48 22Z" fill="var(--naranja-500)"/><circle cx="48" cy="42" r="8.4" fill="#fff"/></svg>
        </span>
        <h1 style={{ color: '#fff', fontSize: 42, lineHeight: 1.0, margin: '26px 0 14px' }}>Tu antojo,<br/>al mostrador.</h1>
        <p style={{ color: 'rgba(255,255,255,0.9)', fontSize: 16, lineHeight: 1.5, margin: 0, maxWidth: 300 }}>
          Pide desde tu lugar y recoge en la cooperativa cuando esté listo. Tú decides qué se te antoja.
        </p>
      </div>
      <div style={{ padding: '0 24px 38px', zIndex: 2, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Button variant="secondary" size="lg" fullWidth onClick={onLogin} leftIcon={<MsGlyph />} style={{ justifyContent: 'center', gap: 10 }}>Continuar con Outlook</Button>
        <Button variant="ghost" size="lg" fullWidth style={{ color: '#fff', border: '1px solid rgba(255,255,255,.35)' }} onClick={onLogin}>Continuar como invitado</Button>
        <p style={{ textAlign: 'center', fontSize: 12, color: 'rgba(255,255,255,0.85)', margin: '6px 0 0', lineHeight: 1.5 }}>Inicia con tu cuenta institucional <b>@utc.edu.ec</b><br/>Modalidad Pick Up · Recoge en tienda</p>
      </div>
    </div>
  );
}

/* ---- HOME B (feed + ready rail + tabs) ---- */
function HomeB({ cat, setCat, onOpen, cartCount, onCart }) {
  useIcons();
  const ready = MENU.filter(m => m.ready != null);
  const list = (cat === 'Todo' ? MENU : MENU.filter(m => m.cat === cat));
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* header */}
      <div style={{ padding: '2px 20px 10px', flex: 'none', background: '#fff', borderBottom: '1px solid var(--border-subtle)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Recoges en</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18, color: 'var(--azul-700)' }}>
              <span style={{ width: 16, height: 16, color: 'var(--naranja-500)', display: 'inline-flex' }}><Ic n="map-pin" /></span>Cooperativa UTC
            </div>
          </div>
          <LogoMark size={36} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, height: 46, padding: '0 14px', background: 'var(--gris-100)', borderRadius: 14 }}>
          <span style={{ width: 18, height: 18, color: 'var(--text-muted)', display: 'inline-flex' }}><Ic n="search" /></span>
          <span style={{ color: 'var(--text-muted)', fontSize: 15 }}>¿Qué se te antoja hoy?</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, paddingBottom: cartCount > 0 ? 150 : 86 }}>
        {/* ready-now rail */}
        <div style={{ padding: '16px 0 4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 20px 10px' }}>
            <span style={{ width: 18, height: 18, color: 'var(--lima-500)', display: 'inline-flex' }}><Ic n="zap" /></span>
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 16, color: 'var(--text-heading)' }}>Listos para llevar ya</span>
          </div>
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', padding: '0 20px 6px' }} className="noscroll">
            {ready.map(m => (
              <div key={m.id} onClick={() => onOpen(m)} style={{ width: 158, flex: 'none', background: '#fff', border: '1px solid var(--lima-100)', borderRadius: 16, padding: 9, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>
                <Media icon={m.icon} height={84}><span style={{ position: 'absolute', top: 7, left: 7 }}><Badge tone="ready" dot>Listo</Badge></span></Media>
                <div style={{ fontWeight: 700, fontSize: 13.5, color: 'var(--text-heading)', margin: '8px 0 3px', lineHeight: 1.2 }}>{m.name}</div>
                <div style={{ fontSize: 11, color: 'var(--lima-600)', fontWeight: 600, marginBottom: 7 }}>Listo hace {m.ready} min</div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 15, color: 'var(--text-heading)' }}>${m.price}</span>
                  <span style={{ width: 30, height: 30, borderRadius: 9, background: 'var(--color-primary)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 700 }}>+</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* categories */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '10px 20px 12px' }} className="noscroll">
          {CATS.map(c => <Chip key={c} selected={c === cat} onClick={() => setCat(c)}>{c}</Chip>)}
        </div>

        {/* feed list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '0 20px' }}>
          {list.map(m => (
            <div key={m.id} onClick={() => onOpen(m)} style={{ display: 'flex', gap: 13, alignItems: 'center', background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 11, boxShadow: 'var(--shadow-sm)', cursor: 'pointer' }}>
              <span style={{ width: 78, height: 78, borderRadius: 13, flex: 'none', background: 'linear-gradient(135deg, var(--azul-50), var(--naranja-50))', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ width: 30, height: 30, color: 'var(--azul-300)', display: 'inline-flex' }}><Ic n={m.icon} /></span>
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15.5, color: 'var(--text-heading)' }}>{m.name}</span>
                  {m.popular && <span style={{ color: 'var(--naranja-500)', fontSize: 12 }}>🔥</span>}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>
                  {m.ready != null ? <span style={{ color: 'var(--lima-600)', fontWeight: 600 }}>Listo hace {m.ready} min</span> : <span>⏱ {m.prep} min de espera</span>} · {m.cat}
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 17, color: 'var(--text-heading)' }}>${m.price}</span>
              </div>
              <span style={{ width: 38, height: 38, borderRadius: 12, flex: 'none', background: 'var(--color-primary)', color: '#fff', boxShadow: 'var(--shadow-primary)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 21, fontWeight: 700 }}>+</span>
            </div>
          ))}
        </div>
      </div>

      {cartCount > 0 && (
        <div style={{ position: 'absolute', left: 16, right: 16, bottom: 78, zIndex: 8 }}>
          <Button variant="primary" size="lg" fullWidth onClick={onCart} style={{ justifyContent: 'space-between', boxShadow: 'var(--shadow-lg), var(--shadow-primary)' }}
            leftIcon={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 18, height: 18, display: 'inline-flex' }}><Ic n="shopping-bag" /></span>{cartCount} en tu pedido</span>}
            rightIcon={<span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>Ver pedido <span style={{ width: 18, height: 18, display: 'inline-flex' }}><Ic n="arrow-right" /></span></span>}>
            <span></span>
          </Button>
        </div>
      )}
    </div>
  );
}

/* ---- PEDIDOS tab ---- */
function PedidosB({ hasActive, onTrack }) {
  useIcons();
  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '6px 20px 86px' }}>
      <h2 style={{ fontSize: 24, margin: '6px 0 16px' }}>Tus pedidos</h2>
      {hasActive ? (
        <div onClick={onTrack} style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 18, padding: 16, boxShadow: 'var(--shadow-sm)', cursor: 'pointer', marginBottom: 14 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 16, color: 'var(--azul-700)' }}>#A-204</span>
            <Badge tone="cooking" dot>En preparación</Badge>
          </div>
          <OrderTracker current={1} note="~12 min" />
          <div style={{ marginTop: 14, fontSize: 13, color: 'var(--naranja-600)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
            Ver seguimiento <span style={{ width: 15, height: 15, display: 'inline-flex' }}><Ic n="arrow-right" /></span>
          </div>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <span style={{ width: 44, height: 44, display: 'inline-flex', color: 'var(--gris-300)', marginBottom: 12 }}><Ic n="receipt" /></span>
          <p style={{ margin: 0, fontSize: 15 }}>Aún no tienes pedidos.<br/>Tu próximo antojo aparecerá aquí.</p>
        </div>
      )}
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: '.06em', textTransform: 'uppercase', color: 'var(--text-muted)', margin: '6px 0 10px' }}>Historial</div>
      {[{ n: '#A-198', d: 'Ayer · 13:20', t: 'Hamburguesa de la casa +1', p: 83 }, { n: '#A-187', d: 'Lun · 11:05', t: 'Agua de jamaica +2', p: 36 }].map(o => (
        <div key={o.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 4px', borderBottom: '1px solid var(--border-subtle)' }}>
          <span style={{ width: 40, height: 40, borderRadius: 11, background: 'var(--lima-50)', color: 'var(--lima-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span style={{ width: 18, height: 18, display: 'inline-flex' }}><Ic n="check" /></span></span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-heading)' }}>{o.t}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{o.n} · {o.d} · Recogido</div>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-heading)' }}>${o.p}</span>
        </div>
      ))}
    </div>
  );
}

/* ---- PERFIL tab ---- */
function PerfilB() {
  useIcons();
  const rows = [
    { i: 'wallet', l: 'Métodos de pago', s: 'Mercado Pago, PayPal, TDC/TDD, efectivo' },
    { i: 'bell', l: 'Notificaciones', s: 'Avisos de “listo para recoger”' },
    { i: 'shield-check', l: 'Cuenta y seguridad', s: 'Sesión con Outlook @utc.edu.ec' },
    { i: 'circle-help', l: 'Ayuda', s: 'Sobre la cooperativa y el Pick Up' },
  ];
  return (
    <div style={{ flex: 1, overflowY: 'auto', minHeight: 0, padding: '6px 20px 86px' }}>
      <h2 style={{ fontSize: 24, margin: '6px 0 16px' }}>Perfil</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 16, background: 'var(--azul-700)', borderRadius: 18, color: '#fff', marginBottom: 18 }}>
        <span style={{ width: 56, height: 56, borderRadius: '50%', flex: 'none', background: 'var(--naranja-500)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-body)', fontWeight: 700, fontSize: 22 }}>MR</span>
        <div>
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 18 }}>Mariana Reyes</div>
          <div style={{ fontSize: 13, color: 'var(--azul-200)' }}>mreyes@utc.edu.ec</div>
        </div>
      </div>
      <div style={{ background: '#fff', border: '1px solid var(--border-subtle)', borderRadius: 18, overflow: 'hidden' }}>
        {rows.map((r, i) => (
          <div key={r.l} style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '14px 16px', borderTop: i ? '1px solid var(--border-subtle)' : 'none', cursor: 'pointer' }}>
            <span style={{ width: 38, height: 38, borderRadius: 11, background: 'var(--naranja-50)', color: 'var(--naranja-600)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}><span style={{ width: 19, height: 19, display: 'inline-flex' }}><Ic n={r.i} /></span></span>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14.5, color: 'var(--text-heading)' }}>{r.l}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.s}</div>
            </div>
            <span style={{ width: 18, height: 18, color: 'var(--gris-400)', display: 'inline-flex' }}><Ic n="chevron-right" /></span>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { TabBar, LoginB, HomeB, PedidosB, PerfilB });
