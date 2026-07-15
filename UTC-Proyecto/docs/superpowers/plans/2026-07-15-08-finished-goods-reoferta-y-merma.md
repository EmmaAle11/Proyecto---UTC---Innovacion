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

## StockEffect y ciclo de la unidad

```
ready → not_picked_up:  NO vuelve a products.stock. Crea finished_goods(source='no_recogido',
                        is_reoffer=true, expires_at=now+REOFFER_TTL, reoffer_price=NULL).
finished_good reoffer:  ├─ admin pone precio (rewire del panel) → reoffer_price
                        ├─ cliente la compra → qty--, si 0 se elimina. Recuperada. ✅
                        └─ vence (barrido) → stock_movements(merma,'caducado') + se elimina. FIN DEL CICLO ✅
```
`REOFFER_TTL` = knob (ponytail), **4 h** por defecto (comida del día; no cruza al día siguiente).

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
- **F2b ⏳** bug 2 (compra de rescate): order-line `finishedGoodId`, reserva sobre finished_goods, precio
  por unidad, quitar `product.reofferPrice`. Migración sobre `order_items`.
- **F4 ⏳** disponibilidad + catálogo (stock + Σqty; exponer reofertas).
- **F5 ⏳** frontend (panel admin de reoferta → unidad; cliente compra la unidad).
- **F6 ⏳** ADR/CHANGELOG/memoria + caza total a 0 P0-P5.

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
