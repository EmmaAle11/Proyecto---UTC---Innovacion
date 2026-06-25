# Turno de datos — Paso 3: Orders (cliente: crear + ver propios) · Implementation Plan

> Tercer slice del "turno de datos": el cliente **crea pedidos** (`POST /orders`) y **ve los suyos** (`GET /orders`, BR-014) contra `UTC_PROJECT_DB`. Continúa Paso 1 (catálogo lectura) y Paso 2 (escritura admin). El **panel admin de pedidos** (cola, transiciones, semáforo desde BD) es el **Paso 4**. Cierra con verificación real (§0/§18) + gate de confianza 95–100% con agente de regresión (§22). Git lo ejecuta el usuario (§23).

**Goal:** Que el checkout del carrito registre un pedido real (orden + líneas con **snapshot de precio** + pago) y que Pedidos/Seguimiento del cliente lean sus pedidos desde la BD. El admin sigue con su mock hasta el Paso 4 (un mismo equipo = una sola sesión/rol, no chocan).

**Architecture:** Clean (backend) — `CreateOrderDto` (application) → `OrdersService.create/findMine` (repos TypeORM en **transacción**: resuelve `user_profile` por `keycloak_id`=JWT.sub, snapshotea precios de `products`, calcula totales, crea `orders`+`order_items`+`payments`) → `OrdersController` (`@Post`/`@Get`, autenticado; propiedad por JWT, BR-014). FSD (frontend) — `entities/order/api` (create/fetchMine + mapper a `Order`) → `features/{cart,orders}` (checkout async + `loadMine`) → pantallas `cart`/`orders`/`tracking`.

**Tech Stack:** NestJS 11 · TypeORM (`DataSource`/`QueryRunner` para la transacción) · class-validator · React Native/Expo · Zustand. Sin libs nuevas (D-012).

## Estado verificado (punto de partida, §0)
- Entidades listas: `OrderEntity` (FK `user` → user_profile ON DELETE RESTRICT; `status` default `pending`; `totalAmount`/timestamps; 1:1 `payment`), `OrderItemEntity` (`quantity>0`, `unitPrice>0` snapshot, `subtotal>=0`, `prepTimeSeconds`), `PaymentEntity`, `UserProfileEntity` (`keycloakId` UNIQUE). Sólo existe el módulo `products` (Pasos 1–2) + `auth`/`health`.
- `register` ya inserta el `user_profile` (keycloak_id=sub). Pero un cliente podría no tenerlo (cuentas previas) → la creación de pedido debe **asegurar el perfil** desde el JWT.
- Frontend: `useOrdersStore` es **compartido** cliente↔admin (D-021), `Order = AdminOrder` (shape de display: `id, code, customer, email, status, total, items:{name,qty}[], createdLabel, waitingMin, payMethod, payStatus`). `placeOrder` es **mock síncrono** (genera `CLI-N`/`A-2XX`). `CartScreen.onPay` arma `{name,qty}` y `navigation.replace('Tracking')`. Pagos **diferidos** (D-006): el selector es visual.
- `JwtUser` expone `sub`/`email`/`roles`; el guard JWT global ya protege.

## Global Constraints
- **§0/§1:** cerrar con `build`/`lint`/`test`/`tsc` + `curl` reales: crear pedido (201, totales server-side), ver propios (sólo los míos), aislamiento (un cliente **no** ve pedidos de otro → BR-014), sin token→401, ítems inválidos→400.
- **§5/§7/BR-015:** el backend **no confía en precios/total del cliente** — snapshotea de `products` y recalcula. Valida `quantity>0`, producto existe y `isAvailable`. El cliente sólo manda `productId`+`quantity`+`payMethod`.
- **BR-005:** timestamps = hora del servidor. **BR-009:** `efectivo` sin pasarela (`payStatus=pending`); resto `paid` (mock, D-006). **BR-014:** propiedad por JWT.
- **Transacción:** orden+líneas+pago atómicos (rollback si algo falla).
- **FSD/Clean:** `shared` no importa `features`; token por parámetro desde pantallas. `application` sin detalles de presentación.
- **§22:** agente de regresión sobre el diff. **§23:** staged + propuesta.

---

### Task 1: Backend — `CreateOrderDto` (application)
**Files:** Create `backend/src/application/orders/dto/create-order.dto.ts`

- [ ] **Step 1:** `CreateOrderItemDto` { `productId` `@IsUUID`, `quantity` `@IsInt @Min(1)` }. `CreateOrderDto` { `items` `@IsArray @ArrayNotEmpty @ValidateNested({each}) @Type(()=>CreateOrderItemDto)`, `payMethod` `@IsEnum(PaymentMethod)` }. (Sin `price`/`total`: los pone el backend.)

### Task 2: Backend — `OrdersService` (create en transacción + findMine)
**Files:** Create `backend/src/application/orders/orders.service.ts` + `dto/order-response.ts` (interface + mapper)

- [ ] **Step 1 (`ensureProfile`):** dado el `JwtUser`, busca `user_profile` por `keycloakId=sub`; si falta, lo crea (sub, email, nombre del token o derivado del email). Devuelve el perfil.
- [ ] **Step 2 (`create`):** `QueryRunner` transacción — carga los `products` de los `items` (`In(ids)`); si alguno no existe o `!isAvailable` → `BadRequestException`. Por línea: `unitPrice = product.price` (snapshot), `subtotal = qty*unitPrice`, `prepTimeSeconds = base_prep`. Crea `OrderEntity` (status `pending`, `totalAmount=Σsubtotal`), `OrderItemEntity[]`, y `PaymentEntity` (`method=payMethod`, `amount=total`, `status= efectivo?pending:paid`). Commit. Devuelve la orden con relaciones.
- [ ] **Step 3 (`findMine`):** `orders` del perfil del JWT, con `items.product` + `payment`, `order by created_at desc`.
- [ ] **Step 4 (mapper `toOrderResponse`):** `{ id, status, total:number, createdAt, customer:(user.firstName+lastName), email:user.email, items:[{productId, name:product.name, quantity, unitPrice:number, subtotal:number}], payment:{method,status}, readyAt }`. (numeric `string→number`.)

### Task 3: Backend — `OrdersController` + `OrdersModule`
**Files:** Create `backend/src/presentation/orders/orders.controller.ts` + `orders.module.ts`; Modify `app.module.ts`

- [ ] **Step 1:** `@Post() create(@Req() {user}, @Body() dto)` → 201 con la orden mapeada. `@Get() findMine(@Req() {user})` → mis pedidos. Ambos **autenticados** (guard global; sin `@Roles` → cliente y admin pueden, pero `findMine` filtra por el JWT). El `sub`/`email` salen del `request.user` (no del body, BR-015).
- [ ] **Step 2:** `OrdersModule` con `TypeOrmModule.forFeature([OrderEntity, OrderItemEntity, PaymentEntity, ProductEntity, UserProfileEntity])` + `DataSource`. Registrar en `app.module`.
- [ ] **Step 3 (verificación):** `build`+`tsc`+`lint`+`test` verdes.
- [ ] **Step 4 (curl §0):** crear pedido con token cliente → 201 (total = Σ del servidor, no el enviado); `GET /orders` → sólo los míos; segundo cliente no ve los del primero; sin token → 401; `quantity:0`/producto inexistente/`items:[]` → 400.

### Task 4: Frontend — `entities/order/api` + tipos
**Files:** Create `frontend/src/entities/order/api.ts`; Modify `entities/order/model/types.ts` (si hace falta exponer payment method/status)

- [ ] **Step 1:** `ApiOrder` (refleja `OrderResponse`); `OrderWritePayload` { items:[{productId,quantity}], payMethod }. `toOrder(ApiOrder): Order` — deriva `code` del id (p.ej. `#`+últimos 4), `createdLabel` (HH:MM desde `createdAt`), `waitingMin` (desde `createdAt`/`readyAt`), `payMethod`/`payStatus` del `payment`, `items` `{name,qty}`.
- [ ] **Step 2:** `createOrder(payload, token)` (`POST /orders`), `fetchMyOrders(token)` (`GET /orders`).

### Task 5: Frontend — `cart`/`orders` stores async
**Files:** Modify `features/orders/model/orders.store.ts`, `features/cart/model/cart.store.ts` (si aplica)

- [ ] **Step 1:** `placeOrder` pasa a **async**: recibe `{ items:[{productId,quantity}], payMethod }` + token → `createOrder` → prepende la `Order` devuelta + `setActiveOrder`. (Quita la generación de `CLI-N`/total local.)
- [ ] **Step 2:** `loadMine(token)` (estado `loading`/`loaded`) → `fetchMyOrders` → reemplaza `orders` (fallback a `ADMIN_ORDERS` mock sólo en error, demo). `setStatus`/selectores admin **intactos** (mock hasta Paso 4).

### Task 6: Frontend — pantallas cliente
**Files:** Modify `pages/cart/CartScreen.tsx`, `pages/orders/OrdersScreen.tsx`, `pages/tracking/TrackingScreen.tsx`

- [ ] **Step 1 (Cart):** `onPay` async — arma payload con `it.product.id`+`it.qty` (no nombres), `payMethod=pay`; `saving`; `await placeOrder(payload, token)`; éxito → `clear()` + `replace('Tracking')`; error → `Alert`.
- [ ] **Step 2 (Orders):** `useEffect loadMine(token)` + spinner; lista Activo/Historial desde el store (ya separa por `TERMINAL_STATUSES`).
- [ ] **Step 3 (Tracking):** lee el pedido activo del store (recién creado); opcional `loadMine` para refrescar. El estado queda `pending` (las transiciones del admin son Paso 4).
- [ ] **Step 4 (verificación):** `tsc` + `expo export` android OK.

### Task 7: Verificación integral + cierre (§0/§18/§22)
- [ ] Backend `build`/`lint`/`test`/`tsc`; frontend `tsc` + bundle.
- [ ] **Matriz curl** (Task 3 Step 4) + **aislamiento BR-014** (cliente A no ve pedidos de B) + total server-side (mandar total falso y verificar que se ignora) + tx (producto inexistente → 0 filas creadas).
- [ ] **Tests de regresión** (jest): `OrdersService` total/snapshot server-side + `findMine` filtra por perfil; e2e controller `POST` sin ítems → 400.
- [ ] **Agente de regresión** sobre el diff. Confianza ≥95%.
- [ ] DoD (§19): Observaciones · Riesgos · Validaciones · Pendientes · Supuestos · Confianza.

---

## Fuera de alcance / notas
- **Panel admin de pedidos (Paso 4):** `GET /orders` (todos, admin), `PATCH /orders/:id/status` (transiciones BR-004), semáforo (D-019) y KPIs desde BD → **cierra la sync cliente↔admin entre dispositivos (D-021)**. La cola/dashboard/detalle del admin siguen en mock hasta entonces.
- **Cancelar/extender (BR-004, §3.8/§3.10):** `PATCH /orders/:id` propio `pending→cancelled` (rules §5: el user cancela si no está en preparación) — **opcional** en este paso; si no entra, va al Paso 4.
- **Pagos reales (D-006):** sin pasarela; `payments` se crea con método+estado mock (efectivo=pending, resto=paid). Circuit breaker (BR-010) diferido.
- **`code`/turno:** el esquema no tiene `pickup_code`; se **deriva del id** para mostrar. Si se quiere turno secuencial real, es columna futura.
- **`waitingMin`/semáforo del cliente:** display derivado de timestamps; el semáforo "oficial" lo calcula el backend en el Paso 4.
