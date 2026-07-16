# Plan 08 — `finished_goods`: reoferta por unidad + caducidad/merma (bugs 1 y 2 de D-052)

> Spec: `docs/superpowers/specs/2026-07-14-producto-terminado-design.md` (§4). ADR: **D-052**.
> Depende conceptualmente de insumos/recetas (Plan 04, **sin código**) → el 2º sumando de la
> disponibilidad (`floor(min(stock_i/bruta_i))`) se **difiere**; hoy `products.stock` es el proxy de
> "lo que se puede hacer". Alcance elegido por el usuario (2026-07-15): **completo en un Plan 08**.

## Los dos bugs (en producción, sangran dinero)

- **Bug 1 — bucle infinito de reoferta.** `not_picked_up → 'release'` devuelve la unidad a
  `products.stock` **como fresca, sin caducidad**: la comida de ayer se vende para siempre. **Falta
  `expires_at` + merma obligatoria** que termine el ciclo.
- **Bug 2 — la reoferta contamina las frescas.** `reoffer_price` vive **en el producto**
  (`product.reofferPrice`); `Order.place` cobra `reofferPrice ?? price` → **TODA** venta va con
  descuento, no solo la unidad rescatada. **El precio de reoferta debe ser de la UNIDAD.**

## Modelo objetivo

Tabla nueva **`finished_goods`** (lo YA hecho / rescatado):
`id · branch_id(null) · product_id · qty(int,>=0) · produced_at · expires_at · is_reoffer(bool) ·
reoffer_price(numeric null) · source('produccion'|'no_recogido') · created_at`.

Tabla nueva **`stock_movements`** (auditoría de merma): `id · product_id · qty · type('merma') ·
reason('no_recogido'|'caducado') · finished_good_id(null) · created_at`. (Mínima; se ampliará en Plan 04.)

**Disponibilidad(producto)** = `products.stock` (proxy "se puede hacer", insumos → Plan 04)
`+ Σ finished_goods.qty` (no vencidas). El bloque de reoferta se muestra **aparte** (ver decisión ↓).

## Decisión de diseño (ponytail — precio EXACTO, sin divergencia de carrito)

**La unidad reofertada es un ítem de catálogo DISTINTO, no un auto-FEFO que mezcla precios.** El cliente
ve "Hamburguesa · reoferta $20 · queda 1" como una entrada aparte y la agrega explícitamente; el pedido
referencia el `finished_good` concreto. **Por qué:** el auto-FEFO (consumir reoferta primero y promediar
precios) haría que el total dependa del estado de inventario en el instante → el frontend no puede predecir
el total y **divergiría de lo cobrado** (el propio `priceToPay` advierte de eso). Ítem distinto = precio
exacto, cambio localizado, y la reoferta no toca jamás el precio fresco (bug 2 muerto por construcción).

## StockEffect y ciclo de la unidad — **REDISEÑADO 2026-07-16 (decisión del usuario)**

> **Lo que había (`REOFFER_TTL_HOURS = 4`) era una constante que yo inventé, sin base en el negocio.**
> El usuario la sustituyó por un ciclo anclado a dos hechos reales: **el cierre de la cooperativa** y un
> **tope duro**. El humano decide; el reloj es la red de seguridad si no decide. Autocrítica (#40): mi 4 h
> ni siquiera dejaba vender la comida el mismo día que se hizo.

```
16/07 9:53:16       [cierre]                                 17/07 9:53:16
    │                  │                                           │
   NACE ── vendible ───┤── GRIS: no se vende, espera su baja ──────┤── MERMA (automática)
                       │                                           │
                  alerta T-INV-08                             aviso T-INV-10
                  "confírmala"                                "ya se dio de baja"
```

**Los tres tramos y sus reglas:**

```txt
1. NACE → CIERRE       VENDIBLE. Tiene todas las horas del día para venderse.
                       T-ATN-09 le pone reoffer_price · T-CLI-08 la compra.
                       La hora COMPLETA de nacimiento es dato de UX ("hecho hace 3 h 12 min").

2. CIERRE → +24 h      NO VENDIBLE. Al abrir aparece en GRIS (T-ATN-11) con su antigüedad.
                       T-INV-09 puede confirmar la baja. Es una unidad muerta esperando su acta.
                       ⚠️ Este tramo es lo que mantiene MUERTO el bug 1: la comida de ayer
                          JAMÁS se vende hoy, aunque el barrido no haya pasado.

3. +24 h EXACTAS       MERMA automática desde producedAt (9:53:16 → 9:53:16). El humano NO es
                       el único freno. stock_movements(merma,'caducado') + delete atómico.
```

**Los dos relojes van por PUERTO, no como constantes** (requisito explícito del usuario: *"para poder
cambiar estas horas en cualquier momento, pero la arquitectura y proceso permanezcan de la misma forma"*):

```txt
FinishedGoodLifecyclePort         (domain/ports/) — la lógica PREGUNTA la hora, no la sabe
├─ sellableUntil(producedAt)  →   el cierre de la cooperativa de ese día
└─ expiresAt(producedAt)      →   producedAt + hardTtlHours

Adapter HOY:      lee closing_time + hard_ttl_hours de app_settings (fila ÚNICA GLOBAL)
Adapter Plan 01:  los lee de branches, POR COOPERATIVA → cambia el CABLEADO, no la lógica
```

> **Deuda declarada (evidencia 2026-07-16):** **no existe tabla `branches`** (array hardcodeado en el
> frontend, D-041) y `app_settings` es `@Check("id"=1)` — **fila única global**. Por eso el horario del
> Plan 08 rige para TODAS las cooperativas hasta el Plan 01. Decisión del usuario, dicha en voz alta para
> que nadie lea "cada cooperativa" y crea que ya es verdad.

**El dueño de la merma es el `inventarista`** (`T-INV-08..12`), **no** quien pone el precio (`T-ATN-09`):
quien tiene el incentivo de recuperar el dinero no debe ser quien decide que ya no se recuperó. Como el rol
**no existe todavía** (Plan 01), se construye pidiendo `inventarista` y se **cablea a `admin`** hoy.

## Estado (2026-07-15)

- **F1 ✅** esquema (migración `finished_goods`+`stock_movements`, entidades, enums). tsc 0.
- **F2a ✅** bug 1 (bucle): `StockEffect 'to_reoffer'`; not_picked_up + cancel-desde-ready → `finished_good`
  (source por provenance: `cancelado` vs `no_recogido`; expira +4h), NO a stock; `expireOverdue` produce
  finished_goods. Multi-línea + branch_id cubiertos.
- **F3 ✅** `expireFinishedGoods` (barrido): claim ATÓMICO `DELETE...RETURNING` → `stock_movements(merma,
  caducado)`; devuelve unidades (Σqty). Anti doble-merma (mismo patrón que los barridos hermanos).
- **Caza loop-break (bug 1): 3 rondas → CONVERGIDO** (`wf_002c2657`, `wf_5091d9a4`, `wf_4897435b`). R1 halló
  el claim no-atómico (doble-merma) → arreglado; R2 halló provenance/unidades/multi-línea → arreglados; R3:
  **0 defectos de producto** (solo 2 de calidad-de-test: branchId cubierto; predicado = techo unit documentado).
  **127 verdes, tsc 0.**
- **F2b.1 ✅** esquema `order_items.finished_good_id` (migración `1782942000000`, id suelto).
- **F2b.2/3 ✅ (core)** compra de rescate: `Order.place` cobra precio de la UNIDAD (line `finishedGoodId` →
  `FinishedGoodSnapshot`), valida (inexistente/otro-producto/sin-precio → DomainError); línea fresca → catálogo
  (quitado `product.reofferPrice` del pricing — **contaminación muerta**); `reserveStockOrThrow` reserva por tipo
  (rescate → `finished_goods.qty>=:q`, 409; fresca → stock); `applyStock` devuelve por tipo (rescate → a su misma
  unidad, conserva expires_at; fresca → stock/nueva unidad); `expireOverdue` usa `applyStock('to_reoffer')`.
  **133 verdes, tsc 0.** Caza F2b: `wf_fa8aa554` (en curso).
- **F2b.4 ⏳** quitar `product.reofferPrice` de raíz (columna/DTO/policy/response + migración drop).
- **F3b ⏳ NUEVA — los dos relojes** (rediseño 2026-07-16). Sustituye `REOFFER_TTL_HOURS = 4`:
  - `app_settings`: + `closing_time` (time) + `hard_ttl_hours` (int, default 24). Migración + CHECK.
  - `FinishedGoodLifecyclePort` en `orders/domain/ports/` + adapter que lee `app_settings`.
  - `finished_goods`: + `sellable_until` (además de `expires_at`). La reserva exige `sellable_until > now`
    (**no** `expires_at`): ese es el tramo gris.
  - Barrido partido en dos: `alertClosedFinishedGoods` (cierre → notifica, NO borra) y
    `expireFinishedGoods` (24 h → merma + delete atómico, ya existe).
  - Notificaciones al `inventarista` (cableado a `admin` hoy) vía el outbox de `notifications`.
- **F3c ⏳ NUEVA — merma manual** `POST /finished-goods/:id/merma` `@Roles(inventarista→admin)`:
  `T-INV-09` (confirmar la baja en el tramo gris) y `T-INV-11` (merma anticipada). Claim atómico, misma
  ruta contable que el barrido. **Adición, jamás reemplazo del auto-vencimiento.**
- **F4 ⏳** disponibilidad + catálogo (stock + Σqty **de las vendibles**; exponer reofertas como ítems).
- **F5 ⏳** frontend: panel de reoferta → la unidad, con su **antigüedad exacta** y **gris** cuando
  `sellable_until` pasó (`T-ATN-10/11`) · cliente compra la unidad (`T-CLI-08`) · `priceToPay` deja de usar
  `product.reofferPrice` · **UX del admin para capturar cierre + tope** (`T-ADM-05`, `T-ADM-08`) en
  Personalización · panel de merma del inventarista (`T-INV-08/09/12`).
- **F6 ⏳** ADR/CHANGELOG/memoria + caza TOTAL a 0 P0-P5 (Plan 07 + Plan 08 juntos, >10 lentes).

> ⚠️ Gap temporal F2a→F4: una unidad no recogida ya NO infla stock fresco (bug 1 roto ✓) pero aún no se
> muestra ni se puede comprar (F4/F2b) → hoy expira a merma sin rescate. Es estrictamente mejor que el bug
> (mejor invisible que vendida-fresca-para-siempre); el rescate llega en F2b.

## Fases (cada una deja tsc+jest verdes; caza al cierre del backend y del total)

- **F1 — esquema.** Migración `finished_goods` + `stock_movements` (+ constraints/índices). Entidades
  TypeORM. Enum `StockMovementType`/`reason`. Sin lógica aún. ✔ tsc.
- **F2 — dominio + reserva.** `not_picked_up` deja de liberar a `products.stock`: el adapter, al aplicar
  el efecto de un `not_picked_up`, crea la `finished_good` (source no_recogido). La compra de una unidad
  reofertada: línea de pedido con `finishedGoodId` → reserva atómica sobre `finished_goods.qty`
  (`UPDATE ... SET qty=qty-1 WHERE id=:id AND qty>=1`, 409 si 0) y precio = `reoffer_price`. `Order.place`
  deja de leer `product.reofferPrice`. Tests de fuga/doble/precio.
- **F3 — barrido de merma.** `expireFinishedGoods()` (junto a los otros barridos): vencidas →
  `stock_movements(merma,'caducado')` + delete, en la misma tx. Test.
- **F4 — disponibilidad + catálogo.** `GET /products` expone `finished_goods` reofertadas como ítems
  vendibles (o un bloque `reoffers[]` por producto) + disponibilidad = stock + Σqty. Se **elimina**
  `product.reoffer_price` (columna/DTO/policy/response) — bug 2 de raíz. Migración de drop.
- **F5 — frontend.** El panel admin de reoferta apunta a la unidad (`finished_goods`), no al producto;
  el cliente ve/agrega la unidad reofertada como ítem propio; `priceToPay` deja de usar `reofferPrice`
  del producto. tsc front 0.
- **F6 — cierre.** ADR D-052 (bugs 1-2 CERRADOS), CHANGELOG, memoria. Caza adversaria multi-agente
  hasta **0 P0-P5** (nada se difiere, decisión del usuario).

## Riesgos ya vistos (a cazar)

- Reserva de `finished_goods` concurrente (dos clientes, 1 unidad) → UPDATE condicional + `affected`,
  igual patrón que `reserveStockOrThrow` (Plan 07).
- `not_picked_up` masivo (`expireOverdue`) debe crear finished_goods, no sumar a stock → tocar el barrido.
- Cancelación de un pedido que compró una unidad reofertada → devolver `qty++` a la finished_good (o
  recrearla si ya se borró). Definir en F2.
- Interacción con Plan 07: la reserva fresca (products.stock) y la de finished_goods son caminos
  distintos; el release de cancelación debe elegir el correcto según la línea.
