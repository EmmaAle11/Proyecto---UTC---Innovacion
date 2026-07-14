# Plan 07 — Reservar en `place()` (bug 3): confirmar SOLO comida que existe

> **Ejecuta** `specs/2026-07-14-producto-terminado-design.md` §3 y §5 (las 6 piezas).
> **Cierra el bug 3** ("se acepta el pedido antes de reservar"). **NO** toca `finished_goods` (bugs 1 y 2 →
> Plan 08). **Sin migración de esquema:** la columna `products.stock` ya existe; esto es lógica pura.
> Git lo ejecuta el usuario (§23). Rama: `feat/roles-e-insumos`.

**Goal:** que un pedido **reserve el inventario en el momento de pedirse** (no al aceptarse), que **rechace**
si no alcanza en vez de saturar en 0 en silencio, y que **la reserva se cobre solo después de existir** —
reservar → cobrar → (si el cobro truena) liberar. Baseline: `main` 767e226, **117 verdes, tsc 0**.

**Dos decisiones del usuario, ya tomadas (2026-07-14), que este plan implementa:**
1. **Programados retienen desde ya:** se reserva en la creación para TODO pedido, sin caso especial para `scheduledFor`.
2. **Reservar antes de cobrar, bien hecho:** como el pago vive tras puerto/adapter, se implementa la **saga
   con compensación** hoy; conectar la pasarela real no cambia esta lógica.

---

## Estado verificado (§0 — probado leyendo el código, no supuesto)

| Hecho | Evidencia |
|---|---|
| `place()` **no toca stock**; devuelve el plan en PENDING | `Order.ts:165-198` |
| `ProductSnapshot` **no tiene `stock`** → `place()` es ciego al inventario | `Order.ts:93-101` |
| La reserva real vive en el ADMIN al aceptar: `PREPARING → 'reserve'` | `Order.ts:271-273` |
| El SQL de reserva es **`GREATEST(0, stock − qty)` INCONDICIONAL**: satura en 0, **nunca falla**, nadie lee `affected` | `order.repository.ts:528-544` |
| La creación **nunca llama `applyStock`**: la tx solo guarda order+items+payment | `order.repository.ts:143-179` |
| El pago con tarjeta se autoriza **ANTES** de la tx y **antes de cualquier reserva** | `order.repository.ts:137-140` |
| `cancelByOwner` libera **solo si** `wasPrepared` (READY/READY_LATER); desde PENDING → `'none'` | `Order.ts:289-303` |
| El `default` de `applyAdminTransition` (incluye CANCELLED) → `'none'` | `Order.ts:283-284` |
| `stock` es `int`, con `@Check("stock" >= 0)` y `@VersionColumn` (optimistic lock) | `product.entity.ts:46-47, 19, 93-94` |

### La consecuencia en una frase
Hoy el stock se aparta **al aceptar** (`pending→preparing`), pero el pedido se **confirma al pedirse**. Dos
clientes confirman la última hamburguesa; el segundo revienta en la cocina. Con pagos simulados **no se
pierde dinero todavía** (D-006) — es un bug **estructural** que muerde el día que el cobro sea real.

---

## Global Constraints

- **§0 / §22:** se cierra con `tsc` 0 + los 117 tests verdes + tests nuevos de fuga/doble-reserva + workflow
  de caza P0-P5 + agente de regresión. Confianza 95–100% o **BLOQUEADO**.
- **BR-011:** el stock **nunca** es negativo (ya hay `@Check`); la reserva condicional lo respeta a nivel de fila.
- **§9 / BR-009:** **no crear pedido "pagado" si el pago falló.** El pedido nace PENDING; solo se marca PAID si
  la autorización tuvo éxito; si falla → se cancela y se libera la reserva.
- **C4 (comentario vigente):** **no** mantener locks/conexión de BD durante el I/O de red del pago. La saga
  respeta esto: red **fuera** de toda tx.
- **§23:** el usuario ejecuta el commit.

---

## El flujo nuevo (saga reservar → cobrar → confirmar/compensar)

```txt
ANTES:  place()(sin stock) → authorize(RED) → Tx[ guarda order+items+payment ]
                              ^^^^^^^^^^^^^^ cobra antes de reservar; y nunca reserva en creación

AHORA:  place()(valida stock)                              ← pre-check amable, nombra el producto
        Tx1[ RESERVA condicional (WHERE stock>=qty)        ← guardia real, atómico
             + guarda order(PENDING) + items + payment(PENDING) ]   ← el pedido YA es dueño de la reserva
        (efectivo) → listo: payment queda PENDING, se cobra en mostrador
        (tarjeta)  → authorize(RED, fuera de tx)
                       éxito → Tx2[ payment.status = PAID ]
                       fallo → Tx3[ order → CANCELLED · release stock ]  → 400/409
```

**Por qué persistir el pedido ANTES de autorizar:** así la reserva **siempre tiene dueño** (la fila `orders`).
Si el proceso muere entre reservar y cobrar, el pedido queda PENDING visible (recuperable), **no** un stock
fantasma sin dueño. Tradeoff aceptado: un pago de tarjeta rechazado deja una fila `cancelled` en el historial
(cosmético, honesto).

---

### Task 1: Dominio — `Order` deja de reservar al aceptar y libera bien al cancelar
**Files:** Modify `modules/orders/domain/entities/Order.ts`

- [ ] **Step 1 — `ProductSnapshot` gana `stock: number`** (`Order.ts:93-101`). El adapter ya lo lee de la fila.
- [ ] **Step 2 — `place()` valida disponibilidad de cantidad** (`Order.ts:173-179`): tras `isAvailable`,
      `if (it.quantity > product.stock) throw new DomainError('Solo quedan N de <producto>')`. **Pre-check
      amable** que nombra el producto; el guardia atómico es el SQL de la Task 2 (la lectura del snapshot es
      fuera de la tx → puede quedar rancia; por eso el SQL condicional es el que manda). Comentario que explique
      el porqué de los dos guardias.
- [ ] **Step 3 — `applyAdminTransition` (`Order.ts:270-285`):** el `switch` explícito, sin `default` que
      mezcle CANCELLED con READY_LATER:
      - `PREPARING → 'none'` *(ya se reservó en `place()`; si siguiera 'reserve' → **doble reserva**)*
      - `READY → 'none'` · `PICKED_UP → 'none'` *(la reserva se vuelve consumo permanente)*
      - `NOT_PICKED_UP → 'release'` *(sin cambio; el excedente vuelve — Plan 08 lo manda a `finished_goods`)*
      - `CANCELLED → 'release'` 🆕 *(el pending cancelado por el admin **tenía** reserva; si no libera → **fuga**)*
      - `READY_LATER → 'none'` *(la reserva continúa; la comida sigue prometida)*
- [ ] **Step 4 — `cancelByOwner` (`Order.ts:289-303`):** ahora **siempre** `return 'release'` (PENDING, READY
      y READY_LATER retienen reserva con el modelo nuevo). Se elimina la rama `wasPrepared`.
- [ ] **Step 5 — comentarios:** actualizar los que citan "D-037: aparta del almacén" para que reflejen el
      modelo nuevo (reservar en `place()`), apuntando al ADR **D-052**.

### Task 2: Adapter — reserva condicional en la creación + saga de cobro
**Files:** Modify `modules/orders/infrastructure/persistence/order.repository.ts`

- [ ] **Step 1 — pasar `stock` al snapshot** (`order.repository.ts:121-128`): añadir `stock: p.stock`.
- [ ] **Step 2 — `reserveStockOrThrow(manager, lines)` 🆕:** por cada línea, en **orden estable de productId**
      (anti-deadlock, igual que `applyStockDelta`):
      ```sql
      UPDATE products SET stock = stock - :qty, version = version + 1
      WHERE id = :id AND stock >= :qty
      ```
      **Leer `result.affected`**; si `=== 0` → `throw new ConflictException('Ya no queda suficiente <producto>')`
      (→ **409**), lo que **revierte Tx1**. Este es el mecanismo que el spec §5.1 dice que **hay que escribir**
      (el `GREATEST` incondicional no sirve).
- [ ] **Step 3 — reordenar `createWithItemsAndPayment` (`order.repository.ts:105-182`) a la saga:**
      1. `plan = Order.place(...)` (con `stock` en el snapshot).
      2. **Tx1:** `reserveStockOrThrow` → `save(order PENDING)` + items + `payment(status = PENDING)`.
      3. **Efectivo:** listo (payment PENDING, se cobra en mostrador). **Tarjeta:** `authorizeCardPayment(total)`
         **fuera de la tx**:
         - éxito → **Tx2:** `payment.status = PAID`.
         - fallo (`CircuitOpenError`/rechazo) → **Tx3 (compensación):** `order.status = CANCELLED` + liberar
           stock (reusar `applyStock(manager, order, 'release')`); re-lanzar el 400 original.
      4. `return toOrderResponse(loadOwned(...))`.
- [ ] **Step 4 — matar el código muerto/trampa:** con la Task 1, **ninguna transición devuelve ya `'reserve'`**.
      Quitar la rama `'reserve'` (`GREATEST(0, …)`) de `applyStockDelta` (`order.repository.ts:528-531`) —
      encodifica la semántica vieja y equivocada. `applyStock`/`applyStockDelta` quedan **solo release**.
      *(La reserva ahora es exclusivamente `reserveStockOrThrow` en creación.)* Documentar que `StockEffect`
      conserva `'reserve'` en el type por simetría, pero ninguna transición lo emite.
- [ ] **Step 5 — `expireStalePending()` 🆕 (el barredor también vence PENDING):** simétrico a `expireOverdue`
      (`order.repository.ts:300-363`), en la MISMA tx-por-lote y con el MISMO orden estable de productId. Flip
      atómico y condicional `PENDING → CANCELLED` + **release** del stock reservado, para los pendientes
      abandonados. **Matiz de los programados** (decisión del usuario "retienen desde ya"): un pedido con
      `scheduled_for` NO vence a los N min de creado — vence solo si **`scheduled_for` ya pasó** su gracia:
      ```txt
      inmediato  (scheduled_for IS NULL):  created_at   + PENDING_TTL  < now  → cancela+libera
      programado (scheduled_for NOT NULL): scheduled_for + PENDING_TTL  < now  → cancela+libera
      ```
      `PENDING_TTL` = constante con comentario `ponytail:` que la nombra como knob (default **30 min**, a
      confirmar; si necesita ser por sucursal → `app_settings`, no ahora). Emitir `OrderCancelled` al outbox
      (BR-012) igual que `expireOverdue` emite `OrderNotPickedUp`. **Cablearla al MISMO scheduler que ya llama
      `expireOverdue`** (verificar cuál es antes de editar, §2).

### Task 3: Frontend — manejar el 409 "ya no queda"
**Files:** Modify `frontend/src/entities/order/api.ts` (o el hook de creación de pedido)

- [ ] **Step 1:** al crear pedido, capturar **409** y mostrar un `Alert` claro ("Se agotó mientras pedías,
      revisa el carrito") en vez del error genérico. Es el único cambio de contrato observable del bug 3.
      *(Verificar el nombre real del archivo del cliente que hace `POST /orders` antes de editar — §2.)*

### Task 4: Tests (§22 — sin ellos, las piezas c/d se cuelan)
**Files:** Create/Modify tests de `orders` (unit del agregado + integración del repo)

- [ ] **Step 1 — doble reserva:** crear (stock 5, qty 2 → stock 3) → aceptar → el stock **sigue en 3**
      (baja **una sola vez**, en `place()`, no otra vez al aceptar).
- [ ] **Step 2 — fuga por cancelación del cliente desde PENDING:** crear (5→3) → `cancelOwn` → stock **vuelve a 5**.
- [ ] **Step 3 — fuga por cancelación del admin (pending→cancelled):** crear (5→3) → `transitionStatus CANCELLED`
      → stock **vuelve a 5**.
- [ ] **Step 4 — rechazo por falta:** crear qty 6 sobre stock 5 → **409** y stock **intacto en 5** (no saturó a 0).
- [ ] **Step 5 — reservar antes de cobrar:** tarjeta con `authorize` que lanza → el pedido queda **CANCELLED**
      y el stock **se liberó** (no quedó reservado por un pago que nunca entró).
- [ ] **Step 6 — programado retiene desde ya:** crear con `scheduledFor` válido → el stock baja **al pedir**
      (no espera a la ventana).
- [ ] **Step 7 — barrido de PENDING abandonado:** pending inmediato con `created_at` viejo → `expireStalePending`
      lo pasa a **CANCELLED** y **libera** el stock. Y un pending **programado a futuro** → **NO** lo vence
      (sigue reteniendo). Un pending programado cuya hora **ya pasó** + gracia → sí lo vence.
- [ ] **Step 8 — regresión:** `npx tsc --noEmit` 0 · `npx jest` **117 previos verdes** + los nuevos.

### Task 5: Cierre (§22 / §39 / §43)
- [ ] **Step 1 — workflow lean de caza P0-P5** (3 lentes × 2 rondas, RAM-safe) + **agente de regresión** sobre
      el diff. **0 P0-P5** o BLOQUEADO.
- [ ] **Step 2 — ADR D-052** en `decisiones.md`: revierte D-037 ("aparta; cocina al momento si no alcanza") →
      **reservar en `place()`, rechazar si no alcanza**; documenta la **saga reservar-antes-de-cobrar**, la
      decisión de **reservar los programados desde ya** y el **barrido de PENDING abandonado** (Task 2 Step 5).
      Responder las 6 preguntas del §43 (abajo).
- [ ] **Step 3 — CHANGELOG (§39):** hash del commit del usuario, fecha/hora, qué cambió, D-052.
- [ ] **Step 4 — reporte §19** (Observaciones / Riesgos / Validado / Pendiente / Supuestos / Confianza) y
      **el usuario commitea**.

---

## §43 — Análisis arquitectónico (revierte D-037; saga reservar-antes-de-cobrar)

1. **¿Por qué aquí?** El ciclo de stock (D-037) ya vive en el agregado `Order` (decide el efecto) + el adapter
   de `orders` (ejecuta el SQL). La reserva de creación y su compensación pertenecen a ese mismo par.
2. **¿Por qué no en otro módulo?** No en `payments`: la pasarela no conoce stock ni pedidos. `orders` es el
   dueño del pedido y orquesta la compensación; reusa `PaymentGatewayService` por su puerto.
3. **¿Dependencia nueva?** **Ninguna** (npm ni interna). Reusa `DataSource`, `PaymentGatewayService`,
   `applyStock`. Sin migración de esquema.
4. **¿Rompe encapsulamiento?** No: el dominio sigue decidiendo *intención* (`StockEffect`); el SQL sigue en el
   adapter. `ProductSnapshot` gana un campo que el adapter ya poseía.
5. **¿Acoplamiento?** La creación **ya** dependía de `payments`; se añaden 2 tx cortas de compensación. Sin ciclos.
6. **¿Cohesión?** `createWithItemsAndPayment` mantiene UNA responsabilidad (crear pedido con su pago); la saga
   es parte de esa responsabilidad, no una nueva.

---

## Riesgo que introduce "reservar al pedir" — RESUELTO: barrer también PENDING (decisión del usuario)

Con la reserva en `place()`, un pedido **PENDING que nadie acepta ni cancela retendría stock indefinidamente**.
Hoy `expireOverdue` (`order.repository.ts:300-363`) solo vence pedidos **READY**. **Decisión del usuario
(2026-07-14): el barredor debe vencer también los PENDING** → implementado en **Task 2, Step 5**
(`expireStalePending`), con el matiz de que los pedidos **programados retienen hasta que su hora pasa** (no
mueren a los 30 min de creados). Con esto la reserva-al-pedir **no fuga por abandono**.

---

## Fuera de alcance (Plan 08)

`finished_goods` (la unidad-comida con `produced_at`/`expires_at`/`is_reoffer`/`reoffer_price` propio), la
**merma obligatoria** que rompe el bucle infinito (bug 1), y mover el descuento de reoferta **del producto a
la unidad** (bug 2). Este Plan 07 los deja **intactos**: cierra solo el bug 3.
