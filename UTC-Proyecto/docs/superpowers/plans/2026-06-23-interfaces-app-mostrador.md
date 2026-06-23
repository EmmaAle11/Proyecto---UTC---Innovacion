# Plan — Interfaces de la app-mostrador (UI-first, datos después)

> **Decisión del usuario (2026-06-23):** avanzamos por las **interfaces primero** (mock data), y la base de datos **cuando sea su turno**. Este plan construye las pantallas de la **Propuesta B "Mostrador"** (D-001) en React Native, fieles al kit `design-system/ui_kits/app-mostrador/`, con datos simulados y estado local. **Sin** wiring al backend, **sin** pasarelas reales (D-006).

## Contexto (estado real verificado)
- **Navegación ya existe:** `RootNavigator` con guard de sesión → `Main` = `MainTabs` (Inicio · Pedidos · Perfil, íconos lucide, activo `#E34100`). Login cliente/admin **ya hechos y armonizados** (D-018) — el `Login`/`LoginB` del kit (Outlook, `@utc.edu.ec`) queda **superseded**, no se usa.
- **Pantallas internas = stubs:** `HomeScreen`, `OrdersScreen`, `ProfileScreen` son 9–10 líneas de texto centrado.
- **Tokens:** `shared/theme/tokens.ts` ya tiene rampas de marca (naranja/azul/gris/lima/mango/rojo), `radius`, `space`, `fonts`. **Faltan** tokens semánticos del kit (text/border/surface, estados cooking/ready/reoffer, sombras).
- **Primitivas existentes:** `BrandField`, `PrimaryButton`, `LogoSymbol`, `LogoLockup`. **Faltan** las del kit: `Badge`, `Chip`, `Media`, `QtyStepper`, `OrderTracker`.
- **Referencia fiel:** `design-system/ui_kits/app-mostrador/ui.jsx` (primitivas + sample `MENU`/`CATS`) y `screens.jsx` + `screensB.jsx` (Home, Producto, Carrito, Seguimiento, Pedidos, Perfil).

## Alcance
- **Incluye:** las 6 pantallas del cliente (Inicio, Producto, Carrito/Checkout, Seguimiento, Pedidos, Perfil) + primitivas + tokens semánticos + estado de carrito local (Zustand) + datos mock.
- **Fuera (turnos posteriores):** wiring a `UTC_PROJECT_DB` (repos/endpoints), pasarelas de pago reales (D-006), notificaciones push, y el **panel admin** (no tiene kit de diseño aún → plan aparte).

## Coherencia con la BD (para que el "turno de datos" sea un swap delgado)
Los **tipos mock del frontend** se modelan con los nombres/semántica del esquema (D de `architecture-propuesta.md` §5): `Product { id, name, category, price, basePrepTimeSeconds, status, isAvailable, readySinceMin?, imageIcon, popular?, description }` con `status` ∈ enum `product_status` (`por_preparar|preparado|sin_tiempo_espera|calentando|no_disponible`). Así, al llegar el turno de datos, solo se reemplaza la fuente mock por `GET /products` sin tocar las pantallas.

---

## Milestone 0 — Fundamentos (theme + primitivas + mock + carrito)
1. **Tokens semánticos** en `shared/theme/tokens.ts` (mapeados desde `design-system/styles.css`): `text` (heading/muted/subtle), `border` (subtle/default/strong), `surface` (page), y **estados** (`cooking`, `ready`, `reoffer` → bg/fg/dot) + sombras básicas. Sin romper lo existente.
2. **Primitivas** en `shared/ui/`: `Badge.tsx` (tonos neutral/primary/cooking/ready/reoffer/success), `Chip.tsx`, `Media.tsx` (bloque tintado con ícono lucide de fallback), `QtyStepper.tsx`, `OrderTracker.tsx` (4 pasos: Pagado·En preparación·Listo·Recogido). `PrimaryButton` se reutiliza; si hace falta `secondary/ghost`, se extiende con una prop `variant`.
3. **Entidades mock:** `entities/product/model/types.ts` + `entities/product/mock.ts` (porta `MENU`/`CATS`, adaptado a la semántica del esquema). `entities/order/model/types.ts` + `entities/order/mock.ts` (pedido activo + historial).
4. **Carrito (UI):** `features/cart/model/cart.store.ts` (Zustand): `items`, `add(product, qty)`, `setQty(id, qty)`, selectors `count`/`total`. Solo memoria.
- **Verificación:** `npx tsc --noEmit` 0 errores + bundle Metro OK.

## Milestone 1 — Inicio (Home, corazón del feed)
- `pages/home/HomeScreen.tsx` fiel a `HomeB`: header ("Recoges en · Cooperativa UTC" + `LogoSymbol` + barra de búsqueda no funcional), **rail "Listos para llevar ya"** (horizontal, badge `ready`, "Listo hace X min"), **chips de categoría**, **feed** (filas con `Media`, nombre, prep/listo, precio, botón `+`), y **barra flotante de carrito** cuando `count > 0`.
- Navega a **Producto** (al tocar item) y **Carrito** (barra flotante).
- **Verificación:** `tsc` + render en Expo Go (rail scrollea, chips filtran, `+` agrega y aparece la barra).

## Milestone 2 — Producto + Carrito (flujo de compra)
- `pages/product/ProductScreen.tsx` fiel a `Product`: hero `Media` + botón atrás, categoría, nombre, **badge de estado** (`cooking`/`ready`), badge "Recoger en tienda", descripción, `QtyStepper`, barra inferior "Agregar ×N · $total".
- `pages/cart/CartScreen.tsx` fiel a `Cart`: aviso de pickup (azul, "ventana 10–20 min"), lista de ítems con `QtyStepper`, **selector de método de pago** (Mercado Pago/PayPal/TDC/TDD/efectivo) **solo visual** (D-006), total + "Pagar y enviar a cocina".
- **Navegación:** convertir `Main` en un **stack** (`MainStack`) que envuelve `MainTabs` + `Product` + `Cart` + `Tracking` como pantallas empujadas; actualizar `app/navigation/types.ts` (params: `Product: { productId }`).
- **Verificación:** `tsc` + flujo en Expo Go (item → detalle → agregar → carrito → total correcto).

## Milestone 3 — Seguimiento + Pedidos + Perfil (cierre del recorrido)
- `pages/tracking/TrackingScreen.tsx` fiel a `Tracking`: hero de estado (cocinando→listo), **tarjeta de código de recogida** (azul, p. ej. `A-204`), `OrderTracker`, aviso "recoge en 10–20 min / si no, reoferta Preparados" (BR-005/D-005), botón inferior.
- `pages/orders/OrdersScreen.tsx` fiel a `PedidosB`: "Tus pedidos", tarjeta de pedido activo con `OrderTracker` (o estado vacío) + "Historial".
- `pages/profile/ProfileScreen.tsx` fiel a `PerfilB`: tarjeta de perfil (iniciales, nombre, **correo `@utc.edu.mx`** — no `@utc.edu.ec`), filas (Métodos de pago, Notificaciones, **Cuenta y seguridad** sin "Outlook", Ayuda). Botón de **cerrar sesión** (limpia `session.store`, vuelve a Welcome).
- **Verificación:** `tsc` + render de las 3 pestañas + cerrar sesión funcional.

---

## Fidelidad y adaptaciones (no inventar, sí corregir)
- **Marca/colores:** del kit, vía tokens ya portados (naranja CTA, azul institucional, lima "listo").
- **Correo institucional:** `@utc.edu.ec` (plantilla del kit) → **`@utc.edu.mx`** (D-011).
- **Sin Microsoft/Outlook:** quitar "Continuar con Outlook", "Continuar como invitado" y "Sesión con Outlook" (auth local, D-014).
- **Pagos:** selector visual; sin pasarela real (D-006).
- **Iconografía:** `lucide-react-native` (ya en uso); el `Media` usa el ícono del producto como fallback (no hay fotos aún).
- **Fuentes:** el kit usa display/body/mono. Si no están cargadas con `expo-font`, RN cae a la del sistema (no bloquea); cargar las fuentes reales es una sub-tarea opcional del Milestone 0.

## Verificación global (rules §0 — evidencia)
Por milestone: `npx tsc --noEmit` (0 errores) + bundle Metro + render en Expo Go (`npx expo start -c` desde `frontend/`). Antes de escribir código, revisar las APIs de **Expo SDK 56** (FlatList/ScrollView, `expo-font`, `expo-linear-gradient`) según `frontend/AGENTS.md`. Solo librerías compatibles con Expo Go (D-012).

## Fuera de alcance (turnos siguientes)
- **Turno de datos:** repos/servicios/endpoints TypeORM sobre `UTC_PROJECT_DB` + reemplazar mocks por llamadas reales (guard JWT ya existe).
- **Panel admin** (otra "interfaz"): requiere diseño propio (no hay kit) → plan aparte.
- Pagos reales, push, búsqueda funcional.

## Git (rules §23)
No comiteo. Tras verificar cada milestone, dejo `git add` + mensaje propuestos; tú haces commit/push.
