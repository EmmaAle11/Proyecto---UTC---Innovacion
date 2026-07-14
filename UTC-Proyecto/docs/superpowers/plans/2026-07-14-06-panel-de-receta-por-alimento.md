# Plan 06 — Panel de receta por alimento (el sistema sugiere, el encargado corrige)

> **Sección 6.** Depende del **Plan 01** (rol `inventario`) y del **Plan 04** (el motor de costeo).
> Diseño en `specs/2026-07-14-motor-de-costeo-design.md`.
> Git lo ejecuta el usuario (§23). Rama: `feat/roles-e-insumos`.

**Goal:** Que el encargado de inventario abra un producto, vea **una receta ya sugerida** (insumos y
porciones), la **corrija con la realidad de su cocina**, y vea **al instante** cuánto gana — en venta normal
**y en reoferta**.

---

## La decisión que define este plan

> Usuario: *"no nos vamos a complicar, porque hacerlo de esta forma provoca que tengamos que hacerlo con
> cada producto"*.

**Exacto. Por eso NO se diseñan diez recetas a mano: se siembran diez sugerencias buenas y el encargado
las ajusta.**

```txt
EL SISTEMA SUGIERE          →   EL ENCARGADO CORRIGE        →   EL SISTEMA CALCULA
receta base sembrada            agrega / quita insumos          costo · food cost · ganancia
(investigada, realista)         sube / baja las porciones       normal · reoferta · si la tiras
```

**La receta sembrada es un punto de partida, no un dogma.** El encargado es quien sabe cuánta mayonesa le
pone de verdad.

---

## Lo que este panel resuelve (tus 4 puntos)

| # | Lo que pediste | Cómo se resuelve |
|---|---|---|
| **1** | *"Items involucrados sugeridos; el encargado puede añadir o quitar"* | Receta sembrada + buscador del catálogo de insumos + botón quitar. |
| **2** | *"Porción por item sugerida; el encargado puede ajustar"* | Campo editable, **en la unidad base del insumo** (que no elige — la hereda). |
| **3** | *"Ganancia total en venta normal, y la regla de reducción de merma en reoferta"* | Tres columnas: **normal · reoferta · si la tiras**. Ver §3 — **te corrijo el baseline**. |
| **4** | *"Definir unidades: no tendrá kg el agua"* | **Solo `g`, `ml`, `pza`.** `kg` y `L` son unidades de **compra**, no de medida. Ver §4. |

---

## §3 — La reoferta: **el baseline no es la venta normal, es la BASURA**

> Usuario: *"si antes le ganaba 20 pesos a la hamburguesa ahora le gano 15"*.

**Ese encuadre está mal, y el error cuesta comida.**

Cuando una hamburguesa **ya preparada** no se recoge, **los insumos ya se consumieron**. El costo está
**hundido**. La venta normal **ya ocurrió y fracasó** — por eso la hamburguesa sigue ahí.

**Las tres columnas que el panel DEBE mostrar.**
*(Ejemplo con la semilla actual: Hamburguesa 130 g, costo **$30.80**, precio $65, reoferta $50 — números
de [`recetas-e-insumos.md` §9](../../datos/recetas-e-insumos.md), **reproducibles con el script de §9.4**.)*

| | Venta normal | **Reoferta** | **Si la tiras** |
|---|---|---|---|
| Precio (con IVA) | $65.00 | $50.00 | — |
| Ingreso real (`÷ 1.16`) | $56.03 | $43.10 | $0.00 |
| Costo (**ya gastado**) | −$30.80 | −$30.80 | −$30.80 |
| **RESULTADO** | **+$25.23** | **+$12.30** | **−$30.80** |

> **La reoferta no te bajó la ganancia de $25 a $12. Te rescató de una PÉRDIDA de $30.80 y la convirtió en
> una GANANCIA de $12.30.** Un giro de **$43.10** — que es, exactamente, **todo el ingreso recuperado**
> (`$50 / 1.16`).

**Y eso cambia la regla de decisión.** Contra un costo hundido, **cualquier precio > $0 le gana a la
basura**. Si anclas el piso de la reoferta al costo, **tirarás hamburguesas que podías vender en $20**.

**El piso existe por OTRA razón: la canibalización.** Si la reoferta es muy barata y muy predecible, los
estudiantes **dejan de pedir a precio normal y esperan el descuento**. Eso destruye el negocio que sí paga.

```txt
piso_reoferta = max( costo × 1.16 ,  precio_normal × reoferta_piso_pct )
                     └─ no perder ─┘  └─ no enseñar al cliente a esperar ─┘
```

→ **`app_settings.reoferta_piso_pct` (default 0.60)** — ajuste **por cooperativa**.
→ **Advertencia, no bloqueo.** Mostrador puede bajar más, con **override registrado en el `audit-log`**.

**Y la métrica que hay que ponerle enfrente a mostrador:**
> **"Recuperaste $43.10 que se iban a la basura."**

**Si NO se re-oferta** (o la reoferta vence) → **MERMA TOTAL**: los insumos se registran como merma
incidental (motivo: *no recogido*) y se pierde el costo completo.

---

## §4 — Las unidades: **solo tres, y ninguna es kg**

```txt
UNIDADES BASE (las únicas permitidas):
   g     lo que se pesa     — carne, queso, lechuga, azúcar, jamaica, papa, salsas espesas
   ml    lo que se vierte   — aceite, leche, agua, vainilla
   pza   lo que se cuenta   — pan, tortilla, huevo, limón, vaso, rebanada
```

**Por qué la regla es más dura de lo que parece:**

- **Si permites `kg` Y `g`, un día alguien captura `0.5` pensando en kilos y el sistema entiende medio
  gramo.** La unidad base es **la báscula única de la cocina**.
- **`kg` y `L` son unidades de COMPRA**, no de medida. Viven en la **línea de compra**, con su
  `factor_a_base`: *"3 **kg**"* → `{ qty: 3, unit: 'kg', factor: 1000 }` → **3 000 g**.
- **La receta NO elige la unidad: la HEREDA del insumo.** La UI la muestra, no la deja escoger.
  → **Es imposible capturar "1 kg de agua".**

---

### Task 1: Backend — la receta como recurso editable
**Files:** `modules/inventory/presentation/recipes.controller.ts`, `application/recipes.service.ts`,
`contracts/recipe.ts`

- [ ] **Step 1 — `GET /products/:id/recipe`** → la receta con, por línea: insumo · `qty_net` ·
      **unidad base (del insumo)** · `yield` · clasificación (`BASE`/`ESTÁNDAR`/`EXTRA`) · `track_stock` ·
      **costo de la línea**. Más el bloque de rentabilidad (§3).
- [ ] **Step 2 — `PUT /products/:id/recipe`** (`@Roles(inventario, admin)` + `BranchScopeGuard`):
      reemplaza la receta completa. **Fail-closed (§1):** el insumo debe existir **y ser de la misma
      cooperativa** · `qty_net > 0` · la unidad **no se manda** (se deriva del insumo — si el cliente la
      manda, se ignora).
- [ ] **Step 3 — `GET /products/:id/profitability`** → las **tres columnas** de §3.
      **El cálculo vive en el DOMINIO** (`ProductMargin`), no en el controlador (BR-015).
- [ ] **Step 4 — validación del piso de reoferta:** al escribir `reoffer_price`, si queda bajo el piso →
      **advertencia + `requiresOverride: true`**, no un 400. Si se confirma, **al `audit-log`**.

### Task 2: Backend — la semilla de las 10 recetas
**Files:** `infra/postgres/seed-demo.sql`

- [ ] **Step 1 — el catálogo de insumos** (**55** rastreados + **13** con `track_stock = false` = **68**), cada uno con
      **unidad base**, **yield** y **costo por unidad base a 6 decimales**.
- [ ] **Step 2 — las 10 recetas** con las cantidades investigadas. Lo esencial:
      **Hamburguesa = 130 g de carne**, no 500. *(130 g crudos ≈ 105 g cocidos: una hamburguesa honesta a $65.)*
- [ ] **Step 3 — ⚠️ EL AGUA SÍ SE RASTREA (decisión del usuario, 2026-07-14).**
      > *"El inventarista tiene la **obligación** de llenar el stock de agua disponible."*

      `Agua purificada` = **`BASE` + `track_stock = true`**. Se captura por **garrafón** (unidad de compra;
      `factor_a_base = 20000` ml) y se descuenta por vaso.

      **Pero eso convierte las alertas en el seguro de vida del modelo, no en un adorno:**
      si el agua llega a **0**, se caen **CUATRO productos de golpe**: **Horchata · Jamaica · Esquites**
      (caldo de cocción) **· Gelatina**.
      *(El **Combo NO** lleva `Agua purificada`: lleva `Agua fresca del día`, otro insumo — que además
      **no tiene precio**, y por eso **el Combo no se puede costear**. Ver `recetas-e-insumos.md` §10.)*
      → **La Task 5 (alertas) deja de ser opcional.**
      ⚠️ *(Una versión decía "las TRES bebidas"; la corrección se pasó y dijo "CINCO". **Son CUATRO.**
      Una alerta que omite productos miente; una que sobra, también.)*

      **Dos salvaguardas que lo hacen seguro:**
      1. **Alerta de stock mínimo** (Task 5) — avisa **antes** de llegar a 0, no después.
      2. **El sistema dice CUÁL es el insumo limitante** (Plan 04, Task 3 Step 2): *"Agua de jamaica no
         disponible — falta **Agua purificada**"*. **Accionable, no misterioso.** El inventarista sabe
         exactamente qué capturar.

      **Siguen con `track_stock = false`** las especias, la sal, el hielo, los popotes y las servilletas:
      nadie las cuenta jamás, y ninguna es `BASE`.
- [ ] **Step 4 — marcar la semilla como semilla (§15 no-fabrication).** Los costos son **plausibles y de
      mercado, pero de DEMO**. El encargado los sustituye con sus compras reales. **Que el panel lo diga.**

### Task 3: Frontend — el panel (rol `inventario`)
**Files:** `pages/admin/inventory/RecipeScreen.tsx`, `features/inventory/*`

- [ ] **Step 1 — la tabla editable.** Por renglón:
      `insumo · neto · [unidad — FIJA, heredada] · yield · bruto (calculado) · $/u.base · costo · [quitar]`
      Y la **clasificación** como selector: `BASE` / `ESTÁNDAR` / `EXTRA`.
- [ ] **Step 2 — agregar insumo:** buscador sobre el catálogo de **su** cooperativa.
      **Al elegirlo, la unidad se fija sola.** El usuario **nunca** teclea "kg".
- [ ] **Step 3 — recalcular en vivo.** Mueves un gramaje → el costo, el food cost y las **tres columnas**
      se actualizan al instante. *(El backend es la verdad al guardar; esto es preview.)*
- [ ] **Step 4 — el semáforo de margen:**
      🟢 food cost ≤ 35 % · 🟡 35–45 % · 🔴 > 45 % (`app_settings.food_cost_max`, **por cooperativa** — una
      cooperativa escolar no es un restaurante).
      Y **el precio mínimo sugerido**: `(costo / food_cost_max) × 1.16`.
- [ ] **Step 5 — explicar el `BASE`.** Al marcar un insumo como `BASE`, decirle al usuario lo que significa:
      *"Si se acaba, este producto deja de venderse."* Es la consecuencia menos obvia de la pantalla.
- [ ] **Step 6 — las tres columnas de rentabilidad** (§3), con la frase que importa:
      **"Recuperas $43.10 que se iban a la basura."**

### Task 5: Alertas de inventario — **push, no un badge escondido**
**Files:** `modules/inventory/domain/inventory-alerts.ts`, `modules/notifications/*` (reusa el outbox),
`modules/inventory/application/inventory-alerts.scheduler.ts`

> Usuario: *"sería bueno implementar un diseño de alertas / notificaciones push sobre que el inventario
> se está acabando"*.
> **Y con el agua rastreada, esto ya no es un "sería bueno": es lo que impide que CUATRO productos se
> caigan sin aviso.**

- [ ] **Step 1 — REUSO (§42):** ya existe **todo** el aparato — `DomainEventDispatcher`, el **outbox**
      transaccional de `notifications`, el `notification-content.ts` y el push local del cliente.
      **No se construye un sistema de alertas nuevo: se emiten eventos de dominio nuevos.**
- [ ] **Step 2 — los 4 eventos:**
      | Evento | Cuándo | A quién |
      |---|---|---|
      | `IngredientBelowMinStock` | `stock ≤ min_stock` | **inventario** + admin |
      | `IngredientOutOfStock` | `stock = 0` | **inventario** + admin + **cocina** (deja de poder preparar) |
      | `ProductUnavailableByStock` | un `BASE` se agotó → el producto **sale del menú** | inventario + admin + **mostrador** |
      | `IngredientExpiringSoon` | la caducidad del lote (FEFO) está cerca | **inventario** |
- [ ] **Step 3 — el que salva dinero** (Plan 04, D7): `ProductBelowMinMargin` — **subió un costo y un
      producto quedó bajo el agua SIN QUE NADIE LO TOCARA.**
- [ ] **Step 4 — anti-spam.** El `UNIQUE(…)` + `ON CONFLICT DO NOTHING` del outbox **ya existe** y hace la
      de-duplicación. Una alerta por insumo y por umbral, **no una por venta**. *(Sin esto, cada pedido
      que baje el agua manda un push. El inventarista silencia la app en un día y las alertas dejan de
      existir — que es el fallo real de los sistemas de alertas.)*
- [ ] **Step 5 — el mensaje es ACCIONABLE, no informativo:**
      ```txt
      ❌ "Stock bajo de Agua purificada"
      ✅ "Agua purificada: quedan 2 garrafones (mínimo: 3).
          Sin ella se caen Horchata, Jamaica, Esquites y Gelatina."
      ```
- [ ] **Step 6 — verificación:** bajar el agua a 0 → llega **UNA** alerta (no 30) · **los 4 productos** salen
      del menú · el mensaje **nombra a los 4** · reponer stock → **vuelven solos**.

### Task 4: Verificación
- [ ] **Step 1 — la unidad no se puede romper:** intentar guardar una receta con `unit: 'kg'` → **se ignora
      y se usa la del insumo**. Intentar "1 kg de agua" → **imposible desde la UI**.
- [ ] **Step 2 — disponibilidad. ⚠️ EL test:** un insumo `BASE` **que SÍ se rastrea** en 0 → el producto
      **NO está disponible**, y el sistema **nombra al culpable**.
      **El caso canónico:** `Agua purificada` (`BASE` + **`track_stock = true`**) en 0 → **se caen CINCO
      productos**: Horchata, Jamaica, Combo, **Esquites** y **Gelatina**.
      Y un `BASE` **que NO se rastrea** (no queda ninguno tras la corrección) **nunca** bloquearía.
      *(Una versión anterior de este Step exigía **exactamente lo contrario** de lo que siembra el Step 3
      de la Task 2 — se contradecía a sí mismo dentro del mismo archivo. §40.)*
- [ ] **Step 3 — reoferta:** el panel muestra que a $50 se gana **más** que tirándola, y **avisa** si el
      precio queda bajo el piso.
- [ ] **Step 4 — snapshot:** cambiar la receta **después** de un pedido → **el costo del pedido viejo NO
      cambia** (D3 del Plan 04).
- [ ] **Step 5:** `tsc` 0 · los **117 tests** verdes · agente de regresión (§22) · **0 P0-P5**.

---

## ⚠️ Dos precios que el sistema va a marcar en rojo el día 1

**Y eso es señal de que funciona, no de que falla.** No los "arreglo" yo: son decisiones de negocio tuyas.

| Producto | El problema |
|---|---|
| **Combo estudiante — $50** | Hamburguesa sencilla + papas + agua + empaques. El food cost parece rondar el **65–70 %**. Las palancas: bajar la carne, sacar el queso a `EXTRA`, o **subir el combo a $60**. |
| **Papas con queso — $32** vs **Papas a la francesa — $28** | **$4 de diferencia no pagan 40 g de queso cheddar líquido.** El producto "premium" **gana menos** que su hermano simple. Sugerencia: **$35**, o bajar el queso a 30 g. |

*(Confirmar con los precios reales de compra de la cooperativa — los sembrados son de mercado, pero de demo.)*

---

## Fuera de alcance

**Sub-recetas** (la tinga y el agua fresca se modelan **aplanadas**: sus componentes son insumos directos,
para que el encargado ajuste el pollo sin tocar una sub-receta). Se añaden cuando exista la primera salsa
que de verdad se prepare y almacene aparte. · **Recetas versionadas** (`recipe_version_id`) — el
`qty_gross_snapshot` ya congela la cantidad del pedido. · **Escalado por lote** (la gelatina se cuaja en
molde de 3 L y se corta en 20; aquí se siembra **ya dividido entre 20**).
