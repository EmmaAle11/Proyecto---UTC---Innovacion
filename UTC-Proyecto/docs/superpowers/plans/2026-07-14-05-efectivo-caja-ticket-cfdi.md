# Plan 05 — Efectivo con desglose, caja, ticket y layout CFDI

> **Sección 5 de 5.** Depende del **Plan 01** (`mostrador` es el dueño de todo esto) y del **Plan 04**
> (la ganancia necesita los costos).
> Git lo ejecuta el usuario (§23). Rama: `feat/roles-e-insumos`.

**Goal:** Que el cliente **declare con qué billetes y monedas paga**; que **mostrador** cobre contra una
**caja real**, dé el cambio pieza por pieza, haga su **corte**, y genere el **layout para timbrar el CFDI**.
Todo lo decide el backend (BR-015); la app solo muestra.

---

## 🔴 Lo primero: **hay IVA, y hoy no existe en el sistema**

**Confirmado con la ley, no con un blog.** LIVA art. 2-A, fracc. I, último párrafo:

> *"Se aplicará la tasa del **16 %** a la enajenación de los alimentos […] **preparados para su consumo en
> el lugar o establecimiento en que se enajenen**, inclusive cuando no cuenten con instalaciones para ser
> consumidos en los mismos, **cuando sean para llevar o para entrega a domicilio**."*

**"Para llevar" NO te salva.** Una cooperativa que solo entrega **sigue causando 16 %**. El SAT tiene incluso
un criterio no vinculativo (4/IVA/NV) apuntando contra quienes aplican 0 %.

**Y hoy el sistema no tiene IVA en ningún lado.** `products.price` es un número suelto: nadie sabe si trae
IVA o no. Eso tiene **tres** consecuencias, y ninguna es cosmética:

| # | Consecuencia | Dónde muerde |
|---|---|---|
| 1 | **El margen está inflado ~16 puntos.** Si el precio de menú es **con IVA incluido** (lo normal en México), el food cost se calcula contra `precio / 1.16`. Calcularlo contra el precio bruto te hace **creer que ganas cuando no**. | **Plan 04**, D7 |
| 2 | **La tasa de IVA es atributo del PRODUCTO, no una constante.** Comida preparada 16 %; si un día venden despensa cruda, 0 %. | `products.tasa_iva`, `products.objeto_imp` |
| 3 | **Poco IVA acreditable.** Las **ventas** llevan 16 %, pero las **compras** de materia prima (carne cruda, verdura) están a **0 %**. El IVA que cobras es **casi todo IVA a pagar**. | Que la cooperativa lo sepa **antes**, no en la declaración. |

**Decisión de este plan: el precio de menú es CON IVA INCLUIDO** (es lo que el estudiante ve y paga en el
mostrador). El backend deriva `base = precio / 1.16` e `iva = precio − base`, con **6 decimales**, y
**redondea una sola vez, al final**.

---

## Parte A — Efectivo con desglose (la vista del cliente)

### A.1 El Value Object

`CashTender` en el dominio de `orders`, junto a `Money` y `Quantity` que ya existen.

**Denominaciones MXN reales.** El arte es "UTC Pesos" (Universidad Tres Culturas); **el valor es peso
mexicano**, porque quien está en mostrador tiene que **cuadrar la caja**:

```txt
monedas:  $0.50 · $1 · $2 · $5 · $10 · $20
billetes: $20 · $50 · $100 · $200 · $500 · $1000
```

> ⚠️ **$20 existe como billete Y como moneda.** La llave es **`kind + value`**, no solo `value`.

### A.2 Las reglas (fail-closed, §1)

Configurable **por cooperativa** en `app_settings` (que el Plan 01 ya partió por `branch_id`):

| Parámetro | Default |
|---|---|
| `cash_max_change` | **$500.00** |
| `cash_max_pieces` | **40** |

| # | Regla | Si falla |
|---|---|---|
| R1 | Denominación válida de la tabla | `DomainError` |
| R2 | `count` entero ≥ 1 · `Σcount ≤ max_pieces` | `DomainError` |
| R3 | **Alcanza:** `entregado ≥ total` | "no alcanza" |
| R4 | **No excede:** `entregado − total ≤ max_change` | **"cambio excesivo"** ← *la regla que pediste* |
| R5 | Solo con `payMethod = efectivo` | `DomainError` |
| R6 | Si `efectivo`, el desglose es **obligatorio** | `DomainError` |
| R7 | **El cambio lo calcula el BACKEND** | BR-015 |

**R4 resuelve tu caso:** pedido de $150 con `2 × $500` = $1000 → cambio $850 > $500 → **rechazado**.

### A.3 El "mapeo" de límites: **una fórmula, un dueño**

```txt
FUENTE ÚNICA:   GET /settings/cash  →  { denominations[], maxChange, maxPieces }
```

- **El front la consume** y apaga en vivo. Una pieza de valor `d` se deshabilita cuando añadirla rompería R4:

  ```txt
  deshabilitar d   ⟺   (entregado + d) − total > maxChange
  ```

  Para un pedido de **$148** con tope $500: el billete de **$1000 nace apagado** (1000 − 148 = 852 > 500).
  El de $500 **sí** entra (352 ≤ 500). Y conforme el cliente suma, se van apagando más.
  **Es dinámico, no una lista fija.**

- **El backend revalida** el tender completo con las mismas reglas. El front es **UX**; el backend es la
  **verdad**. **El número NO se hardcodea en el front** (Plan 02).

### A.4 UX en móvil — **adiós al clic derecho**

El prototipo web usaba clic izquierdo/derecho. **En un teléfono el clic derecho no existe.**

| Interacción | Qué hace |
|---|---|
| **Tocar la pieza** | +1 |
| **Burbuja `−`** en la esquina opuesta, visible solo con `count ≥ 1` | −1. **Sin gestos ocultos.** |
| **"Pago exacto"** | Arma el desglose **con menos piezas** que cubra el total. **Un toque.** |
| **"Limpiar"** | Todo a 0 |
| Pieza deshabilitada (R4) | Opaca + **el motivo**: *"Excede el cambio máximo ($500)"* |

**Reuso (§42):** `shared/ui/QtyStepper.tsx` (− N +) **ya existe** — es el plan B si la burbuja no convence.

---

## Parte B — La CAJA (lo que cambió el diseño)

> Usuario: *"**La misma persona debe de registrar los billetes / monedas.**"*

El tope de $500 responde *"¿el cambio es razonable?"*. La pregunta que **de verdad importa** es
**"¿la caja tiene con qué darlo?"**. Son dos preguntas, y se contestan **en momentos distintos**:

| Momento | Quién | Qué sabe | Qué valida |
|---|---|---|---|
| **Al pedir** | el cliente, en su teléfono | La caja **del futuro** es desconocida (recoge en 20 min) | La **heurística**: R1–R6 |
| **Al cobrar** | mostrador, con el cajón enfrente | La caja **real**, pieza por pieza | **La verdad**: ¿el cambio es *construible*? |

### B.1 Sesión de caja

```txt
ABRIR   → mostrador declara el FONDO: cuántas piezas de cada denominación hay al empezar.
COBRAR  → las piezas del cliente ENTRAN al cajón; las del cambio SALEN.
CERRAR  → mostrador CUENTA. El sistema compara → FALTANTE / SOBRANTE.
```

- Una sesión por **cooperativa** y **día hábil**. **Una sola abierta a la vez** — y eso lo hace **la BD**
  (índice único parcial), no el código.
- **No se puede cobrar en efectivo sin sesión abierta** → **400** (§1).
- El cierre es un **corte real**: `esperado = fondo + Σentradas − Σsalidas`; `diferencia = contado − esperado`.
  **La diferencia NO se corrige sola:** se registra y va al `audit-log` (que ya existe).
- **Una persona = un rol** (Plan 01) → el faltante tiene **dueño inequívoco**.

### B.2 `ChangeMaker` — ⚠️ **aquí el voraz FALLA**

Para el **"Pago exacto"** del cliente, un algoritmo **voraz** basta: el sistema de denominaciones mexicano
es **canónico**, así que tomar siempre la pieza más grande da el óptimo.

**Pero eso solo vale con piezas infinitas. La caja no las tiene.**

> Puedes tener **$500 en billetes de $200** y ser **incapaz de dar $100**.

Con existencias acotadas es el problema de la **mochila acotada**, y el voraz **falla en silencio**.
→ **Programación dinámica** sobre el monto en centavos. Como el cambio está topado por `cash_max_change`
($500 = 50 000 centavos) y hay 12 denominaciones, la DP es **trivial y rápida**.

```txt
ChangeMaker.make(cambio, cajón)  →  piezas[]  |  null ("no se puede dar exacto")
```

Si devuelve `null`, mostrador lo ve **antes** de tomar el billete:
*"No puedo dar $352 con lo que hay. ¿Tienes $150 exactos?"*
**Eso el tope de $500, solo, jamás lo habría podido contestar.**

---

## Parte C — Layout CFDI 4.0 (**no timbramos**)

> Usuario: *"Interno tipo layout para generar la CFDI real del SAT"*.

**Producimos el paquete de datos** que un PAC necesita para timbrar. **No timbramos** (sello, XML sellado,
UUID y `TimbreFiscalDigital` los pone el PAC).

### C.0 El flujo — **lo decide el cliente, en su perfil**

> Usuario: *"En principio el usuario deberá de poner en perfil si desea facturar; si lo desea tendrá que
> rellenar el layout oficial de la ley para el llenado de datos en la factura que va a emitir el proveedor,
> que es la UTC Pick Sazón."*

```txt
PERFIL DEL CLIENTE
  │
  ├─ [ ] "Quiero factura"   ← APAGADO por defecto
  │        └─ el pedido va a la FACTURA GLOBAL (público en general) — §C.3
  │
  └─ [✓] "Quiero factura"
           └─ Formulario del LAYOUT OFICIAL (los 5 campos de la ley):
                1. RFC                        (12 PM / 13 PF, con homoclave)
                2. Nombre / razón social      ← TAL CUAL la Constancia de Situación Fiscal,
                                                 sin "S.A. de C.V."
                3. CP del domicilio fiscal    (DomicilioFiscalReceptor)
                4. Régimen fiscal             (RegimenFiscalReceptor)
                5. Uso de CFDI                (UsoCFDI)   ← se valida contra el 4 (§C.1)
```

**El emisor es la cooperativa** (UTC Pick Sazón): su RFC, razón social, régimen y CP salen de **su propia
CSF** y viven en `branches`. **No se adivinan: hay que leerlos del acta.**

**Tres reglas que caen de aquí:**

1. **Validar en CAPTURA, no al timbrar.** El SAT valida los 4 primeros campos **contra su padrón**. Si el
   cliente escribe su nombre con una letra distinta a como está registrado, o pone el CP donde vive en vez
   del **fiscal**, **el PAC rechaza** (`CFDI40145`, `CFDI40147`). Que la app lo cache antes.
2. **Sin perfil fiscal → NO facturable.** El backend responde *"no facturable: faltan datos fiscales"*.
   **Nunca genera un layout inválido** (§1 fail-closed).
3. **⚠️ Ventana de tiempo.** Un pedido que **ya entró en la factura global** no se puede facturar
   después sin **cancelar y sustituir la global**. → **Regla explícita: "puedes pedir factura el mismo día"**,
   y después se cierra. (Y por eso `orders.facturado` es obligatorio desde el día 1.)

### C.1 ⚠️ La trampa que te va a morder: `UsoCFDI` ↔ `RegimenFiscalReceptor`

**Desde CFDI 4.0 el SAT valida que sean COMPATIBLES. Si no cuadran, el PAC RECHAZA el timbrado.**

- **`G03` (Gastos en general)** — **NO es válido si el receptor es régimen `605` (Sueldos y Salarios)**…
  que es **exactamente el régimen del estudiante promedio**. Para `605` los válidos son `D01`..`D10`,
  **`S01`** y `CP01`.
- **`S01` (Sin efectos fiscales)** — lo que corresponde a un alumno que **no va a deducir** nada.

> **De las seis trampas que encontró la investigación, esta es la ÚNICA que produce un fallo DURO y
> EXTERNO** (el PAC rechaza el documento). Las demás producen datos incorrectos **en silencio** — peor a
> largo plazo, pero no te bloquean.

**→ El `UsoCFDI` y el `RegimenFiscalReceptor` los CAPTURA el cliente. No se adivinan. Y se validan como PAR.**

### C.2 Los valores para comida preparada

| Catálogo | Valor |
|---|---|
| `c_ClaveProdServ` | **`90101500`** — *Establecimientos para comer y beber* (lo sugiere el propio SAT) |
| `c_ClaveUnidad` | **`E48`** — *Unidad de servicio* |
| `c_FormaPago` | **`01`** — Efectivo (tarjeta débito → `28`, crédito → `04`) |
| `c_MetodoPago` | **`PUE`** — se paga al momento |
| `ObjetoImp` | **`02`** — *Sí objeto de impuesto* (se desglosa el IVA) |
| `Exportacion` | **`01`** — *No aplica*. **Nuevo en 4.0. Se olvida siempre.** |
| `c_RegimenFiscal` (emisor) | **CONFIGURACIÓN — no lo decidimos nosotros.** Sale de la CSF de la cooperativa. Candidatos: `601` · **`603` PM con Fines no Lucrativos** (común en coops escolares) · `620`. **Hay que LEER el acta, no deducirla.** |

### C.3 Factura global (el cliente que NO pide factura)

| Campo | Valor |
|---|---|
| `Rfc` receptor | **`XAXX010101000`** |
| `Nombre` | **`PUBLICO EN GENERAL`** |
| `RegimenFiscalReceptor` | **`616`** — Sin obligaciones fiscales |
| `DomicilioFiscalReceptor` | **el CP del EMISOR** |
| `UsoCFDI` | **`S01`** |
| `ClaveProdServ` / `ClaveUnidad` | **`01010101`** / **`ACT`** |
| `NoIdentificacion` | **el folio del ticket** (un concepto por operación) |

**⚠️ Plazo: 24 HORAS tras el cierre del periodo.** *(Casi todo internet dice 72 h — quedó obsoleto en 2021.)*

**Y la regla que obliga a una columna desde el día 1:**
> **Un pedido ya facturado nominativamente NO puede entrar en la global.**
> → **flag `facturado` / `cfdi_uuid` por pedido, OBLIGATORIO.** La global se arma con `WHERE facturado = false`.
> Si alguien pide factura **después** de que su ticket entró en una global → hay que **cancelar y sustituir
> la global**. Doloroso. → **Ventana explícita: "puedes pedir factura el mismo día"**, y se cierra.

---

## Modelo de datos

```txt
COLUMNAS NUEVAS
  products.tasa_iva            NUMERIC(5,4) DEFAULT 0.16    ← atributo del PRODUCTO
  products.objeto_imp          text DEFAULT '02'
  products.clave_prod_serv     text DEFAULT '90101500'
  products.clave_unidad        text DEFAULT 'E48'

  branches.rfc · razon_social · regimen_fiscal · cp          ← EMISOR (de la CSF)

  user_profile.rfc · razon_social · cp_fiscal
              · regimen_fiscal · uso_cfdi                    ← RECEPTOR (opcional).
                                                                Sin esto → NO facturable.

  orders.facturado             boolean DEFAULT false         ← ⚠️ OBLIGATORIO desde el día 1
  orders.cfdi_uuid             text NULL

  payments.cash_tender         jsonb    (el desglose DECLARADO)
  payments.cash_tendered       NUMERIC(10,2)  CHECK (cash_tendered >= amount)
  payments.cash_change         NUMERIC(10,2)  CHECK (cash_change >= 0)
  payments.cash_change_pieces  jsonb    (las piezas que SALIERON — auditable)
  payments.cash_session_id     uuid FK

  app_settings.cash_max_change  NUMERIC(10,2) DEFAULT 500.00
  app_settings.cash_max_pieces  int DEFAULT 40

NUEVAS TABLAS
  cash_sessions        id · branch_id · business_day · status open|closed
                       opened_by/at · float_pieces jsonb
                       closed_by/at · counted_pieces jsonb
                       expected_total · counted_total · difference
                       UNIQUE (branch_id, business_day)
                       ÍNDICE ÚNICO PARCIAL: una sola sesión 'open' por sucursal
  cash_drawer_pieces   session_id · kind · value · count   PK compuesta · CHECK (count >= 0)
                       ↑ el inventario VIVO del cajón

CHECK
  products.price múltiplo de $0.50   ← para que el cambio SIEMPRE se pueda dar
  payments: (method = 'efectivo') OR (cash_tender IS NULL)
```

---

### Task 1: BD — efectivo, caja y datos fiscales
- [ ] **Step 1:** todas las columnas y tablas de arriba.
- [ ] **Step 2 — el índice único parcial** de la sesión abierta: **que la BD haga imposible dos cajas
      abiertas**, no el código.
- [ ] **Step 3 — `CHECK` de precios múltiplos de $0.50.** Verificar antes que los 10 productos sembrados lo
      cumplen (sí: precios enteros). **Sin esto, un total de $148.25 tiene un cambio imposible de dar** — la
      moneda más chica es $0.50.
- [ ] **Step 4:** `migration:run` **y `revert`** contra Postgres real.

### Task 2: Dominio — `CashTender` + `CashPolicy`
- [ ] **Step 1:** el VO (llave `kind + value` — el $20 es billete **y** moneda). Montos en **centavos
      enteros** reusando `Money`. **Nada de flotantes.**
- [ ] **Step 2:** R1–R6, todas con `DomainError` (D-039 — sin `Result`/`Either`).
- [ ] **Step 3 — `change()`** = `entregado − total`, **aquí** (R7 / BR-015).
- [ ] **Step 4 — `exactChange()`** — voraz. **Válido porque MXN es canónico** y aquí sí hay piezas infinitas
      (es el bolsillo del cliente, no la caja).
- [ ] **Step 5 — tests:** $150 con `2×$500` → **rechaza** ("cambio excesivo") · $150 con `1×$500` → acepta,
      `change = 350` · $148 con `2×$50 + 2×$20 + 2×$5` → acepta, `change = 2` · pago corto → rechaza ·
      denominación inventada ($37) → rechaza · tarjeta **con** tender → rechaza · efectivo **sin** tender → rechaza.

### Task 3: Dominio — `ChangeMaker` (la caja REAL)
- [ ] **Step 1 — `CashDrawer` VO:** el inventario del cajón. `add` / `remove` / `total`. **Nunca negativo.**
- [ ] **Step 2 — DP de mochila acotada** (B.2). **NO voraz** — y dejarlo comentado en el código, porque el
      voraz *parece* que funciona hasta el día que no.
- [ ] **Step 3:** entre los desgloses válidos, preferir **el de menos piezas** (conservar el cambio chico).
- [ ] **Step 4 — tests:** cajón **sin** billetes de $50 → los $50 se arman con `2×$20 + 1×$10` ·
      cajón que **no puede** dar $350 → **`null`** (y **no** inventa piezas) · cajón exacto → lo vacía sin
      negativos · **fuzz: 500 cajones aleatorios → la suma de las piezas devueltas SIEMPRE = el cambio.**

### Task 4: Backend — slices `cash` e `invoicing`
- [ ] **Step 1 — `GET /settings/cash`** → la política. **Fuente única del límite** (A.3).
- [ ] **Step 2 — `POST /cash-sessions`** (abrir con el fondo) · **`/close`** (cerrar con el conteo →
      diferencia) · **`GET /cash-sessions/current`** (el cajón vivo). `@Roles(mostrador, admin)`.
- [ ] **Step 3 — `PATCH /orders/:id/cash`** — el cobro real. Las piezas del cliente **entran**, las del
      cambio **salen**, `PaymentStatus.PAID` — **todo en la misma transacción**.
- [ ] **Step 4 — fail-closed:** cobrar sin sesión abierta → **400**.
- [ ] **Step 5 — `POST /orders/:id/invoice-layout`** — el paquete CFDI.
      **Si falta el RFC del cliente → responde "no facturable: faltan datos fiscales". NO genera un layout
      inválido** (§1). Marca `orders.facturado`.
- [ ] **Step 6 — `POST /invoicing/global`** — la factura global del periodo
      (`WHERE facturado = false`), con `XAXX010101000` / `616` / `S01` / `ACT`.
- [ ] **Step 7 — validar el PAR** `uso_cfdi` ↔ `regimen_fiscal_receptor` (C.1). **`G03` + `605` → rechazar
      en captura**, no esperar al PAC.

### Task 5: Frontend — el selector, el ticket y el panel
- [ ] **Step 1:** `fetchCashPolicy()`. **Cero constantes locales** (Plan 02).
- [ ] **Step 2 — el selector** (A.4): tap = +1 · burbuja `−` · **"Pago exacto"** · "Limpiar" ·
      apagado dinámico **con el motivo**.
- [ ] **Step 3 — EL TICKET.** Layout del CSS que mandaste (título · secciones con hairlines · rejilla de
      importes · pie con total grande + botón), **sin el cupón**, en la paleta **UTC (blanco / naranja /
      azul)**. Filas nuevas: personalización (**"sin lechuga"**), **nota**, **"Pagas con"** (las piezas) y
      **"Tu cambio"**. Y ahora también: **Subtotal · IVA 16 % · Total**.
      *(Vista previa aprobada: https://claude.ai/code/artifact/fbc8fcd2-7957-4e9a-9161-e4f6abe638a1)*
- [ ] **Step 4 — los billetes y monedas:** `shared/ui/Money.tsx` — **vector**, el valor lo imprime la app,
      no el arte. Cuando lleguen las finales del diseñador (**en blanco, sin la cifra**), se sustituye el
      interior del SVG.
- [ ] **Step 5 — panel de `mostrador`:** cola con dinero + cliente · **el desglose y LAS PIEZAS DEL CAMBIO,
      en grande** · **la CAJA** (abrir / ver / cerrar con corte — **reusa el mismo selector de piezas**,
      §42) · entrega · **reoferta** · **layout de factura** · **ganancia del día**.
- [ ] **Step 6 — PERFIL FISCAL del cliente** (§C.0): interruptor **"Quiero factura"** (apagado por defecto)
      → si lo enciende, el formulario del **layout oficial** (RFC · razón social · CP fiscal · régimen ·
      uso de CFDI). **Validar en captura**, no al timbrar: formato de RFC, CP de 5 dígitos, y el **PAR**
      `uso` ↔ `régimen` (§C.1). Avisar que los datos deben ir **tal cual la Constancia de Situación Fiscal**.

### Task 6: Verificación y cierre
- [ ] **Step 1 — R4:** pedido de $150 + `2×$500` → **400**. `1×$500` → **201**, `change = 350`.
- [ ] **Step 2 — R7:** mandar un `change` falso en el body → **se ignora**.
- [ ] **Step 3 — la caja:** cobrar sin sesión → **400** · cobrar $500 sobre $150 con un cajón que **no puede**
      dar $350 → **el backend lo dice, no inventa** · tras cobrar, el cajón tiene **+1 de $500** y **−$350**
      en piezas · cerrar → la **diferencia queda registrada**, no se corrige sola.
- [ ] **Step 4 — IVA:** un producto de **$65 (IVA incluido)** → base **$56.03** + IVA **$8.97** = **$65.00**.
      **Redondeo una sola vez.** El PAC valida `Total = SubTotal + Traslados` con ~1 centavo de tolerancia.
- [ ] **Step 5 — CFDI:** pedido **sin** RFC → *"no facturable"* (no un layout roto) · `G03` + régimen `605`
      → **rechazado en captura** · pedido ya facturado **NO** entra en la global.
- [ ] **Step 6:** los **117 tests** verdes · backend con **0 errores de DI** · `tsc` 0 back y front.
- [ ] **Step 7:** agente de regresión (§22). **0 P0-P5.**
- [ ] **Step 8:** ADR **D-051** (*efectivo, caja y CFDI layout*) · **BR-009 ampliada** (el desglose) ·
      **BR-017 nueva** (*IVA 16 % en alimentos preparados; el precio de menú lo incluye*) · CHANGELOG.

---

## Fuera de alcance

**Timbrar** (PAC, sello, XML sellado, UUID) · multi-cajero / multi-turno en una sesión · retiros a bóveda ·
arqueos intermedios · complemento REP (solo aplica a `PPD`, y aquí todo es `PUE`) ·
**devolución de efectivo por cancelación de un pedido ya pagado** *(⚠️ se detectó, no se pidió — si el
mostrador ya cobró y el pedido se cancela, sale dinero del cajón. Hoy eso no puede pasar porque el cobro
ocurre **al entregar**. Si algún día se cobra por adelantado, esto **debe** existir.)*

## Riesgos

| # | Riesgo | Mitigación |
|---|---|---|
| **R1** | **Usar el voraz para el cambio de la caja.** *Parece* que funciona. Falla el día que el cajón tiene una composición rara — y falla **dando el cambio mal**. | DP + el test del cajón sin billetes de $50 (Task 3 Step 4). Comentario en el código explicando **por qué NO es voraz**. |
| **R2** | **Redondear el IVA por línea** → el PAC rechaza por descuadre de centavos. | 6 decimales, **una sola redondeada al final** (Task 6 Step 4). |
| **R3** | **Olvidar `orders.facturado`** → un pedido facturado entra **también** en la global → hay que cancelar y re-emitir la global. | Columna obligatoria desde la Task 1. |
| **R4** | El régimen fiscal del emisor **se adivina**. | **No se adivina: se LEE de la CSF de la cooperativa.** Es configuración, y hay que pedírsela al usuario. |
