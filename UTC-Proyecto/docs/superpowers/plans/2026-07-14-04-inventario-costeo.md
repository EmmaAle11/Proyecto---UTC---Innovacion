# Plan 04 — Inventario, costeo real, disponibilidad derivada y ganancia

> **Sección 4 de 5.** Depende del **Plan 01** (roles: `inventario` es el dueño de esto).
> Git lo ejecuta el usuario (§23). Rama: `feat/roles-e-insumos`.

**Goal:** Que el encargado de stock registre **materia prima con su costo real**, que el sistema **calcule
el costo y la ganancia de cada producto**, que **la disponibilidad del menú se derive del stock de insumos**
("*el sistema con lo que llena de stock quita o mantiene ciertos alimentos*"), y que el cliente pueda
**personalizar** su pedido (insumos ✓/✗ + notas).

---

## El caso que lo define todo (tu ejemplo)

```txt
Compra:    3 kg de carne por $150       →  $0.05 por gramo
Receta:    el platillo gasta 500 g      →  $25.00 de carne
```

Ese cálculo **rompió el modelo que yo tenía escrito** (insumos como "porciones" contables, `stock` entero).
El insumo necesita **unidad base**, **stock decimal** y **costo por unidad base**. Y la receta necesita
guardar **una cantidad**, no un booleano *"lleva carne"*.

---

## ⚠️ Lo que faltaba: **el rendimiento (yield)**

**Si esa carne es un CORTE CON HUESO, tu cuenta de $25 está incompleta — y el error va siempre hacia abajo.**

3 kg de carne **con hueso y grasa** no dan 3 kg útiles. Dan ~2.4 kg. Ese **rendimiento del 80 %** significa
que para poner **500 g netos** en el plato hay que **sacar 625 g brutos** de la alacena:

```txt
qty_bruta = qty_neta / rendimiento  =  500 g / 0.80  =  625 g
costo real                          =  625 × $0.05   =  $31.25   (no $25.00)
```

**Si no modelo esto, pasan dos cosas y ninguna se ve venir:**
1. El costo teórico queda **subestimado siempre** → crees que ganas más de lo que ganas.
2. El inventario **"se pierde" solo** — el sistema descuenta 500 g y la realidad se llevó 625.

### ⚠️ CORRECCIÓN (§40) — **el yield NO aplica a la hamburguesa**

Una versión anterior de este plan presentaba el cálculo de arriba como **"el costo de la carne de la
hamburguesa"**. **Es falso: la hamburguesa lleva carne MOLIDA, que no tiene hueso — su rendimiento es
100 %.**

> **Tu aritmética estaba bien. Estaba mal ETIQUETADA.** Es un test válido del mecanismo del yield **para un
> corte con hueso**; no es el costo de la hamburguesa.

| Dónde el yield **SÍ** muerde | Dónde **NO** |
|---|---|
| **Elote en mazorca 0.55** *(se tira casi la mitad)* · Aguacate 0.70 · Papa fresca 0.80 · **Corte con hueso 0.80** · Lechuga 0.85 · Cebolla 0.90 | **Carne MOLIDA 1.00** · papa **congelada** 1.00 · pan · quesos · salsas · polvos — **vienen listos** |

**La lección de diseño es mejor que el error:** el rendimiento **depende de la PRESENTACIÓN de compra**.
La misma papa rinde **80 % en costal** y **100 % congelada**. Por eso vive **en el insumo**, no en una
constante global.

Y hay una **segunda merma**, distinta, que también hay que separar:

| | Qué es | Cómo se modela |
|---|---|---|
| **Merma de rendimiento** (yield) | El hueso, la grasa, la cáscara. **Predecible.** | **Es COSTEO, no evento.** Un `%` en el insumo. Se descuenta **siempre**. |
| **Merma incidental** | El plato que se cayó, lo que caducó, el derrame. **Accidente.** | **Es EVENTO.** Un movimiento con **motivo y responsable**. |

Confundirlas es el bug clásico: la varianza de inventario se lo traga todo y ya no puedes distinguir
*"se echó a perder"* de *"se lo están robando"*.

---

## Decisiones de diseño (regla 43)

### D1 — El factor de empaque va en **el lote**, no en el insumo

*"Caja"*, *"costal"*, *"bolsa"* **no son unidades**: son **presentaciones**. Una caja de lechuga trae 12
piezas hoy y 10 la próxima. La bolsa de carne es de 3 kg con un proveedor y de 2.5 kg con otro.

> **Si el factor vive en el insumo, no puedes tener dos proveedores con presentaciones distintas sin
> duplicar el insumo.** Es el error de diseño clásico. El factor va en **la línea de compra**.

### D2 — Costeo: **Costo Promedio Ponderado (CPP)** para el dinero, **FEFO** para el refrigerador

Son **dos preguntas distintas** que todo el mundo confunde:

- *"¿Qué bolsa saco del refri?"* → **FEFO** (lo que caduca primero). Lo necesitas **de todos modos** por
  caducidad. Es práctica de almacén.
- *"¿Cuánto costó?"* → **CPP**. `O(1)`, sin partir lotes, y —lo que importa— **sin desbaratar capas de
  costo cuando se cancela un pedido**, que es exactamente donde FIFO acumula los bugs.

```txt
Al recibir una compra:
  nuevo_promedio = (stock × promedio_actual + qty_entrada × costo_del_lote) / (stock + qty_entrada)
```

**Landmines del CPP, y hay que blindarlos:**
- Si `stock = 0` → **no dividir entre cero ni resetear el promedio**: se **congela** el anterior.
- **Prohibir stock negativo** (ya es BR-011) — con stock negativo el promedio se vuelve basura.
- `avg_unit_cost` en **`NUMERIC(14,6)`**, no en 2 decimales: un aceite de $37/L son **$0.037/ml**.
  **Redondear a 2 decimales SOLO al final** (al total de la línea), **nunca por gramo** — si redondeas por
  unidad base, te desvías centavos en cada plato y nunca cuadras contra la venta.

### D3 — El costo se **CONGELA** en el pedido

Son **dos números distintos**, y confundirlos es el bug que nadie ve hasta que hay seis meses de datos podridos:

| | Qué | Cuándo |
|---|---|---|
| **Costo teórico vigente** | `Σ(qty_bruta × costo_actual)` | Derivado. Es lo que `inventario` mira para decidir precios. |
| **Costo histórico del pedido** | **SNAPSHOT inmutable** | Se congela al confirmar. **Nunca se recalcula.** |

> **Una compra de mañana NO puede cambiar el margen de ayer.**

Es **exactamente** el mismo principio que ya aplicamos al precio (BR-015). Solo que ahora al **costo**.
Sin el snapshot, el reporte de rentabilidad histórica **cambia solo** cada vez que sube la carne.

### D4 — El stock es un **libro mayor**, no un `UPDATE`

**Todo cambio de stock es un MOVIMIENTO** (append-only). El saldo se cachea, pero **el ledger es la verdad**:

```txt
COMPRA (+) · CONSUMO_VENTA (−) · MERMA (−, con motivo) · AJUSTE_CONTEO (±) · DEVOLUCION_PROVEEDOR (−)
```

Sin esto no hay **varianza de inventario** (teórico vs. conteo físico), y sin varianza el inventario deriva
y nadie se entera.

### D5 — Cancelar **después de cocinar** NO devuelve el insumo: lo convierte en **MERMA**

Y esto **encaja con lo que ya existe**, con una simetría que vale la pena notar:

| Momento | Producto terminado | Insumos |
|---|---|---|
| `pending → cancelled` | nada que devolver (aún no se reservó) | nada consumido |
| `preparing` (aceptar) | `reserve` | **se consumen** (`CONSUMO_VENTA`) |
| `ready → cancelled` / `not_picked_up` | **`release`** → vuelve a stock y es **re-ofertable** (BR-006, "pon tu precio") | **NO se devuelven → `MERMA`** |

**La hamburguesa ya está hecha: la carne ya no vuelve al refri.** Pero la hamburguesa sí se puede
re-ofertar. El `release` que ya existe **sigue siendo correcto** — solo que ahora significa otra cosa
(inventario re-ofertable), y los insumos siguen su propio camino.

---

## Modelo de datos

```txt
ingredients                 id · branch_id · name
                            base_unit           'g' | 'ml' | 'pza'      ← la báscula única
                            track_stock         boolean DEFAULT true    ← ⚠️ ver D6
                            yield_pct           NUMERIC(5,4) DEFAULT 1  ← el rendimiento (80% = 0.8)
                            stock               NUMERIC(14,3)  CHECK >= 0   (BR-011)
                            min_stock · max_stock
                            avg_unit_cost       NUMERIC(14,6)  ← CPP. SEIS decimales, no dos.
                            is_active · version

ingredient_purchases        id · ingredient_id · supplier
  (los LOTES)               qty_purchased · purchase_unit · factor_to_base   ← D1: el factor va AQUÍ
                            total_cost · unit_cost NUMERIC(14,6)  ← congelado en el lote
                            expires_at          ← FEFO
                            purchased_at · registered_by

stock_movements             id · ingredient_id · type · qty_delta NUMERIC(14,3)
  (el LIBRO MAYOR, D4)      unit_cost_at NUMERIC(14,6) · reason · order_id? · at · by

product_ingredients         product_id · ingredient_id           PK compuesta
  (LA RECETA, "las ramas")  qty_net    NUMERIC(14,3)   ← 500 (g). NO un booleano.
                            is_default · is_customizable

order_item_ingredients      order_item_id · ingredient_id        PK compuesta
  (el SNAPSHOT, D3)         name_snapshot · included
                            qty_gross_snapshot · unit_cost_snapshot   ← la ganancia de AYER no cambia

order_items.notes           text NULL     ← la nota libre del cliente

app_settings.food_cost_max  NUMERIC(5,4) DEFAULT 0.40   ← por cooperativa (ver D7)
```

Los dos booleanos de la receta expresan las tres clases de insumo sin inventar una máquina de estados:

```txt
is_default=true,  is_customizable=false  →  BASE.     Pan, carne. Se muestra, NO se quita. ← gobierna la disponibilidad
is_default=true,  is_customizable=true   →  ESTÁNDAR. Lechuga, jitomate. Viene, se puede quitar.
is_default=false, is_customizable=true   →  EXTRA.    Aderezo mango habanero. No viene, se puede poner.
```

### D6 — ⚠️ `track_stock`: **el fallo #1 en la práctica**

**La sal.** Nadie la cuenta nunca. Si entra en el mínimo de la disponibilidad, el sistema reporta
**0 hamburguesas para siempre**. `track_stock = false` la saca del cálculo pero **la deja costeando**.

### D6-bis — El IVA en el COSTEO (usuario: *"debemos sumar el IVA a los alimentos en los costos"*)

**Cuidado: el IVA se comporta distinto en cada lado, y meterlo mal es peor que no meterlo.**

| Lado | IVA | Qué significa |
|---|---|---|
| **VENTA** (comida preparada) | **16 %** | **NO es tuyo.** Lo cobras y se lo das al SAT. El precio de menú **lo incluye**. |
| **COMPRA de ALIMENTO** — y es casi todo: carne, verdura, leche, **aceite, mayonesa, catsup, aderezos, azúcar** | **0 %** | Los $150 de la carne **son $150**. LIVA 2-A: 0 % a *"productos destinados a la alimentación humana"*. **No pagan 16 % por ser procesados.** |
| **COMPRA de NO-alimento** (desechables, vasos, charolas, bolsas, gas, limpieza) | **16 %** | Pagas $116 → base $100 + IVA $16 |
| ⚠️ **Las dos excepciones** | **16 %** | **Concentrados/polvos que al diluirse dan refresco** (¡el polvo de horchata!) · **saborizantes y aditivos** (zona gris del chile en polvo). |

**Y la bifurcación que decide si ese IVA es COSTO o no:**

```txt
¿La cooperativa puede ACREDITAR el IVA que paga?
  SÍ  →  se recupera     →  costo = base sin IVA   ($100)
  NO  →  dinero perdido  →  costo = total pagado   ($116)
```

Depende de su **régimen fiscal** — y si es **`603` (PM con Fines no Lucrativos)**, lo común en cooperativas
escolares, **la acreditación puede estar limitada → el IVA pagado se vuelve costo real.**

→ **`branches.iva_acreditable` (booleano) + `ingredients.iva_rate`.** Ajuste por cooperativa, **no una
constante**. Y hay que **leer la Constancia de Situación Fiscal**, no adivinarla.

**El KPI que la cooperativa debe ver ANTES, no en la declaración:**
```txt
IVA trasladado (ventas, 16 %)      →  mucho
IVA acreditable (compras, casi 0 %) →  casi nada
────────────────────────────────────────────────
IVA A PAGAR  ≈  todo el IVA que cobraste
```

### D7 — Margen: **contra el precio SIN IVA**, o te mientes 16 puntos

| Concepto | Fórmula |
|---|---|---|
| **Food cost %** | `costo / precio_sin_iva` | |
| **Precio mínimo** | `costo / food_cost_max` | |

**La trampa:** en México el precio de menú es **con IVA incluido**. El margen se calcula contra
**`precio / 1.16`**. Calcularlo contra el precio con IVA **infla el margen ~16 puntos** y te hace creer que
ganas cuando no. *(Y sí: la comida preparada causa IVA 16 % — ver Plan 05.)*

**El estándar de la industria es 28–35 % de food cost. Una cooperativa escolar no es un restaurante**
(precios bajos, mano de obra de los socios, no maximiza utilidad): realistamente **35–45 %**.
→ **Es un ajuste POR COOPERATIVA, no una constante en el código.**

**Y no se bloquea duro.** El admin legítimamente puede querer un producto gancho.
→ **Advertencia bloqueante + override explícito + entrada en el `audit-log`** (que ya existe).

> **La alerta que de verdad salva dinero** no es la del momento de fijar el precio. Es esta:
> **re-evaluar el margen cuando SUBE el costo de un insumo.** Un producto puede quedarse bajo el agua
> **sin que nadie lo haya tocado.**

---

### Task 1: BD — insumos, lotes, recetas, movimientos
**Files:** Create `migrations/…-AddIngredientsAndCosting.ts` + 5 entidades

- [ ] **Step 1:** las 5 tablas del modelo de arriba. `CHECK stock >= 0` (BR-011) ·
      `CHECK yield_pct > 0 AND yield_pct <= 1` · `CHECK avg_unit_cost >= 0`.
- [ ] **Step 2 — el ledger:** `stock_movements` **append-only**. Sin `UPDATE`, sin `DELETE`.
- [ ] **Step 3:** `order_items.notes`.
- [ ] **Step 4:** `app_settings.food_cost_max` (por sucursal — el Plan 01 ya la partió por `branch_id`).
- [ ] **Step 5:** `migration:run` **y `revert`** contra Postgres real.

### Task 2: Dominio — costeo (`modules/inventory/domain/`)
**Files:** Create `modules/inventory/domain/{ingredient.ts, recipe.ts, costing.ts, availability.ts}`,
`tests/unit/costing.spec.ts`

- [ ] **Step 1 — `UnitCost` VO:** centavos no bastan. `NUMERIC(14,6)`. **Redondeo una sola vez, al final.**
- [ ] **Step 2 — CPP** (`applyPurchase`): la fórmula de D2, **con el guardia de `stock = 0`** (congelar,
      no dividir entre cero) y **sin permitir stock negativo**.
- [ ] **Step 3 — `grossQty(net, yield)`** = `net / yield_pct`. Es **la** función del yield y todo pasa por ella.
- [ ] **Step 4 — costo teórico del producto:** `Σ(qty_bruta × avg_unit_cost)` sobre la receta por defecto.
- [ ] **Step 5 — `ProductMargin`:** food cost contra **`precio / 1.16`** (D7). Devuelve
      `{ costo, precioSinIva, foodCostPct, margen, bajoElMinimo }`.
- [ ] **Step 6 — tests que blindan las trampas:**
      - **El yield SÍ se aplica** — insumo `Corte de res CON HUESO` (yield **0.80**): 3 kg / $150 →
        $0.05/g. Receta 500 g **netos** → **625 g brutos** → **$31.25**.
        *(Si da $25.00, el yield no se aplicó y el costo miente hacia abajo.)*
      - ⚠️ **El yield NO se aplica** — insumo `Carne MOLIDA` (yield **1.00**): 130 g netos → **130 g brutos**
        → **$16.90** (a $0.130/g, PROFECO).
        ***(Si da $21.13, alguien le metió un yield del 80 % a la molida — que NO TIENE HUESO. Este test es
        el que atrapa el error que este plan cometió.)***
      - CPP con `stock = 0` → **no explota, congela el promedio**.
      - Aceite $37/L → $0.037/ml. 15 ml → **$0.555 → $0.56**. *(Con 2 decimales por ml daría $0.60: 7 % de error.)*
      - Margen con precio **$65 IVA incluido** → base `$56.03`, **no** `$65`.

### Task 3: Dominio — disponibilidad derivada
**Files:** `modules/inventory/domain/availability.ts`

- [ ] **Step 1 — la fórmula:**
      ```txt
      max_unidades = floor( MIN sobre insumos BASE con track_stock de ( stock_i / qty_bruta_i ) )
      ```
      **Solo los BASE** (`is_default && !is_customizable`). Si no hay lechuga, la hamburguesa **se sigue
      vendiendo sin lechuga** — bloquear una venta de $65 por falta de lechuga es peor negocio que servirla sin ella.
- [ ] **Step 2 — devolver CUÁL es el insumo limitante.** *"Te quedan 4 hamburguesas — te falta **pan**"*
      es accionable. *"4"* no lo es.
- [ ] **Step 3 — `is_available` sobrevive como INTERRUPTOR DE EMERGENCIA** del admin:
      ```txt
      disponible_efectivo = is_available (manual)  &&  max_unidades > 0 (derivado)
      ```
      El admin tiene que poder tumbar un producto **aunque haya insumos**.
- [ ] **Step 4 — ⚠️ la disponibilidad es una ESTIMACIÓN, no una reserva.** Si la hamburguesa y el combo
      comparten la carne, **cada uno reporta su máximo por separado** y no se pueden vender los dos.
      **La corrección real es descontar al aceptar** (Task 4), con el mismo patrón de concurrencia que ya
      existe. **Sin eso, dos clientes venden la misma última hamburguesa.**
- [ ] **Step 5:** un insumo agotado sale **"Agotado"** en la app y **no se puede incluir**.

### Task 4: Dominio — personalización y consumo de insumos
**Files:** Modify `modules/orders/domain/entities/Order.ts`,
`modules/orders/infrastructure/persistence/order.repository.ts`

- [ ] **Step 1:** `CreateOrderItemDto` gana `ingredientIds?: string[]` (**el conjunto FINAL de incluidos**)
      y `notes?: string` (máx. 200).
- [ ] **Step 2 — validación fail-closed (§1):** cada id **pertenece** a la receta · los **BASE no se pueden
      quitar** · un insumo `!available` **no se puede incluir**. Violación → `DomainError`.
- [ ] **Step 3 — SNAPSHOT (D3):** persistir `order_item_ingredients` con `name_snapshot`,
      **`qty_gross_snapshot`** y **`unit_cost_snapshot`**.
- [ ] **Step 4 — consumo:** **extender** el `StockEffect` que **ya existe**. Al aceptar
      (`pending → preparing`): por cada insumo incluido, `CONSUMO_VENTA` de `qty_bruta × cantidad`.
      Mismo SQL atómico (`GREATEST(0, stock − qty)`), **mismo orden global por id** (anti-deadlock),
      **misma transacción**. **No se inventa un mecanismo nuevo** (§42).
- [ ] **Step 5 — D5, la parte contraintuitiva:** al cancelar desde `ready` / `not_picked_up`, el **producto**
      se libera (re-ofertable, BR-006) pero **los insumos NO se devuelven: se registran como `MERMA`**.
      La carne ya está en la hamburguesa.
- [ ] **Step 6 — ⚠️ RIESGO ALTO:** este código **ya tuvo una regresión seria** (D-037: se perdieron los
      locks y el TOCTOU). **Escribir los tests de concurrencia ANTES de tocarlo.**
- [ ] **Step 7 — verificación:** aceptar "sin lechuga" → la lechuga **no** baja, el jitomate **sí** (y baja
      **273 g** de elote en mazorca por 150 g netos —el yield, aplicado donde SÍ va) · dos aceptaciones
      simultáneas → **una sola** baja · nunca negativo.

### Task 5: Backend — slice `modules/inventory/`
**Files:** Create `modules/inventory/{application,contracts,infrastructure,presentation}`

- [ ] **Step 1 — CRUD de insumos** (`@Roles(inventario, admin)` + `BranchScopeGuard`). Lectura para
      `cocina` y `mostrador`.
- [ ] **Step 2 — `POST /ingredients/:id/purchases`** — **el caso de tu ejemplo.** Recibe
      `{ qty: 3, unit: 'kg', factorToBase: 1000, totalCost: 150, expiresAt?, supplier? }` → crea el lote,
      **recalcula el CPP** y escribe el movimiento `COMPRA` — **todo en la misma transacción**.
- [ ] **Step 3 — `POST /ingredients/:id/waste`** — merma **incidental** con **motivo y responsable**.
- [ ] **Step 4 — `POST /ingredients/count`** — **toma de inventario física** → genera `AJUSTE_CONTEO` y
      **reporta la varianza** (teórico vs. real). **Se cuenta en unidad de conteo, no en la base**:
      nadie cuenta 2 400 gramos, cuenta **4 bolsas**.
- [ ] **Step 5 — `PUT /products/:id/ingredients`** — la receta (con `qty_net`).
- [ ] **Step 6 — `GET /inventory/margins`** — costo, food cost %, margen y **quién está bajo el mínimo**.
- [ ] **Step 7 — alertas:** stock bajo mínimo · caducidad próxima (FEFO) ·
      **producto que cayó bajo el margen mínimo porque SUBIÓ un costo** (D7 — la que salva dinero).

- [ ] **Step 8 — 📈 HISTÓRICO DE PRECIOS — *ya lo tienes gratis***
      > Usuario: *"sería bueno hacer esa comparativa, para saber qué ha subido o bajado de precio semana
      > tras semana, y de ahí cada mes histórico"*.

      **No hay que construir una tabla nueva.** `ingredient_purchases` (D1) **ya guarda, en cada compra**:
      `unit_cost` (congelado) + `purchased_at` + `supplier`.
      **Esa tabla YA ES el histórico de precios.** Es un efecto secundario gratis de haber puesto el factor
      de empaque en el lote y no en el insumo — y es la mejor justificación de esa decisión.

      | Endpoint | Qué devuelve |
      |---|---|
      | `GET /ingredients/:id/price-history?from&to` | La serie de `unit_cost` por compra, con **% de cambio** contra la compra anterior. |
      | `GET /inventory/price-report?period=week\|month` | **Qué subió y qué bajó** en el periodo, ordenado por impacto. |

      **El "impacto" NO es el % de cambio — es el % × lo que consumes.**
      *(Que la nuez suba 40 % da igual si gastas 5 g al mes. Que el pan suba 8 % sí duele.)*
      → `impacto = Δcosto_unitario × consumo_del_periodo`. **Ese es el orden correcto del reporte.**

- [ ] **Step 9 — alerta `IngredientPriceSpiked`:** una compra entra con un `unit_cost` **X % por encima del
      promedio vigente** (`app_settings.price_spike_pct`, default 15 %).
      **Es la que atrapa dos cosas distintas:** el proveedor que subió, **y el error de captura**
      (*"3 kg" tecleado como "3 g"* → el costo por gramo se dispara ×1000). Sin esta alerta, ese error
      **envenena el CPP en silencio** y todos los márgenes se van al piso sin explicación.

- [ ] **Step 10 — encadenar con D7:** una subida de precio **dispara el recálculo de márgenes** de todos
      los productos que usan ese insumo. Un aumento de la carne **le pega a la Hamburguesa Y al Combo**, y
      los dos deben avisar.

### Task 6: Semilla — **las "ramas" de los 10 productos**
**Files:** Modify `infra/postgres/seed-demo.sql`

- [ ] **Step 1 — insumos** con `base_unit`, `yield_pct`, `track_stock` y un lote inicial.
      Ejemplos con rendimiento real: carne con hueso **0.80** · lechuga (se quita el tronco) **0.85** ·
      jitomate **0.95** · sal/especias `track_stock = false`.
- [ ] **Step 2 — recetas** con **`qty_net` en unidad base** (no booleanos):
      *Hamburguesa: pan 1 pza · carne molida **130 g** (yield **1.00**) · queso 1 pza · lechuga 15 g
      (yield 0.85) · jitomate 30 g (0.95) · mayonesa 12 g…* — **las 10 recetas viven en
      [`docs/datos/recetas-e-insumos.md`](../../datos/recetas-e-insumos.md), no aquí.**
- [ ] **Step 3 — verificación:** **ningún producto sale con margen negativo**, y el costo de la
      Hamburguesa se calcula **desde el catálogo** (§4 de `recetas-e-insumos.md`), **no desde números
      inventados en este plan**.
      ⚠️ Los costos son **semilla de demo, plausible pero inventada** (§15 no-fabrication): se marcan como tal.

### Task 7: Frontend — personalizar
**Files:** `pages/product/ProductScreen.tsx`, `features/cart/model/cart.store.ts`,
`pages/admin/inventory/*`

- [ ] **Step 1 — ⚠️ EL CAMBIO MENOS OBVIO DE TODO EL PLAN.** Hoy `CartItem = { product, qty }` y `setQty`
      **indexa por `productId`**. Con personalización, **dos hamburguesas distintas ya NO son la misma
      línea**. `CartItem` necesita un **`lineId`** propio.
      *Es lo que más fácil rompe el carrito en silencio.*
- [ ] **Step 2:** UI de insumos: BASE bloqueados (visibles, no táctiles) · ESTÁNDAR encendidos ·
      EXTRA apagados · agotados en gris con **"Agotado"**.
- [ ] **Step 3:** campo de **nota** libre, con tu ejemplo de placeholder
      (*"no quiero ningún aderezo aunque haya seleccionado Mango Habanero"*).
- [ ] **Step 4 — panel de `inventario`:** insumos · **compras con lote y costo** · mermas · conteo físico ·
      **márgenes y ganancia** · alertas.

### Task 8: Verificación y cierre
- [ ] Matriz de la Task 4 Step 7 + Task 2 Step 6, con curls reales.
- [ ] Los **117 tests** verdes. Backend arranca con **0 errores de DI**. `tsc` 0.
- [ ] Agente de regresión (§22). **0 P0-P5.**
- [ ] ADR **D-050** (*costeo: CPP + yield + snapshot; disponibilidad derivada*) · CHANGELOG.

---

## Fuera de alcance (§46 — y por qué)

| Qué | Por qué no |
|---|---|
| **Sub-recetas** (la salsa es producto *y* insumo) | Explosión recursiva + detección de ciclos. No lo pediste. Se añade cuando exista la primera salsa que se prepare aparte. |
| **Órdenes de compra / recepción** (lo pedido ≠ lo recibido) | Aquí el lote **es** la recepción. |
| **Traspasos entre sucursales** | Existe multi-sucursal, pero no lo pediste. |
| **Múltiples proveedores con historial de precios** | El lote guarda `supplier` como texto. Suficiente para negociar; una tabla de proveedores es otra cosa. |
| **FIFO/FEFO como método de COSTEO** | FEFO se usa para **rotar físicamente** (alerta de caducidad). El **dinero** se cuenta con CPP (D2). |

## Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| **R1** | **Olvidar el `yield`** donde SÍ va (elote, aguacate, papa fresca, cortes con hueso) → el costo miente **hacia abajo, siempre**. | Test de la Task 2 Step 6 (corte con hueso): si da $25 en vez de $31.25, **falla**. |
| **R1-bis** | **APLICAR el `yield` donde NO va** (la carne **molida** no tiene hueso). *Este plan lo hizo.* | Test gemelo: la molida a 130 g debe dar **$16.90**, no $21.13. |
| **R2** | **Olvidar `track_stock`** → la sal reporta 0 hamburguesas **para siempre**. | Es el fallo #1 en la práctica. Test explícito. |
| **R3** | Tocar `applyStockDelta` **reintroduce la regresión D-037** (locks/TOCTOU). | Tests de concurrencia **antes** de tocarlo (Task 4 Step 6). |
| **R4** | El `lineId` del carrito rompe el carrito **en silencio**. | Test del carrito: dos hamburguesas con distinta personalización = **dos líneas**. |
| **R5** | Redondear el costo **por gramo** → centavos de deriva en cada plato, nunca cuadra. | `NUMERIC(14,6)` + **redondeo una sola vez, al final** (Task 2 Step 1). |
