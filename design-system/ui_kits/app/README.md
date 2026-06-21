# UI Kit · App móvil — UTC Pick Sazón

Recreación interactiva de alta fidelidad del app de pedidos *Pick Up*. Abre `index.html` y recorre el flujo completo.

## Recorrido
1. **Login** — pantalla institucional azul, entrar con cuenta UTC o como invitado.
2. **Home / Menú** — buscador, chips de categoría, rejilla de productos con tiempo de espera, badges (Popular / Listo) y botón +. Barra de carrito flotante al agregar.
3. **Producto** — detalle con imagen, estado, descripción y selector de cantidad.
4. **Carrito / Checkout** — aviso de recogida, items editables, método de pago (Mercado Pago / PayPal), total y “Pagar y enviar a cocina”.
5. **Seguimiento** — código de recogida, `OrderTracker` del ciclo del pedido y recordatorio de la ventana 10–20 min. El estado avanza de *En preparación* a *Listo* en unos segundos (demo).

## Archivos
- `index.html` — monta React + Babel + Lucide, enlaza `../../styles.css`, carga `ui.jsx` y `screens.jsx`, y maneja navegación + estado del carrito.
- `ui.jsx` — primitivas cosméticas (Button, Badge, Chip, QtyStepper, OrderTracker, Media), el `Phone` shell, el helper de íconos y los datos de menú de muestra.
- `screens.jsx` — las cinco pantallas.

## Notas
- Es una recreación visual: los pagos y el backend son simulados.
- Las primitivas replican la API del sistema de diseño; en código de producción usa los componentes reales de `components/` a través del *bundle*.
