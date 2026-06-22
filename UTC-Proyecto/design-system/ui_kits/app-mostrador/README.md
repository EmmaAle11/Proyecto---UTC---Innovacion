# UI Kit · Propuesta B "Mostrador" — UTC Pick Sazón

Dirección **alterna** de la app, para comparar contra la Propuesta A (Mosaico). Misma marca y design system; distinta arquitectura de navegación y descubrimiento.

## Qué cambia frente a la Propuesta A
| | Propuesta A · Mosaico | Propuesta B · Mostrador |
|---|---|---|
| **Login** | Azul institucional | Naranja (más “antojo”) |
| **Navegación** | Plana, una pantalla | **Tab bar** inferior (Inicio · Pedidos · Perfil) |
| **Menú** | Rejilla de 2 columnas | **Feed** en columna + rail **“Listos para llevar ya”** |
| **Descubrimiento** | Categorías arriba | Rail de productos ya listos (refuerza la lógica de re-oferta/“Preparados”) |
| **Pedidos / Perfil** | — | Pestañas dedicadas con historial y cuenta |

Comparten pantallas de **Producto**, **Carrito/Checkout** (Outlook + Mercado Pago, PayPal, TDC, TDD, efectivo) y **Seguimiento**, reutilizando los mismos componentes.

## Archivos
- `index.html` — monta React + Babel + Lucide, incluye `ui.jsx` y `screens.jsx` propios (autocontenido), carga `screensB.jsx` y gestiona tabs + navegación.
- `screensB.jsx` — `TabBar`, `LoginB`, `HomeB` (rail + feed), `PedidosB`, `PerfilB`.

## Recorrido
Login (naranja) → **Inicio** (rail “listos ahora” + feed) → producto → agregar → barra de pedido → **Carrito** → pagar → **Seguimiento**. Pestañas **Pedidos** (pedido activo + historial) y **Perfil** (cuenta @utc, métodos de pago, seguridad).

> Recreación visual; pagos y backend simulados.
