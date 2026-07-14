# Roles de cooperativa · Insumos con stock · Efectivo con desglose — Design

**Fecha:** 2026-07-14
**Estado:** **APROBADO en brainstorming — pero ⚠️ SUPERADO EN PARTE.**

> 🚨 **AVISO (auditoría 2026-07-14).** Este spec fue el primero de la tanda, y **su modelo de insumos quedó
> obsoleto** al plantear el usuario su ejemplo de la carne. **En caso de conflicto, MANDA el plan, no este
> spec.**
>
> | Tema | Lo que este spec dice | **Lo que MANDA** |
> |---|---|---|
> | **Modelo de insumos** | Receta = 2 booleanos, 3 tablas, sin cantidad ni rendimiento | **Plan 04** — `qty_net` · `yield_pct` · `track_stock` · `iva_rate` · **5 tablas** (+ lotes y ledger) |
> | **Cancelar tras cocinar** | *"se **devuelve** el insumo"* | **Plan 04 (D5)** — **NO se devuelve: es MERMA.** La carne ya está en la hamburguesa. |
> | **Claves CFDI** | `50192700` · `H87` | **Plan 05** — **`90101500`** (*Establecimientos para comer y beber*) · **`E48`** (*Unidad de servicio*), que es lo que sugiere el SAT |
> | **Reoferta** | aparece **dos veces** en la matriz, con dueños distintos | **`mostrador`** (movida desde `admin`) |
**Sustituye a:** `docs/arquitectura/roles-y-accesos.md` (borrador previo, eliminado).

## Los planes (uno por sección)

| Plan | Sección | Depende de |
|---|---|---|
| [`01-cimientos-roles-y-alcance`](../plans/2026-07-14-01-cimientos-roles-y-alcance.md) | Roles v2 · tabla `branches` · `BranchScopeGuard`. **Cierra el único bug de seguridad real.** | — |
| [`02-ssot`](../plans/2026-07-14-02-ssot.md) | Single Source of Truth. **25 duplicaciones** verificadas. | 01 |
| [`03-rls`](../plans/2026-07-14-03-rls.md) | Row Level Security. **Hoy sería un no-op — está PROBADO.** | 01 |
| [`04-inventario-costeo`](../plans/2026-07-14-04-inventario-costeo.md) | Materia prima · CPP · **yield** · disponibilidad derivada · ganancia · personalización. | 01 |
| [`05-efectivo-caja-ticket-cfdi`](../plans/2026-07-14-05-efectivo-caja-ticket-cfdi.md) | Efectivo con desglose · **caja y corte** · ticket · **layout CFDI**. | 01, 04 |
| [`06-panel-de-receta-por-alimento`](../plans/2026-07-14-06-panel-de-receta-por-alimento.md) | Panel de receta (el sistema sugiere, el encargado corrige) · reoferta · **alertas de inventario**. | 01, 04 |

**Specs de apoyo:** [`motor-de-costeo-design`](2026-07-14-motor-de-costeo-design.md) (la fórmula) ·
[`producto-terminado-design`](2026-07-14-producto-terminado-design.md) (**⚠️ el agujero que la auditoría
destapó — dos bugs YA EN PRODUCCIÓN**).

---

## ⚠️ Los 4 hallazgos que cambiaron el diseño (§0 — verificados, no supuestos)

### 1. **RLS, hoy, sería teatro.** Lo probé contra tu base.
`ENABLE ROW LEVEL SECURITY` + `FORCE` + la política más restrictiva que existe (`USING (false)`, "nadie ve
nada") → **la app siguió viendo todas las filas**. Porque `UTC_PROJECT` es **superusuario**, tiene
**`BYPASSRLS`**, es **dueño de las tablas** y es **el único rol de la base** — y con él se conecta el backend
*y* corren las migraciones. **Postgres no aplica RLS a un superusuario. Ni con `FORCE`.**
→ **Plan 03**: primero quitarle el superusuario a la app; *entonces* las políticas.

### 2. **El costo de tu hamburguesa está mal — y el error va SIEMPRE hacia abajo.**
3 kg de carne **con hueso** no dan 3 kg útiles: dan ~2.4 kg. Ese **rendimiento (yield) del 80 %** significa
que para poner **500 g netos** hay que sacar **625 g brutos** de la alacena:
`625 × $0.05 = **$31.25**`, no $25. Sin modelarlo: **crees que ganas más de lo que ganas**, y el inventario
**"se pierde" solo**. → **Plan 04**.

### 3. **Hay IVA del 16 %, y hoy no existe en el sistema.**
LIVA art. 2-A: la comida **preparada** causa **16 %** — **"para llevar" no te salva**. El precio de menú
(con IVA incluido) obliga a calcular el margen contra `precio / 1.16`. Calcularlo contra el precio bruto
**infla el margen ~16 puntos**. → **Plan 05**.

### 4. **El cliente decide a qué cocina va su pedido, y el backend le cree.**
`branchId`/`branchName` son **texto libre** en el DTO. **No hay tabla `branches`.** Un cliente puede mandar
`branchId: "xyz"`: el pedido **se cobra, se guarda, y ninguna cocina lo ve jamás**. → **Plan 01**.

---

## 1. Objetivo

Tres cosas que el usuario pidió y que resultan ser **una sola**:

1. Un **árbol jerárquico de accesos** al panel de la cooperativa: 3 personas + el administrador.
2. **Efectivo con desglose**: el cliente declara con qué billetes y monedas paga; eso aparece en el
   ticket del cliente **y** en el panel.
3. **Personalización de productos**: quitar/poner insumos + notas. Cada insumo tiene **stock**.

Son una sola porque **(2) y (3) no tienen dueño sin (1)**: el desglose del efectivo lo cobra
*mostrador*, y los insumos con costo los lleva *inventario*. Construir 2 y 3 sobre los 2 roles de hoy
significa construirlos dos veces.

---

## 2. Estado verificado del sistema (§0 — evidence-or-block)

Lo que **existe hoy**, verificado leyendo el código, no supuesto:

| Pieza | Realidad |
|---|---|
| Roles | **Solo `admin` y `user`** (`domain/enums.ts`). Keycloak asigna `admin` en `seed-admin.sh`. |
| Alcance por cooperativa | **NO EXISTE.** `user_profile` **no tiene** `branch_id`. |
| Pedidos | `orders.branch_id` / `branch_name` **sí** existen (texto libre, sin FK). |
| Cooperativas | Solo config del frontend: `entities/branch/branches.ts` → `cdmx-tlalpan`, `cdmx-coyoacan`, `cdmx-roma`. **No hay tabla `branches`.** |
| `GET /orders/all?branchId=X` | Acepta **cualquier** `branchId` del query string. |
| `app_settings` | **Fila única** (`@Check("id" = 1)`). Umbrales del semáforo **globales**. |
| Efectivo | `PaymentMethod.EFECTIVO` existe; el pago queda `PaymentStatus.PENDING` y **no pasa por pasarela** (BR-009). No hay desglose, ni cambio, ni registro de cobro. |
| Insumos | **No existen.** `products` tiene `stock`, pero es stock del **producto terminado**. |
| Personalización | **No existe.** `order_items` es `{producto, cantidad, precio, subtotal}`. Sin notas. |
| Stock | Se mueve **solo en las transiciones** (`reserve` al aceptar, `release` al cancelar / no recoger). La creación del pedido **no toca stock**. `GREATEST(0, …)` impide negativos (BR-011). |
| Reuso disponible | `shared/ui/QtyStepper.tsx` (− N +) · `Money`/`Quantity` VOs · `DomainEventDispatcher` · `CircuitBreaker`. |

### 2.1 Dos fugas que el modelo nuevo **obliga** a cerrar

Con **un** administrador, estas dos no molestaban. Con **un administrador por zona**, son defectos:

- **BOLA / IDOR (OWASP A01).** `GET /orders/all?branchId=X` autoriza con un dato que **manda el cliente**.
  El mostrador de Roma puede leer, cobrar y cerrar los pedidos de Tlalpan cambiando la URL.
- **Ajustes globales.** `app_settings` es fila única: el admin de Roma le movería el semáforo a Tlalpan.

---

## 3. Decisión 1 — El modelo de roles

### 3.1 Los dos ejes del permiso

El permiso deja de ser una pregunta y pasa a ser dos. El backend responde **las dos** en cada petición
(§5: *el frontend puede ocultar botones, pero el backend SIEMPRE valida*):

```txt
1. ¿QUÉ PUEDES HACER?   → el ROL           (user · cocina · inventario · mostrador · admin)
2. ¿SOBRE QUÉ?          → la COOPERATIVA   (branch_id)
```

**Regla dura:** todo rol de cooperativa está anclado a **exactamente una** `branch_id`. El `branchId`
**jamás** se lee del query string para autorizar: sale del **JWT**. El query solo puede *filtrar dentro*
de lo que el token ya permite.

### 3.2 El árbol

```txt
PLATAFORMA UTC PICK SAZÓN
│
├── 👤 user — Cliente (@edu.utc.mx) ................... alcance: TODA la plataforma
│   │   Se auto-registra. Elige en qué cooperativa recoge.
│   └── App cliente
│       ├── Inicio / Catálogo
│       ├── Producto ............. personalizar insumos (✓/✗) + nota          ← NUEVO
│       ├── Carrito / Checkout ... si paga EFECTIVO, declara con qué
│       │                          billetes y monedas                          ← NUEVO
│       ├── Ticket / Seguimiento . su código, su estado, su desglose
│       ├── Pedidos .............. SOLO los suyos (BR-014)
│       └── Perfil / Cartera
│       ⛔ NUNCA: pedidos ajenos · estados internos · costos
│
└── 🏪 COOPERATIVA  (una por zona: cdmx-tlalpan · cdmx-coyoacan · cdmx-roma)
    │   Todo rol de aquí abajo está ANCLADO a UNA cooperativa (branch_id en el JWT).
    │
    ├── 🍳 cocina — Cocinero/a          [persona 1: COCINAR]
    │   └── Panel · TABLERO DE PRODUCCIÓN (KDS)
    │       ├── Qué preparar ..... ítems, cantidades, SIN-lechuga / SIN-jitomate, NOTAS
    │       ├── ACEPTA ........... pending → preparing   ← la producción es SUYA
    │       ├── TERMINA .......... preparing → ready     ← es quien SABE que ya salió
    │       ├── Orden de trabajo . prioridad (programados primero, BR-004)
    │       └── Insumos .......... 👁 solo lectura (qué hay / qué se acabó)
    │       ⛔ NUNCA: dinero, precios, costos, márgenes, métricas
    │       ⛔ NUNCA: nombre ni correo del cliente (BR-014) — solo el código #U-00042
    │
    ├── 📦 inventario — Admin de stock  [persona 2: STOCK / COSTOS / GANANCIAS]
    │   └── Panel · INVENTARIO
    │       ├── Materia prima .... alta / baja / editar · stock · mín / máx
    │       ├── COMPRAS .......... "3 kg de carne, $150"  → lote + costo + caducidad  ← NUEVO
    │       ├── Costos ........... CPP por unidad base ($0.05/g) + RENDIMIENTO (yield) ← NUEVO
    │       ├── Recetas .......... cuánto gasta cada producto ("las ramas": 500 g)     ← NUEVO
    │       ├── Mermas ........... lo que se cayó / caducó, con motivo y responsable   ← NUEVO
    │       ├── Conteo físico .... → ajuste + VARIANZA (teórico vs. real)              ← NUEVO
    │       └── Margen ........... food cost % vs. precio SIN IVA → GANANCIA           ← NUEVO
    │       ✱ El sistema DERIVA del stock qué productos se pueden vender.
    │       ⛔ NUNCA: cambiar estados · cobrar · fijar el precio de VENTA
    │
    ├── 💵 mostrador — Administración   [persona 3: COBRO · CAJA · ENTREGA · FACTURAS]
    │   └── Panel · MOSTRADOR
    │       ├── Cobro en efectivo . ve el desglose declarado (2×$50 + 2×$20 + 2×$5)
    │       │                       y LAS PIEZAS DEL CAMBIO a dar                ← NUEVO
    │       ├── CAJA .............. abre el día con el FONDO · registra los
    │       │                       billetes y monedas · CIERRA con CORTE        ← NUEVO
    │       ├── Entrega ........... ready → picked_up / not_picked_up
    │       ├── REOFERTA .......... "pon tu precio" a lo que no se recogió (BR-006) ← MOVIDO de admin
    │       ├── Facturas .......... LAYOUT para timbrar el CFDI real             ← NUEVO
    │       └── Ganancia .......... la registra al cerrar el día                 ← NUEVO
    │       👁 VE EL TICKET COMPLETO: total, método, desglose, cliente.
    │       ⛔ NUNCA: editar el menú · fijar precios de lista · costos · márgenes
    │       ⛔ NUNCA: aceptar ni marcar listo (eso es de cocina, que es quien sabe)
    │
    └── 🛡️ admin — Administrador de ESA cooperativa
        └── Panel COMPLETO (superconjunto de los tres)
            ├── Dashboard ....... semáforo · ingresos · métricas · hora pico
            ├── Cola ............ todo lo de cocina + mostrador
            ├── Menú ............ crear/editar productos · PRECIOS · reoferta
            ├── Inventario ...... todo lo de inventario
            ├── Personalización . umbrales del semáforo · horario  (POR SU COOP)
            └── Personal ........ da de alta cocina / inventario / mostrador     ← NUEVO
            ⛔ NUNCA: tocar OTRA cooperativa
```

**No hay super-admin en la app.** Crear cooperativas y dar de alta administradores se queda en la
**consola de Keycloak** (`kcadmin`), fuera de la aplicación. Es deliberado: un rol capaz de leer todas
las cooperativas es superficie de ataque que el proyecto no necesita (§46 YAGNI).

### 3.3 Matriz de permisos — la verdad que el backend hace cumplir

`✅` permitido · `👁` solo lectura · `❌` 403 · `—` no aplica · 🆕 endpoint nuevo

| Acción | Endpoint | user | cocina | inventario | mostrador | admin |
|---|---|:--:|:--:|:--:|:--:|:--:|
| Ver catálogo | `GET /products` | ✅ | 👁 | 👁 | 👁 | ✅ |
| Ver producto + sus insumos | `GET /products/:id` 🆕 | ✅ | ✅ | ✅ | ✅ | ✅ |
| Crear pedido (personalizado) | `POST /orders` | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver **sus** pedidos | `GET /orders` | ✅ | — | — | — | — |
| Cancelar / extender el **suyo** | `PATCH /orders/:id/cancel\|extend` | ✅ | ❌ | ❌ | ❌ | ❌ |
| Ver la cola **de su coop** | `GET /orders/all` | ❌ | ✅ | ❌ | ✅ | ✅ |
| Ver **dinero** en la cola | (campos de la respuesta) | — | ❌ | ❌ | ✅ | ✅ |
| Ver **cliente** (nombre/correo) | (campos de la respuesta) | — | ❌ BR-014 | ❌ | ✅ | ✅ |
| Ver personalización + notas | (campos de la respuesta) | ✅ | ✅ | ❌ | ✅ | ✅ |
| **Aceptar** `pending → preparing` | `PATCH /orders/:id/status` | ❌ | **✅** | ❌ | ❌ | ✅ |
| **Terminar** `preparing → ready` | `PATCH /orders/:id/status` | ❌ | **✅** | ❌ | ❌ | ✅ |
| Entregar `ready → picked_up \| not_picked_up` | `PATCH /orders/:id/status` | ❌ | ❌ | ❌ | ✅ | ✅ |
| **Reoferta** "pon tu precio" (BR-006) | `PATCH /products/:id` | ❌ | ❌ | ❌ | **✅** | ✅ |
| Registrar **ganancia** del día | `POST /cash-sessions/:id/close` 🆕 | ❌ | ❌ | 👁 | **✅** | ✅ |
| **Compras** de materia prima + **costos** | `POST /ingredients/:id/purchases` 🆕 | ❌ | ❌ | **✅** | ❌ | ✅ |
| **Mermas** y **conteo físico** | `…/waste`, `…/count` 🆕 | ❌ | ❌ | **✅** | ❌ | ✅ |
| **Abrir / cerrar caja** (corte) | `POST /cash-sessions`, `…/close` 🆕 | ❌ | ❌ | ❌ | ✅ | ✅ |
| Registrar cobro efectivo + cambio | `PATCH /orders/:id/cash` 🆕 | ❌ | ❌ | ❌ | ✅ | ✅ |
| Generar **layout de factura** (CFDI) | `POST /orders/:id/invoice-layout` 🆕 | ❌ | ❌ | ❌ | ✅ | ✅ |
| Ver insumos y stock | `GET /ingredients` 🆕 | ❌ | 👁 | ✅ | 👁 | ✅ |
| Alta / edición de insumo | `POST\|PATCH /ingredients` 🆕 | ❌ | ❌ | ✅ | ❌ | ✅ |
| Ver / editar **costos** y márgenes | `…/ingredients`, `…/margin` 🆕 | ❌ | ❌ | ✅ | ❌ | ✅ |
| Editar la **receta** de un producto | `PUT /products/:id/ingredients` 🆕 | ❌ | ❌ | ✅ | ❌ | ✅ |
| Crear / editar producto y **precio** | `POST\|PATCH /products` | ❌ | ❌ | ❌ | ❌ | ✅ |
| ~~Reoferta "pon tu precio"~~ *(renglón OBSOLETO — ver arriba: es de **mostrador**)* | `PATCH /products/:id` | ❌ | ❌ | ❌ | **✅** | ✅ |
| Dashboard (ingresos, métricas) | `GET /orders/metrics` | ❌ | ❌ | 👁 costos | ❌ | ✅ |
| Umbrales / horario **de su coop** | `GET\|PATCH /settings/*` | 👁 | ❌ | ❌ | ❌ | ✅ |
| Alta de personal de su coop | `POST /staff` 🆕 | ❌ | ❌ | ❌ | ❌ | ✅ |

### 3.4 Quién mueve qué estado — **la línea que separa a cocina de mostrador**

> Usuario (2026-07-14): *"Este ticket lo verá la persona que administre el cambio, pedidos, entrega y
> facturas, por lo cual ella sí tiene que verlo."* · *"**¿ready?** → cocina, **y lo ve mostrador**."*

> Usuario (2026-07-14): *"Cocinero / **Cocina y acepta - termina ordenes**"* ·
> *"Administración / **Recibe y da cambio efectivo, entrega pedidos, re oferta alimentos, llena layout para
> factura CFDI, registra ganancia**"*.

```txt
pending ──► preparing        COCINA      ACEPTA la orden  ← la producción es suya
preparing ──► ready          COCINA      la TERMINA       ← es quien SABE que ya salió
ready ──► picked_up          MOSTRADOR   entrega, cobra, da cambio
ready ──► not_picked_up      MOSTRADOR   nadie pasó por él
pending ──► cancelled        EL CLIENTE  (ya existe, BR-004)
```

La división no es burocracia: **cada transición la dispara quien tiene la información**.
**Cocina es dueña de la producción de punta a punta** — acepta y termina. **Mostrador es dueño del
mostrador**: el dinero, la caja, la entrega y la factura. El cocinero es el único que sabe que la
hamburguesa salió; el de mostrador es el único que sabe que el cliente ya está enfrente con el dinero.

Que cocina marque `ready` y **aparezca en la cola de mostrador** es el traspaso: la orden fluye entre los
dos **sin que nadie grite**.

- **Mostrador VE EL TICKET COMPLETO** — total, método, desglose del efectivo, cliente. Sin eso no cobra.
- **Cocina es un KDS**: ve qué cocinar y avisa que está. No maneja la orden como documento comercial.

### 3.5 Una persona = un rol

> Usuario: *"1 = Cocina · 1 = Stock/Ganancias · 1 = Cobro (efectivo) / llenar datos diarios de caja /
> entregar pedidos / layout para facturas"*.

**Tres personas, tres roles, sin solape.** Keycloak permite arreglos de roles, pero **no lo usamos**: un
humano tiene exactamente un rol de cooperativa (§46 YAGNI). Esto además hace que el **corte de caja**
tenga un responsable inequívoco — si dos personas pudieran cobrar en la misma sesión, el faltante no
tendría dueño.

### 3.6 El *shape* de la respuesta depende del rol

Ocultar campos en la app **no es seguridad**. `GET /orders/all` devuelve un DTO distinto por rol:

```txt
KitchenOrderResponse  (cocina)      → id, code, status, scheduledFor, items[{name, qty,
                                       removed[], added[], notes}]
                                      SIN total · SIN payment · SIN customer · SIN email

CounterOrderResponse  (mostrador)   → todo lo anterior + total, payment{method,status},
                                       cashTender{pieces[], tendered, change}, customer, email

AdminOrderResponse    (admin)       → CounterOrderResponse  (mismo shape)
```

---

## 4. Decisión 2 — Efectivo con desglose y **límites**

### 4.1 El Value Object

`CashTender`, en el dominio de `orders` (junto a `Money` y `Quantity`, que ya existen):

```txt
CashTender = lista de piezas { kind: 'billete'|'moneda', value, count }
```

**Denominaciones válidas (MXN real).** El arte es "UTC Pesos" (Universidad Tres Culturas); el **valor**
es peso mexicano, porque quien está en mostrador tiene que **cuadrar la caja**:

```txt
monedas:  $0.50 · $1 · $2 · $5 · $10 · $20
billetes: $20 · $50 · $100 · $200 · $500 · $1000
```
> Ojo: **$20 existe como billete Y como moneda**. La llave es `kind + value`, no solo `value`.

### 4.2 La política (`CashPolicy`) — reglas fail-closed (§1)

Parámetro configurable, **por cooperativa**, en `app_settings`:

| Parámetro | Default | Qué es |
|---|---|---|
| `cash_max_change` | **$500.00** | Tope del cambio que la cooperativa acepta devolver. |
| `cash_max_pieces` | **40** | Tope de piezas totales (evita payloads absurdos). |

| # | Regla | Si falla |
|---|---|---|
| R1 | Cada pieza es una denominación válida de la tabla. | `DomainError` |
| R2 | `count` entero ≥ 1. `Σ count ≤ cash_max_pieces`. | `DomainError` |
| R3 | **Alcanza:** `entregado ≥ total`. | `DomainError` — "no alcanza" |
| R4 | **No excede el tope:** `entregado − total ≤ cash_max_change`. | `DomainError` — "cambio excesivo" |
| R5 | Si `payMethod ≠ efectivo` y viene `cashTender` → rechazar. | `DomainError` |
| R6 | Si `payMethod = efectivo`, el `cashTender` es **obligatorio**. | `DomainError` |
| R7 | **El cambio lo calcula el BACKEND** (`change = entregado − total`). La app solo lo muestra. | BR-015 |

**R4 es la regla que pediste**, y es la que resuelve *"para un pedido de $150 no podemos recibir 2
billetes de $500"*: 2×$500 = $1000, cambio $850 > $500 → **rechazado**.

### 4.3 El "mapeo" de límites = **una fórmula, un dueño**

El front necesita **apagar** las denominaciones imposibles; el backend necesita **rechazarlas**. Si el
número vive en los dos lados, se desincronizan. Así que:

```txt
FUENTE ÚNICA:  GET /settings/cash  →  { denominations: [...], maxChange: 500, maxPieces: 40 }
```

- **El front la consume** y deshabilita en vivo. Una pieza de valor `d` se apaga cuando añadirla
  rompería R4:

  ```txt
  deshabilitar d   ⟺   (entregado + d) − total > maxChange
  ```

  Para un pedido de **$148** con tope $500: el billete de **$1000 nace apagado** (1000 − 148 = 852 > 500).
  El de $500 **sí** entra (500 − 148 = 352 ≤ 500). Y conforme el cliente va sumando, se van apagando más.
  Eso es "mapeado", y es **dinámico**, no una lista fija.

- **El backend revalida** el `CashTender` completo con las mismas reglas. El front es **UX**; el backend
  es la **verdad** (§5, BR-015). Nunca se confía en el cliente.

### 4.4 La CAJA — el tope es media respuesta, no la respuesta

> Decisión del usuario (2026-07-14): *"Tienes razón lo haremos así. **La misma persona debe de registrar
> los billetes / monedas.**"* → **La caja ENTRA al alcance.** Mostrador lleva el inventario del cajón.

El tope de $500 responde *"¿el cambio es razonable?"*. La pregunta que de verdad importa es
**"¿la caja tiene con qué darlo?"**. Son dos preguntas distintas y se contestan **en momentos distintos**:

| Momento | Quién | Qué se sabe | Qué se valida |
|---|---|---|---|
| **Al hacer el pedido** | el cliente, en su teléfono | La caja **del futuro** es desconocida (el pedido se recoge en 20 min). | Solo la **heurística**: R1–R6, con el tope `cash_max_change`. |
| **Al cobrar** | mostrador, con el cajón enfrente | La caja **real**, pieza por pieza. | **La verdad**: ¿el cambio es *construible* con lo que hay? |

Por eso **conviven los dos mecanismos**, y no se pisan.

#### 4.4.1 Sesión de caja

```txt
ABRIR   → mostrador declara el FONDO: cuántas piezas de cada denominación hay al empezar el día.
COBRAR  → las piezas que entrega el cliente ENTRAN al cajón; las del cambio SALEN.
CERRAR  → mostrador CUENTA el cajón. El sistema compara contra lo esperado → FALTANTE / SOBRANTE.
```

- Una sesión por **cooperativa** y **día hábil** (`business_day`). Solo una abierta a la vez.
- **No se puede cobrar en efectivo sin una sesión abierta** (§1 fail-closed).
- El cierre es un **corte de caja** real: `esperado = fondo + Σentradas − Σsalidas`; `diferencia = contado − esperado`.
  La diferencia **no se corrige sola**: se registra y queda auditable (ya existe `audit-log`).

#### 4.4.2 `ChangeMaker` — dar cambio con inventario **limitado**

El botón "Pago exacto" del cliente usa un **voraz** y basta: el sistema MXN es *canónico*, así que el
voraz da el óptimo **cuando hay piezas infinitas**. **La caja no tiene piezas infinitas.**

Con inventario acotado, el voraz **falla** (puede tener $500 en billetes de $200 y no poder dar $100).
El cambio con existencias limitadas es el problema de la **mochila acotada** → **programación dinámica**
sobre el monto en centavos. Como el monto está topado por `cash_max_change` ($500 = 50 000 centavos) y
hay 12 denominaciones, la DP es **trivial y rápida**.

```txt
ChangeMaker.make(cambio, cajón)  →  piezas[]   |   null  ("no se puede dar exacto")
```

Si devuelve `null`, mostrador lo ve **antes** de tomar el billete: *"No puedo dar $352 con lo que hay.
¿Tienes $150 exactos?"*. Eso es lo que el tope de $500, solo, nunca podría contestar.

#### 4.4.3 Lo que sigue fuera (honestidad, §40)
Multi-turno / multi-cajero en la misma sesión, retiros parciales a bóveda, y arqueos intermedios.
Una sesión = un día = una persona.

### 4.5 Riesgo detectado: **precios que no se pueden pagar en efectivo**

La moneda más chica es **$0.50**. Si un producto costara `$65.25`, el cambio exacto sería
**imposible de dar**. Hoy los 10 productos sembrados tienen precios enteros, así que no explota — pero
nada lo impide.

**Propuesta:** un `CHECK` en `products.price` (y en `reoffer_price`) que exija **múltiplos de $0.50**.
Una línea de SQL que hace imposible el bug. → **decisión abierta §10.4.**

### 4.6 UX del selector en móvil (corrige el clic derecho)

El prototipo web usaba clic izquierdo/derecho. **En un teléfono no existe el clic derecho.** Reemplazo:

| Interacción | Qué hace |
|---|---|
| **Tocar la pieza** | +1. El badge sube. |
| **Burbuja `−`** en la esquina opuesta, visible solo con `count ≥ 1` | −1. Sin gestos ocultos. |
| **Botón "Pago exacto"** | Arma solo el desglose **con menos piezas** que cubra el total (voraz sobre las denominaciones; el sistema MXN es canónico, así que el voraz da el óptimo). **Un toque y listo.** |
| **Botón "Limpiar"** | Todo a 0. |
| Pieza deshabilitada (R4) | Opaca, no táctil, con el motivo: *"Excede el cambio máximo ($500)"*. |

**Reuso (ponytail / §42):** `shared/ui/QtyStepper.tsx` (− N +) **ya existe**. Alternativa a la burbuja:
un `QtyStepper` bajo cada denominación. Es más explícito, pero con 12 denominaciones ocupa el doble de
alto. → Propongo **tap + burbuja `−` + "Pago exacto"**; el `QtyStepper` queda como plan B.

---

## 5. Decisión 3 — Insumos, recetas y personalización

### 5.1 Modelo de datos (3 tablas nuevas)

| Tabla | Qué es | Columnas clave |
|---|---|---|
| `ingredients` | **El insumo.** La lechuga, la mayonesa, el aderezo mango habanero. | `id` · `branch_id` · `name` · `unit` · `stock` · `min_stock` · `max_stock` · **`unit_cost`** · `is_active` |
| `product_ingredients` | **La receta** — "las ramas" de cada producto. | `product_id` · `ingredient_id` · **`is_default`** (viene por defecto) · **`is_customizable`** (el cliente puede tocarlo) |
| `order_item_ingredients` | **El snapshot** de lo que el cliente eligió, con el nombre **congelado**. | `order_item_id` · `ingredient_id` · `name_snapshot` · `included` |

Los dos booleanos de la receta expresan las tres clases de insumo, sin inventar una máquina de estados:

```txt
is_default=true,  is_customizable=false  →  BASE.     El pan, la carne. Se muestra, no se quita.
is_default=true,  is_customizable=true   →  ESTÁNDAR. La lechuga, el jitomate. Viene, se puede quitar.
is_default=false, is_customizable=true   →  EXTRA.    El aderezo mango habanero. No viene, se puede poner.
```

Y `order_items` gana **`notes` (text, nullable)** — la nota libre del cliente
(*"no quiero ningún aderezo aunque haya seleccionado Mango Habanero"*).

**Por qué `name_snapshot`:** por la misma razón que ya congelamos el precio (BR-015). Si mañana renombran
el insumo, **el ticket viejo no debe cambiar**.

### 5.2 Stock de insumos — **automático, simétrico al de productos** (decidido por el usuario)

Reutiliza el mecanismo que **ya existe**, sin inventar uno nuevo:

- El agregado `Order` ya devuelve un `StockEffect` (`'reserve' | 'release' | 'none'`) desde sus
  transiciones. **Se extiende** para que las líneas también carguen sus `ingredientIds` incluidos.
- El adapter aplica el mismo SQL atómico que ya usa para productos —
  `GREATEST(0, stock − qty)` / `stock + qty`, en **orden global por id** (anti-deadlock),
  dentro de la **misma transacción**.
- **`reserve`** al aceptar (`pending → preparing`). **`release`** al cancelar / no recogido.
- **Nunca baja de 0** (BR-011).

### 5.3 Insumo agotado — **no tumba la compra**

Un insumo con `stock = 0` o `is_active = false` sale como **"Agotado"** en la app y **no se puede
incluir**. Pero **no** bloquea el pedido entero: el cliente pide su hamburguesa **sin lechuga**.
Bloquear la venta de una hamburguesa de $65 porque no hay lechuga sería peor negocio que venderla sin ella.

### 5.4 Margen (para inventario)

`margen = precio_de_venta − Σ(unit_cost de los insumos de la receta)`.
**No es una tabla**: es un cálculo de dominio (`ProductMargin`), como ya lo es el semáforo.

---

---

## 5-bis. Decisión 4 — Facturación: **layout para CFDI**, no timbrado

> Usuario: *"Interno tipo layout para generar la CFDI real del SAT"*.

**Lo que SÍ hacemos:** el sistema produce un **layout** — el paquete de datos, completo y validado, que un
PAC necesita para timbrar un **CFDI 4.0**. Exportable (JSON/CSV/PDF). Mostrador lo genera y lo entrega.

**Lo que NO hacemos:** timbrar. Nada de PAC, sello digital, XML sellado, ni folio fiscal. Eso cuesta
dinero y contrato.

**Lo que esto obliga a capturar** (hoy **no existe** ninguno de estos datos):

| Bloque | Campos | De dónde sale |
|---|---|---|
| **Emisor** | RFC · Nombre · RégimenFiscal · LugarExpedición (CP) | `branches` (columnas nuevas) — es la cooperativa |
| **Receptor** | RFC · Nombre · CP fiscal · RégimenFiscal · **UsoCFDI** | **El cliente**, si quiere factura → perfil fiscal opcional en `user_profile` |
| **Comprobante** | Fecha · **FormaPago `01` (efectivo)** · MetodoPago `PUE` · Moneda `MXN` · SubTotal · Total | Ya lo tenemos (el pedido) |
| **Conceptos** | **ClaveProdServ** · **ClaveUnidad** · Cantidad · Descripción · ValorUnitario · Importe · ObjetoImp | `products` (columnas nuevas; default genérico de alimentos preparados) |
| **Impuestos** | IVA 16% (alimento preparado para consumo) | Calculado |

> **Consecuencia incómoda pero real:** un pedido **solo es facturable si el cliente dio sus datos
> fiscales**. La app tiene que poder decir "este pedido no se puede facturar, falta el RFC" en vez de
> generar un layout inválido (§1 fail-closed).

---

## 6. Modelo de datos — ⚠️ **SUPERADO por el Plan 04**

> El modelo de insumos de abajo **NO es el vigente**. El vigente está en
> [`04-inventario-costeo`](../plans/2026-07-14-04-inventario-costeo.md) — con `base_unit`, `yield_pct`,
> `track_stock`, `iva_rate`, la tabla de **lotes** (`ingredient_purchases`) y el **libro mayor**
> (`stock_movements`). Se conserva aquí como registro de lo que se pensó primero.

### 6.1 (histórico) Resumen de cambios de la primera versión

```txt
NUEVAS TABLAS
  branches                   (id, name, address, lat, lng,
                              rfc, razon_social, regimen_fiscal, cp)   ← EMISOR del CFDI
                              ↑ saca BRANCHES del frontend a la BD

  ingredients                (branch_id, name, unit, stock, min/max, unit_cost, is_active, version)
  product_ingredients        (product_id, ingredient_id, is_default, is_customizable)   PK compuesta
  order_item_ingredients     (order_item_id, ingredient_id, name_snapshot, included)    PK compuesta

  cash_sessions              (id, branch_id, business_day, status open|closed,
                              opened_by, opened_at, float_pieces jsonb,
                              closed_by, closed_at, counted_pieces jsonb,
                              expected_total, counted_total, difference)
                              UNIQUE (branch_id, business_day)
                              UNIQUE parcial: una sola sesión 'open' por branch
  cash_drawer_pieces         (session_id, kind, value, count)   PK compuesta
                              ↑ el inventario VIVO del cajón. CHECK (count >= 0)

COLUMNAS NUEVAS
  user_profile.branch_id       text NULL   (NULL = cliente de plataforma; NOT NULL si rol de coop)
  user_profile.rfc             text NULL   ┐
  user_profile.razon_social    text NULL   │ perfil FISCAL del cliente (opcional).
  user_profile.cp_fiscal       text NULL   │ Sin esto, el pedido NO es facturable.
  user_profile.regimen_fiscal  text NULL   │
  user_profile.uso_cfdi        text NULL   ┘

  order_items.notes            text NULL

  products.clave_prod_serv     text NULL DEFAULT '50192700'  (alimentos preparados)
  products.clave_unidad        text NULL DEFAULT 'H87'       (pieza)

  payments.cash_tender         jsonb NULL  (el desglose DECLARADO por el cliente)
  payments.cash_tendered       numeric(10,2) NULL   + CHECK (cash_tendered >= amount)
  payments.cash_change         numeric(10,2) NULL   + CHECK (cash_change  >= 0)
  payments.cash_change_pieces  jsonb NULL  (las piezas que SALIERON del cajón — auditable)
  payments.cash_session_id     uuid NULL FK → cash_sessions   (a qué corte pertenece el cobro)

  app_settings.branch_id         ← deja de ser fila única; PK pasa a branch_id
  app_settings.cash_max_change   numeric(10,2) DEFAULT 500.00
  app_settings.cash_max_pieces   int DEFAULT 40

ENUM
  user_profile_role_enum  +=  'cocina' | 'inventario' | 'mostrador'

CHECK
  products.price múltiplo de $0.50     (§4.5 — para que el cambio siempre se pueda dar)
  payments: (method = 'efectivo') OR (cash_tender IS NULL)
```

---

## 7. Impacto en las reglas del proyecto

| Regla | Impacto |
|---|---|
| **BR-003 — ROLES** | ⚠️ **SE MODIFICA.** Hoy prohíbe `staff`/`cashier`/etc. *"sin autorización explícita"*. La petición del usuario **es** esa autorización. Se suman `cocina`, `inventario`, `mostrador`. **No** se crea `super-admin` ni `owner`. |
| **§5 — ROLES Y PERMISOS** | Se reescribe la lista con la matriz de §3.3. |
| **BR-009 — PAGOS** | Sin cambio de fondo. `efectivo` ya es válido y *no requiere pasarela*. El desglose es un detalle del **cobro**, no un método nuevo. |
| **BR-011 — STOCK** | Se **extiende** de productos a insumos. Sigue prohibido el negativo. |
| **BR-014 — PRIVACIDAD** | Se **refuerza**: ahora **cocina** tampoco ve identidad del cliente, y **ninguna cooperativa** ve pedidos de otra. |
| **BR-015 — FUENTE DE VERDAD** | Se respeta y se estira: el **cambio**, el **total** y la **validez del desglose** los decide el backend. |
| **Nueva BR-016 (propuesta)** | *Alcance por cooperativa*: el `branch_id` de autorización sale del **JWT**, nunca del request. |

---

## 8. No-objetivos (y por qué)

- **Timbrar el CFDI** (PAC, sello digital, XML sellado, folio fiscal). Generamos el **layout**; timbrar
  cuesta dinero y contrato. → §5-bis.
- **Multi-cajero / multi-turno en la misma sesión de caja**, retiros a bóveda, arqueos intermedios.
  Una sesión = un día = una persona. → §4.4.3.
- **Cobro extra por insumo** ("+$5 el aderezo"). No se pidió. Sería una columna `extra_price` en
  `product_ingredients`. YAGNI.
- **Super-admin de plataforma.** Ver §3.2.
- **Bloquear el pedido por falta de un insumo.** Ver §5.3.
- **Migrar `settings`/`auth`/`payments` a vertical slice.** Siguen en capas clásicas a propósito (regla 46).

---

## 9. Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| R1 | **Es un cambio grande** (3+1 tablas, enum de roles, claim nuevo en el JWT, guard nuevo, DTOs por rol, pantallas nuevas en cliente y panel) **con una presentación encima**. | **Rama `feat/roles-e-insumos`.** `main` se queda exactamente como se verificó el 2026-07-14: funcionando. → **§10.5** |
| R2 | Migrar el enum de roles en Postgres es **irreversible hacia atrás** sin recrear el tipo. | Migración con `up` **y** `down` probados contra la BD real, no solo `tsc`. |
| R3 | Keycloak: los roles y el claim `branch_id` requieren un **mapper** en el realm. La H2 de Keycloak es **efímera** — al recrear el contenedor hay que re-sembrar. | Automatizar en `seed-admin.sh` (ya existe el patrón), no a mano en la consola. |
| R4 | El `branch_id` como **texto libre** en `orders` no tiene FK; sembrar `branches` y migrar los existentes puede dejar huérfanos. | La migración crea `branches` con los 3 ids reales y **valida** que no haya `orders.branch_id` fuera de esa lista antes de poner la FK. |
| R5 | **Regresión de stock.** El `StockEffect` ya tuvo una regresión seria (D-037: se perdieron locks/TOCTOU). Meterle insumos toca **el mismo código**. | Tests de concurrencia sobre `applyStockDelta` **antes** de tocarlo. Gate §22 con agente de regresión. |
| R6 | Cocina con DTO propio: si alguien reusa el mapper de admin por descuido, **se filtran datos del cliente**. | Test que **falle** si `KitchenOrderResponse` contiene `total`/`email`/`customer`. |

---

## 10. Decisiones — **CERRADAS por el usuario (2026-07-14)**

| # | Pregunta | Resolución |
|---|---|---|
| **10.1** | ¿Cocina puede marcar `ready`? | ✅ **Sí — cocina lo marca, mostrador lo ve.** Cocina es quien *sabe*. Es su **única** transición (§3.4). |
| **10.2** | "Facturar" = ¿comprobante o CFDI? | ✅ **Layout para timbrar el CFDI 4.0 real** — no timbramos nosotros (§5-bis). Obliga a capturar RFC/régimen/CP del emisor **y** del receptor, y claves ProdServ/Unidad en los productos. |
| **10.3** | ¿Inventario por cooperativa? | ✅ **Sí** (`ingredients.branch_id`). |
| **10.4** | ¿Precios múltiplos de $0.50? | ✅ **Sí.** `CHECK` en BD (§4.5). |
| **10.5** | ¿La caja se registra? | ✅ **SÍ — y esto CAMBIÓ el diseño.** *"La misma persona debe de registrar los billetes / monedas."* → sesión de caja + inventario del cajón + corte + `ChangeMaker` con existencias limitadas (§4.4). Deja de ser un no-objetivo. |
| **10.6** | ¿Un humano con 2 roles? | ❌ **No: 1 persona = 1 rol** (§3.5). Además le da dueño inequívoco al faltante de caja. |
| **10.7** | ¿Rama? | Ver §10.8 — *"genera la mejor propuesta"*. |

### 10.8 Estrategia de rama (propuesta, §10.7)

**El problema real no es la rama: es que hay una presentación y este cambio es grande.**

```txt
main                    ← INTOCABLE. Es lo que se verificó funcionando el 2026-07-14.
 └── feat/roles-e-insumos    ← rama larga (todo el spec). NO se mergea entera.
      ├── A · cimientos      (BD + Keycloak + BranchScopeGuard)   ─┐
      ├── B · efectivo + caja                                      │ cada fase cierra
      ├── C · insumos + personalización                            │ con gate §22
      └── D · panel por rol + CFDI layout + cierre                ─┘ (0 P0-P5)
```

- **`main` no se toca hasta después de la presentación.** Si algo se rompe hoy, se rompe en la rama.
- **Cada fase se mergea a `feat/roles-e-insumos` cuando pasa el gate §22** — así la rama nunca acumula
  cuatro fases rotas a la vez, que es como se pierde un fin de semana.
- **La fase A se mergea a `main` primero, sola.** Es la que **cierra la fuga BOLA** (§2.1): tiene valor
  de seguridad aunque B/C/D nunca lleguen, y es la más fácil de revisar. Las demás pueden esperar.
- **Commits en español**, y **los ejecutas tú** (§23). Yo dejo el `git add` en *staged* y te paso el comando.

---

## 11. Verificación (§0 — evidence-or-block)

Lo que tendrá que probarse **de verdad** al cerrar (no "compila"):

1. **Aislamiento por cooperativa (la fuga de §2.1):** un `mostrador` de `cdmx-roma` con token válido pide
   `GET /orders/all?branchId=cdmx-tlalpan` → **403**, no 200 filtrado. Y sin `branchId` → solo ve Roma.
2. **Privacidad de cocina (BR-014):** el JSON que recibe `cocina` **no contiene** `total`, `payment`,
   `customer` ni `email`. Aserción sobre el cuerpo crudo, no sobre la UI.
3. **Límite de efectivo (R4):** pedido de $150 + `2 × $500` → **400**, mensaje "cambio excesivo".
   Y $150 + `1 × $500` → **201**, `change = 350`.
4. **El cambio lo calcula el server (R7):** mandar un `change` falso en el body → se **ignora**.
4-bis. **Caja (§4.4):** cobrar sin sesión abierta → **400**. Cobrar con `1×$500` un pedido de $150 cuando
   el cajón **no tiene** con qué dar $350 → el sistema lo dice, **no** inventa el cambio.
   Tras cobrar: el cajón tiene **+1 billete de $500** y **−$350** en piezas. Cerrar → `esperado` cuadra;
   si el conteo difiere, la **diferencia queda registrada**, no se corrige sola.
5. **Stock de insumos:** aceptar un pedido con "sin lechuga" → la lechuga **no** baja; el jitomate **sí**.
   Cancelar → se **devuelve**. Nunca negativo (BR-011).
6. **Snapshot:** renombrar un insumo después del pedido → el ticket viejo **no cambia**.
7. **Concurrencia (R5):** dos aceptaciones simultáneas del mismo pedido → una sola baja de stock.
8. Migración `up` **y** `down` contra Postgres real. Backend arranca con **0 errores de DI**.
   `tsc` 0 en back y front. Los **117 tests** siguen verdes.
9. **Gate §22:** auditoría multi-lente + agente de regresión. **0 P0-P5.** Confianza ≥95%.

---

## 12. Nota de proceso (§40 — autocrítica)

Este spec **debió existir antes** del primer archivo de código. En su lugar escribí
`frontend/src/shared/ui/Money.tsx` y convertí los assets, saltándome `docs/superpowers/`. El usuario lo
señaló y tenía razón. Lo escrito queda como **spike** (prueba de concepto de los billetes en vector) y
lo reconcilia el plan; no es alcance aprobado.

*Referencias: `rules.md` §5 · §22 · §23 · §40 · §42 · §46 · BR-003 · BR-009 · BR-011 · BR-014 · BR-015.
ADR pendiente: **D-047**.*
