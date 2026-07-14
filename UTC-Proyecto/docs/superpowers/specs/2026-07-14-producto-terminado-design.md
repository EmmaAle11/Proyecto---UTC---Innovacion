# El producto terminado — el agujero que la auditoría destapó

**Fecha:** 2026-07-14 · **Estado:** PROPUESTA — pendiente de aprobación.
**Origen:** auditoría multi-agente del 2026-07-14 (lente 3: huecos de diseño).
**⚠️ Dos de sus consecuencias YA ESTÁN EN PRODUCCIÓN** — pero **ninguna pierde dinero HOY**, porque
**los pagos están simulados** (D-006). Ver §3. **Son bugs estructurales: muerden el día que el cobro sea real.**

---

## 1. El agujero, en una frase

> **El modelo solo conoce INSUMOS y RECETAS. Pero la cocina PRODUCE EN LOTE y GUARDA COSAS HECHAS.**

Cinco problemas que parecían distintos son **una sola ausencia**:

| Síntoma | Qué revela |
|---|---|
| La **gelatina** se cuaja en un molde de 20 porciones **el día anterior**, y se vende de a una. | La producción **no es por pedido**. |
| El **aceite** se compra en tina de 20 L y **se tira entera** cada N días. | El consumo **no es por porción**. |
| El **agua fresca del día** es una preparación, no un insumo. | Hay **preparaciones intermedias**. |
| La **reoferta** vende una hamburguesa **ya hecha**… cuyo respaldo de insumos **es cero**. | Existe **inventario de terminados**. |
| La disponibilidad derivada diría **"0 disponibles"** mientras **hay comida en la barra**. | Las dos fórmulas **no hablan del mismo stock**. |

**Falta una sola cosa: el `finished_goods_stock` — el inventario de lo ya hecho.**

---

## 2. 🔴 El bug que YA ESTÁ EN PRODUCCIÓN: la reoferta es un bucle infinito

**Verificado en el código, no supuesto:**

```ts
// backend/src/modules/orders/domain/entities/Order.ts:179
const unitPrice = Money.of(product.reofferPrice ?? product.price);
//                          ^^^^^^^^^^^^^^^^^^^ vive en el PRODUCTO, no en la unidad rescatada

// Order.ts:281-282
case OrderStatus.NOT_PICKED_UP:
  return 'release';   // "excedente reofertable" → la unidad VUELVE a products.stock
```

### Consecuencia 1 — **el descuento contamina las hamburguesas frescas**

`reofferPrice` es una columna **del producto**. Mientras esté puesta, **TODA** venta de ese producto se
cobra al precio de reoferta — **incluidas las que se acaban de hacer**.

> **Es, literalmente, la canibalización que el propio diseño advertía… implementada.**

### Consecuencia 2 — **la comida nunca se merma. Nunca.**

```txt
se prepara → no la recogen → NOT_PICKED_UP → 'release' → vuelve a products.stock
                                  ↑                            ↓
                                  └──────── se re-oferta ──────┘
                                    (alguien pone reoffer_price;
                                     y tampoco se recoge)

            ♾️  SIN LÍMITE. SIN CADUCIDAD. SIN MERMA. NUNCA.
```

> ⚠️ **Precisión:** el `release` **sí es automático** (`Order.ts:281-282`, y el barrido masivo
> `expireOverdue` en `order.repository.ts:328-336` **suma stock sin caducidad alguna**). Lo que **no** es
> automático es **poner el `reoffer_price`**: eso lo hace una persona. **Pero una vez puesto, se queda** —
> y entonces el ciclo corre solo, y **contamina también las unidades frescas**.

**La hamburguesa del lunes sigue "disponible" el viernes.** Y cada rescate **le baja el precio a las
frescas**.

---

## 3. 🟠 El otro bug: **se acepta el pedido ANTES de reservar**

> ⚠️ **MATIZ DE HONESTIDAD (§40) — hoy NO se pierde dinero real, y hay que decirlo.**
> `payment-gateway.service.ts:5-9`: *"Pasarela de pago (**SIMULADA**, D-006)… hoy se **SIMULA** la
> aprobación. **El efectivo NO pasa por aquí** (se cobra en el mostrador)."*
>
> **Con tarjeta:** la aprobación es **ficticia** → no se mueve dinero.
> **Con efectivo:** el pago queda **`PENDING`** y **se cobra al entregar** → tampoco.
>
> **El bug es ESTRUCTURAL, no financiero — todavía.** El día que la pasarela sea real, **muerde de
> inmediato**. Y ya hoy produce el daño operativo: **dos pedidos aceptados sobre una sola unidad**, y el
> segundo revienta en la cocina.
> *(Una versión anterior de este spec lo tituló "se cobra antes de reservar" **en rojo, como bug de
> dinero**. Era exagerado.)*

```ts
// Order.ts:283-284
default:
  return 'none';   // "ready_later / cancelled (pending nunca reservó)"
//                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^
```

**El stock se aparta al ACEPTAR (`pending → preparing`). Pero el pedido se CONFIRMA al hacerlo.**

```txt
14:00:00  Cliente A pide la última hamburguesa   → pending (confirmado). Stock: 1
14:00:03  Cliente B pide la última hamburguesa   → pending (confirmado). Stock: 1  ← nadie lo detuvo
14:05:00  Cocina acepta a A                      → reserve. Stock: 0
14:05:10  Cocina acepta a B                      → 💥 sin hamburguesa, con el pedido ya prometido
```

**No es una carrera exótica: es el flujo normal.** Y no lo empeora que la Hamburguesa y el Combo compartan
carne — **el bug ya está dentro de un solo producto.**

> El spec de costeo decía que el riesgo era *"la disponibilidad es una estimación, no una reserva"*.
> **El riesgo real es más simple: se CONFIRMA el pedido antes de reservar** — y hoy eso rompe la cocina;
> mañana, con cobro real, rompe la caja.

---

## 4. El modelo: `finished_goods`

```txt
finished_goods              id · branch_id · product_id
  (lo YA HECHO)             qty            NUMERIC  CHECK (qty >= 0)
                            produced_at    timestamptz      ← para FEFO y caducidad
                            expires_at     timestamptz      ← ⚠️ lo que rompe el bucle
                            is_reoffer     boolean          ← ⚠️ la reoferta es de la UNIDAD
                            reoffer_price  NUMERIC NULL     ← ⚠️ NO en el producto
                            source         'produccion' | 'no_recogido'
```

### 4.1 La disponibilidad, ahora bien planteada

```txt
disponible(producto) =  finished_goods.qty                    ← lo que YA está hecho
                      + floor(min(stock_i / qty_bruta_i))     ← lo que SE PUEDE hacer
```

**Antes solo existía el segundo sumando** — por eso una hamburguesa cocinada, con respaldo de insumos cero,
hacía que la fórmula dijera *"0 disponibles"* mientras estaba en la barra.

### 4.2 La reoferta, arreglada

| Regla | Antes | Ahora |
|---|---|---|
| ¿De quién es el precio de reoferta? | **Del producto** → contamina las frescas | **De la unidad** (`finished_goods.reoffer_price`) |
| ¿Cuántas veces se puede re-ofertar? | **Infinitas** | Hasta `expires_at`. Al vencer → **`MERMA` obligatoria** |
| ¿Qué se vende primero? | Lo que sea | **FEFO**: lo que caduca primero |

```txt
no recogido → finished_goods (is_reoffer = true, expires_at = +N horas)
                    ├── se vende  → picked_up. Recuperado. ✅
                    └── caduca    → stock_movements: MERMA, motivo 'no_recogido'  ✅
                                    (el ciclo TERMINA)
```

### 4.3 Los otros tres síntomas, gratis

| Síntoma | Cómo lo cierra `finished_goods` |
|---|---|
| **Gelatina en molde** | *"Cuajé 20"* = **una entrada** de `finished_goods` (20 pza) que **consume los insumos del lote de golpe**. La venta descuenta **1 pza de terminados**, no 1/20 de grenetina. **Cero código nuevo: es el flujo de producción.** |
| **Agua fresca del día** | Igual: *"preparé 10 L de jamaica"* = entrada de terminados. **No hacen falta sub-recetas.** |
| **Aceite de la freidora** | **Dos cosas distintas, y mezclarlas es el error:** la **absorción por porción** (12 ml) es **food cost** ✅. El **cambio de tina** (20 L) es un `stock_movements` de tipo **`MERMA`, motivo `cambio_de_aceite`** — **gasto de operación, no costo del plato.** *(**ESTIMADO:** con ~100 órdenes fritas/día × 12 ml = **1.2 L/día de absorción**, contra una tina de 20 L cambiada cada 4 días = **5 L/día real**. El sistema descontaría 1.2 y la realidad se llevaría 5 → **el inventarista ve un faltante crónico y deja de confiar en el sistema entero**, que es como mueren estos proyectos. **Los dos volúmenes son estimación, no medición.**)* |

---

## 5. El arreglo: **reservar en `place()`**

```txt
ANTES:  place() → cobra           ·  accept() → reserva     ← la ventana del bug
AHORA:  place() → reserva Y cobra ·  accept() → (ya está)
```

### ⚠️ 5.1 CORRECCIÓN (§15 / §40) — **NO es "mover una línea". Yo lo afirmé y era FALSO.**

Una versión anterior de este spec decía que el arreglo era trivial porque *"ya existe el
`UPDATE … WHERE stock >= qty` atómico"* y que *"si el admin rechaza → `release`, como hoy"*.
**Las dos afirmaciones son falsas contra el código.** Verificado:

**① El UPDATE condicional NO existe.** El único SQL de reserva
(`order.repository.ts:527-538`) es:

```ts
const expr = action === 'reserve'
  ? 'GREATEST(0, "stock" - :qty)'   // ← INCONDICIONAL. Satura en 0. SIEMPRE afecta 1 fila.
  : '"stock" + :qty';
```

**Nunca falla.** Y el comentario de la línea 511 **documenta la semántica opuesta como deliberada**:
*"aparta; **cocina al momento si no alcanza**"*. **Nadie lee `affected`** en todo el código productivo.
→ **Hay que ESCRIBIR el mecanismo de rechazo. No reutilizarlo.** Y eso **revierte una decisión de diseño
consciente (D-037) → necesita ADR.**

**② `Order.place()` NI SIQUIERA VE el stock.** `ProductSnapshot` (`Order.ts:93-101`) tiene
`id · name · price · reofferPrice · isAvailable · basePrepTimeSeconds`. **No hay campo `stock`.**
Y `createWithItemsAndPayment` **nunca llama a `applyStock`**.

**③ 🔴 Y lo peor: reservar en `place()` SIN tocar las rutas de cancelación FUGA STOCK PARA SIEMPRE.**

```ts
// Order.ts:283-284   — el admin cancela → NO libera
default: return 'none';   // "ready_later / cancelled (pending nunca reservó)"

// Order.ts:302       — el cliente cancela sin haberse preparado → NO libera
return wasPrepared ? 'release' : 'none';

// Order.ts:273       — y al aceptar, volvería a descontar → DOBLE RESERVA
case OrderStatus.PREPARING: return 'reserve';
```

> **Mi "arreglo de una línea" habría metido un bug PEOR del que arregla:** cada pedido cancelado se
> llevaría el stock a la tumba, y cada pedido aceptado descontaría dos veces.

### 5.2 El alcance REAL

| # | Qué | Por qué |
|---|---|---|
| **a** | Añadir `stock` a `ProductSnapshot` y pasarlo desde el repo | Hoy `place()` es **ciego** al inventario |
| **b** | **Escribir** un `UPDATE … SET stock = stock − :qty WHERE id = :id AND stock >= :qty` y **leer `affected`** | El condicional **no existe**; el actual satura en 0 |
| **c** | `case PREPARING: return 'none'` *(ya se reservó en `place()`)* | Si no, **doble reserva** |
| **d** | `cancelByOwner` → `'release'` **también desde `PENDING`**; y el `default` de `applyAdminTransition` → `'release'` en `CANCELLED` | Si no, **fuga de stock permanente** |
| **e** | Tests de **fuga**: crear → cancelar → el stock **vuelve**. Y de **doble reserva**: crear → aceptar → baja **una sola vez** | Sin ellos, (c) y (d) se cuelan |
| **f** | **ADR**: revierte D-037 (*"cocina al momento si no alcanza"*) | Es una decisión de negocio, no un bug |

**Sigue siendo el arreglo correcto. Pero es seis piezas, no una — y tres de ellas son las que evitan que
el remedio sea peor que la enfermedad.**

---

## 6. Lo que esto NO es

- **No es una arquitectura nueva.** Es **una tabla y un `MAX`**.
- **No son sub-recetas.** La producción en lote **es** la respuesta a las sub-recetas: se registra lo
  producido, no se calcula recursivamente.
- **No cambia el `StockEffect`** del agregado: `reserve` y `release` siguen existiendo. Cambia **de dónde**
  sale y **a dónde** vuelve la unidad.

---

## 7. Prioridad (§40 — honestidad sobre la urgencia)

| # | Qué | Por qué ahora |
|---|---|---|
| **1** | **Reservar en `place()`** | **Se confirma comida que no existe.** Hoy rompe la cocina; con cobro real, la caja. **NO es una línea** — ver §5.1. |
| **2** | **`expires_at` + merma obligatoria** | **Bug de negocio, en producción, y este SÍ pierde dinero HOY:** la comida de ayer se vende **para siempre**, y **con descuento**. |
| **3** | **`reoffer_price` a la unidad** | Hoy el descuento **contamina las hamburguesas frescas**. |
| **4** | `finished_goods` + disponibilidad `MAX` | Es el que cierra los cinco síntomas — pero **los tres de arriba son sangrado activo**. |
| **5** | Aceite: absorción (costo) vs. cambio de tina (merma) | Sin esto, el inventario **deriva un 76 % diario** y el inventarista deja de creerle al sistema. |

---

*Referencias: `rules.md` §0 · §40 · BR-006 (reoferta) · BR-011 (stock nunca negativo) · BR-015.
Código verificado: `backend/src/modules/orders/domain/entities/Order.ts:179, 281-284` · `order.repository.ts:511, 527-538`.
ADR pendiente: **D-052**.*
