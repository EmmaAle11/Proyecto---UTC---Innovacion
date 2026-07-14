# Motor de costeo, IVA y ganancia — Diseño a mano

**Fecha:** 2026-07-14 · **Estado:** PROPUESTA — diseño detallado, pendiente de tu visto bueno.
**Alimenta al** `plans/2026-07-14-04-inventario-costeo.md` y al `05-efectivo-caja-ticket-cfdi.md`.

> Este documento existe porque el usuario pidió **"diseñar a mano"** el sistema de costeo tras descubrir
> que el cálculo ingenuo (`500 g × $0.05 = $25`) estaba mal. Aquí está la cadena completa, con números
> reales, desde que se compra la carne hasta que se sabe cuánto se ganó.

---

## 0. El hallazgo que obliga a este documento

**Con tus números, la hamburguesa no es negocio.**

| | |
|---|---|
| Carne: **500 g netos** ÷ **0.80** de rendimiento | **625 g brutos** × $0.05/g = **$31.25** |
| Resto de la receta | ≈ **$12.40** |
| **COSTO TOTAL** | **≈ $43.65** |
| Precio de menú **$65 (IVA incluido)** → ingreso real | `65 / 1.16` = **$56.03** |
| **GANANCIA** | **$12.38** |
| **FOOD COST** | **78 %** ⚠️ *(estándar: 28–35 %. Cooperativa: 35–45 %)* |

**La causa es una sola: 500 g de carne es medio kilo.** Una hamburguesa lleva **120–150 g**.

| Escenario | Costo | Food cost | Ganancia | Veredicto |
|---|---|---|---|---|
| Carne **500 g** @ $65 | $43.65 | **78 %** | $12.38 | ❌ inviable |
| Carne **500 g** → precio mínimo para 40 % | — | 40 % | — | **el precio tendría que ser $127** |
| Carne **150 g** @ $65 | **$21.78** | **39 %** | **$34.25** | ✅ **negocio** |

**No lo corrijo yo.** Si de verdad es media hamburguesa de kilo, el precio sube. Es tu decisión.
**Lo que el sistema tiene que hacer es gritártelo antes de que abras.**

---

## 1. Las tres capas (y por qué son tres)

La gente colapsa esto en una y por eso se equivoca:

```txt
CAPA 1 — FÍSICA        ¿En qué unidad se mide?          gramos, mililitros, piezas
CAPA 2 — COMERCIAL     ¿Cómo se compra?                 "3 kg", "una caja de 12", "un costal"
CAPA 3 — CULINARIA     ¿Cuánto llega al plato?          rendimiento (yield)
```

- **La capa 1 es inmutable** (`kg → 1000 g` es física, no negocio). Vive en una tabla de constantes.
- **La capa 2 es del LOTE, no del insumo.** ⚠️ *Una caja de lechuga trae 12 piezas hoy y 10 la próxima. La
  bolsa de carne es de 3 kg con un proveedor y de 2.5 kg con otro.* **Si el factor vive en el insumo, no
  puedes tener dos proveedores sin duplicar el insumo.** Es el error de diseño clásico.
- **La capa 3 es del INSUMO** (a veces de la receta): el hueso, la grasa, la cáscara, el tronco de la lechuga.

---

## 2. El rendimiento (yield) — lo que faltaba

**3 kg de carne con hueso NO dan 3 kg de carne útil. Dan ~2.4 kg.**

```txt
qty_bruta  =  qty_neta / rendimiento

500 g netos / 0.80  =  625 g brutos      ← lo que SALE de la alacena
625 g × $0.05/g     =  $31.25            ← lo que CUESTA de verdad
```

**Sin esto pasan dos cosas, y ninguna se ve venir:**
1. El costo teórico queda **subestimado siempre** → crees que ganas más de lo que ganas.
2. El inventario **"se pierde" solo** → el sistema descuenta 500 g y la realidad se llevó 625.

### ⚠️ TRES mermas, no dos — y solo DOS se modelan

Esta es la distinción más fina de todo el documento, y equivocarla mete un error sistemático:

| | Qué es | ¿Se modela? |
|---|---|---|
| **① Merma de LIMPIEZA** *(el `yield`)* | El hueso, la grasa, la cáscara, el tronco de la lechuga. Va de **lo que compras** a **lo que puedes usar**. | ✅ **SÍ — es COSTEO.** Un `%` en el insumo. `bruto = neto / yield`. |
| **② Merma de COCCIÓN** | 130 g de carne cruda salen ~105 g cocidos. El agua se evapora. | ❌ **NO se modela — y está BIEN.** |
| **③ Merma INCIDENTAL** | El plato que se cayó, lo que caducó, el derrame. **Accidente.** | ✅ **SÍ — es EVENTO.** Movimiento con motivo y responsable. |

**¿Por qué la de cocción NO se modela?** Porque **la receta declara las cantidades en CRUDO** — que es
justo lo que sale del almacén y lo que ya pagaste. El agua que se evapora **no te costó nada extra**. Si
además le restaras la merma de cocción, **contarías la pérdida dos veces**.

```txt
COMPRAS       3 000 g de carne con hueso        ← esto pagaste
  ↓ yield 80 %  (① merma de LIMPIEZA)
UTILIZABLE    2 400 g de carne limpia           ← esto puedes usar → SALE DEL STOCK
  ↓ receta: 130 g crudos por hamburguesa
  ↓ (② merma de COCCIÓN — invisible para el costo)
SE SIRVE      ~105 g cocidos                    ← esto ve el cliente
```

**El stock guarda CRUDO. La receta consume CRUDO. El costo se calcula sobre CRUDO.** La cocción solo
cambia lo que el cliente ve en el plato, no lo que la cooperativa pagó.

**Y confundir ① con ③ mata la varianza de inventario** — ya no puedes distinguir *"se echó a perder"* de
*"se lo están robando"*.

### ⚠️ CORRECCIÓN (§40): la carne MOLIDA no tiene rendimiento

Una versión anterior de este documento usaba **80 % de rendimiento para la carne de la hamburguesa** y
concluía que 500 g netos costaban $31.25. **Eso está mal si la carne es MOLIDA** — la molida **no tiene
hueso**: su rendimiento es **100 %**.

**El rendimiento del 80 % aplica a los cortes con hueso**, no a la molida. El concepto sigue siendo
esencial, pero **muerde en otros insumos.**

### Rendimientos de arranque (semilla; el inventarista los ajusta con su realidad)

| Insumo | Rendimiento | Qué se tira |
|---|---|---|
| **Elote en mazorca** | **0.55** | ⚠️ **Olote y hojas — casi la MITAD del kilo comprado.** El peor de todos. |
| **Aguacate** | **0.70** | Hueso y cáscara |
| Papa **fresca** (en costal) | **0.80** | Cáscara y ojos |
| Corte de res **con hueso** | **0.80** | Hueso y grasa |
| Lechuga | **0.85** | Tronco y hojas feas |
| Apio · zanahoria | **0.85** | Puntas y recorte |
| Cebolla | **0.90** | Cáscara y raíz |
| Jitomate | **0.95** | Puntas |
| Pechuga de pollo sin hueso | **0.95** | Recorte |
| **Carne MOLIDA** · papa **congelada** · pan · quesos · salsas · polvos | **1.00** | **Nada. Vienen listos.** |

> **La lección de diseño:** el rendimiento **no es un impuesto general**, es una propiedad **de cada
> insumo** — y depende de **en qué presentación se compra**. La misma papa tiene rendimiento **0.80** en
> costal y **1.00** congelada. Por eso vive en el insumo, no en una constante.

---

## 3. El IVA — dónde SÍ va y dónde NO

> Usuario: *"Debemos sumar el IVA a los alimentos en los costos"*.

**Aquí hay que tener cuidado, porque el IVA se comporta distinto en cada lado.**

### 3.1 En la VENTA: el IVA **no es tuyo**

**LIVA art. 2-A: la comida PREPARADA causa IVA del 16 %** — *"inclusive […] cuando sean para llevar o para
entrega a domicilio"*. **"Para llevar" no te salva.**

```txt
Precio de menú (lo que el estudiante ve y paga):  $65.00   ← CON IVA INCLUIDO
Base gravable   =  65 / 1.16                    =  $56.03  ← lo que la COOPERATIVA se queda
IVA trasladado  =  65 − 56.03                   =   $8.97  ← NO es tuyo. Es del SAT.
```

> **Regla dura: la ganancia y el food cost se calculan contra los $56.03, NUNCA contra los $65.**
> Calcularlos contra el precio bruto **infla el margen ~16 puntos** y te hace creer que ganas cuando no.

### 3.2 En la COMPRA: **casi todo el alimento es 0 %** — pero hay trampas

⚠️ **CORRECCIÓN (2026-07-14).** Una versión anterior de este documento decía que solo la "materia prima
cruda" iba a 0 %. **Es más amplio que eso**, y equivocarse **infla el costo**.

**LIVA art. 2-A, fracc. I, inciso b): tasa 0 % a la enajenación de *productos destinados a la alimentación
humana*.** Eso incluye mucho más de lo que parece:

| Qué compras | IVA | |
|---|---|---|
| Carne · pollo · queso · crema · leche · huevo · verdura · fruta · tortilla · pan · arroz · harina | **0 %** | obvio |
| **Aceite comestible · mayonesa · catsup · mostaza · aderezos · salsas · azúcar** | **0 %** | ⚠️ **son alimento.** No lo son "por ser procesados". |
| Gelatina en polvo · grenetina · flor de jamaica seca | **0 %** | alimento |
| **Desechables · vasos · charolas · bolsas · papel · gas LP · limpieza** | **16 %** | **no son alimento** |

**Las excepciones que SÍ gravan 16 % aunque suenen a comida** *(art. 2-A, fracc. I, inciso b, numerales 1–6)*:

| Excepción | Nos pega en… |
|---|---|
| **Bebidas distintas de la leche**, y **jarabes, concentrados, polvos o esencias que al diluirse den refrescos** | ⚠️ **El concentrado / polvo de horchata.** Cae aquí. |
| **Saborizantes, microencapsulados y aditivos alimenticios** | ⚠️ **Zona gris del chile en polvo tipo Tajín**: como *sazonador de mesa* se vende a 0 %; facturado como *saborizante* es 16 %. **Hay que mirar la factura del proveedor, no adivinar.** |
| Chicles · caviar, salmón ahumado, angulas · alimento para mascotas | no aplica |

> **Por eso `ingredients.iva_rate` es una columna por insumo, y no un booleano "es comida".** La ley no
> divide entre crudo y procesado: divide entre **alimento** y **no alimento**, con excepciones puntuales.

**Y aquí está la bifurcación que decide si el IVA es costo o no:**

```txt
¿La cooperativa puede ACREDITAR el IVA que paga?

SÍ  →  el IVA de compra se RECUPERA        →  costo = base sin IVA   ($100)
NO  →  el IVA de compra es DINERO PERDIDO  →  costo = total pagado   ($116)
```

**Esto depende del régimen fiscal de la cooperativa** (que hay que **leer de su Constancia de Situación
Fiscal**, no adivinar). Si es **`603` — PM con Fines no Lucrativos** (lo común en cooperativas escolares),
la acreditación puede estar limitada → **el IVA pagado se vuelve costo real**.

→ **Es un ajuste por cooperativa: `branches.iva_acreditable` (booleano).** No una constante en el código.

### 3.3 La consecuencia que la cooperativa debe saber **antes**, no en la declaración

```txt
VENTAS   →  16 % de IVA trasladado  (mucho)
COMPRAS  →   0 % de IVA acreditable (casi nada — la materia prima cruda no lo causa)
───────────────────────────────────────────────────────────────────
IVA A PAGAR  ≈  todo el IVA que cobraste
```

**El IVA que cobras es casi todo IVA a pagar.** Hay que mostrarlo como KPI, no descubrirlo en la
declaración.

---

## 4. La cadena completa, con números

### Paso 1 — El inventarista registra la compra

```txt
ENTRADA:  "3 kg de carne, pagué $150"

  qty_comprada    = 3
  unidad_compra   = kg
  factor_a_base   = 1000          ← va en el LOTE (§1, capa 2)
  total_pagado    = $150.00
  iva_insumo      = 0 %           ← carne cruda

  base_gravable   = 150 / (1 + 0) = $150.00     (si fuera empaque con IVA y NO acreditable → $174)
  qty_base        = 3 × 1000      = 3 000 g
  ───────────────────────────────────────────────
  costo_unitario  = 150 / 3000    = $0.050000/g    ← SEIS decimales. NUNCA dos.
```

**⚠️ Precisión:** un aceite de $37/L son **$0.037/ml**. Con 2 decimales sería $0.04 → **8 % de error en
cada plato**. `NUMERIC(14,6)`, y **se redondea UNA SOLA VEZ, al final** (al total de la línea).

### Paso 2 — El CPP absorbe la nueva compra

```txt
nuevo_promedio = (stock × promedio_actual + qty_entrada × costo_entrada) / (stock + qty_entrada)
```

**Ejemplo:** tienes 1 000 g a $0.05 y compras 3 000 g a $0.06 →
`(1000×0.05 + 3000×0.06) / 4000` = **$0.0575/g**

**Dos landmines, blindados:**
- **`stock = 0`** → **NO dividir entre cero ni resetear el promedio.** Se **congela** el anterior.
- **Stock negativo** → **prohibido en la BD** (ya es BR-011). Con stock negativo el promedio se vuelve basura.

**¿Por qué CPP y no FIFO?** Son **dos preguntas distintas** que todo el mundo confunde:
- *"¿Qué bolsa saco del refri?"* → **FEFO** (lo que caduca primero). Se necesita **de todos modos**, por
  Salubridad. Es práctica de almacén.
- *"¿Cuánto costó?"* → **CPP**. `O(1)`, sin partir lotes, y —lo que importa— **sin desbaratar capas de
  costo cuando se cancela un pedido**, que es exactamente donde FIFO acumula los bugs.

### Paso 3 — La receta cobra el costo (con rendimiento)

**Hamburguesa de la casa** — precio de menú **$65 (IVA incluido)**

| Insumo | Neto | Rend. | **Bruto** | $/u. base | **Costo** |
|---|---|---|---|---|---|
| Pan de hamburguesa | 1 pza | 1.00 | 1 pza | $6.000000 | **$6.00** |
| **Carne de res** | **500 g** | **0.80** | **625 g** | $0.050000 | **$31.25** |
| Queso amarillo | 20 g | 1.00 | 20 g | $0.150000 | $3.00 |
| Lechuga | 15 g | 0.85 | 17.65 g | $0.040000 | $0.71 |
| Jitomate | 30 g | 0.95 | 31.58 g | $0.035000 | $1.11 |
| Cebolla | 10 g | 0.90 | 11.11 g | $0.030000 | $0.33 |
| Mayonesa | 10 ml | 1.00 | 10 ml | $0.060000 | $0.60 |
| Catsup | 10 ml | 1.00 | 10 ml | $0.045000 | $0.45 |
| Sal y especias | — | — | `track_stock = false` | — | $0.20 |
| | | | | **COSTO** | **$43.65** |

### Paso 4 — La verdad

```txt
Precio de menú        $65.00   (con IVA)
Base (ingreso real)   $56.03   = 65 / 1.16      ← contra ESTO se mide todo
IVA trasladado         $8.97   → al SAT

Costo de la receta    $43.65
─────────────────────────────
GANANCIA              $12.38
FOOD COST               78 %   ⚠️  (objetivo de la coop: ≤ 45 %)
PRECIO MÍNIMO        $126.59   = (43.65 / 0.40) × 1.16
```

**Con 150 g de carne** (una hamburguesa normal): costo **$21.78** · food cost **39 %** ✅ · ganancia **$34.25**.

---

## 4-bis. Las unidades — *"no tendrá kg el agua"*

**Tienes razón, y la regla es más fuerte de lo que parece: la unidad base NO puede ser kg ni L. Nunca.**

```txt
UNIDADES BASE PERMITIDAS (las únicas tres):
    g     — todo lo que se pesa      (carne, queso, lechuga, azúcar, jamaica, papa)
    ml    — todo lo que se vierte    (agua, crema, mayonesa, aceite, salsas)
    pza   — todo lo que se cuenta    (pan, vaso, tortilla, limón)
```

**Por qué solo tres, y por qué las chicas:**

- **Elimina toda ambigüedad.** *"3 de carne"* no significa nada; *"3000 g"* sí. Si permites kg **y** g, un
  día alguien captura `0.5` pensando en kilos y el sistema entiende medio gramo. **La unidad base es la
  báscula única de la cocina.**
- **kg y L son unidades de COMPRA, no de medida.** Viven en la línea de compra, con su
  **`factor_a_base`** (§1, capa 2): *"3 **kg**"* → `qty: 3, unit: 'kg', factor: 1000` → **3 000 g**.
- **La receta solo puede hablar en la unidad base del insumo.** No la elige el usuario: **la hereda del
  insumo**. La UI la muestra, no la deja escoger. **Es imposible pedir "1 kg de agua".**

**Y el agua, en concreto:** el agua de jamaica no se mide en kg. Se mide en **ml** — y ni siquiera se
cuenta: **el agua de la llave es `track_stock = false`**. Lo que sí se costea es la **flor de jamaica (g)**,
el **azúcar (g)**, el **hielo (g)** y el **vaso (pza)**.

---

## 5. ⚠️ `track_stock` — el fallo #1 en la práctica

**La sal.** Nadie la cuenta nunca. Si entra en el cálculo de disponibilidad, el sistema reporta
**0 hamburguesas para siempre**.

```txt
track_stock = false  →  NO entra en el mínimo de disponibilidad
                     →  SÍ entra en el costeo (con un costo estimado por porción)
```

---

## 6. Disponibilidad derivada — *"el sistema con lo que llena de stock quita o mantiene alimentos"*

```txt
max_unidades = floor( MIN sobre insumos BASE con track_stock de ( stock_i / qty_BRUTA_i ) )
```

**Cuatro detalles que deciden si funciona o no:**

1. **La cantidad es BRUTA, no neta.** Con la neta sobreestimas la disponibilidad.
2. **Solo los insumos BASE** (`is_default && !is_customizable`). Si no hay lechuga, **la hamburguesa se
   sigue vendiendo sin lechuga** — tumbar una venta de $65 por falta de lechuga es peor negocio que
   servirla sin ella.
3. **Devuelve CUÁL es el limitante.** *"Te quedan 4 hamburguesas — te falta **pan**"* es accionable.
   *"4"* no lo es.
4. **⚠️ Es una ESTIMACIÓN, no una reserva.** Si la hamburguesa y el combo comparten la carne, cada uno
   reporta su máximo **por separado** y no se pueden vender los dos.
   **La corrección real es DESCONTAR al aceptar el pedido** — con el mismo `UPDATE … WHERE stock >= qty`
   atómico que ya usamos. **Sin eso, dos clientes venden la misma última hamburguesa.**

**Y el interruptor manual sobrevive:**
```txt
disponible = is_available (el admin puede tumbarlo)  &&  max_unidades > 0 (derivado del stock)
```

---

## 7. El costo se **CONGELA** en el pedido

Son **dos números distintos**, y confundirlos es el bug que nadie ve hasta que hay seis meses de datos podridos:

| | Qué | Cuándo |
|---|---|---|
| **Costo teórico vigente** | `Σ(bruta × costo_actual)` | Se recalcula al vuelo. Es lo que `inventario` mira para decidir precios. |
| **Costo del pedido** | **SNAPSHOT inmutable** | Se congela al confirmar. **Nunca se recalcula.** |

> **Una compra de mañana NO puede cambiar el margen de ayer.**

Es **el mismo principio que ya aplicamos al precio** (BR-015). Ahora al **costo**.
Sin el snapshot, el reporte de rentabilidad histórica **cambia solo** cada vez que sube la carne.

---

## 7-bis. La REOFERTA — y por qué tu forma de plantearla te haría tirar comida

> Usuario: *"si antes le ganaba 20 pesos a la hamburguesa ahora le gano 15"*.

**Ese encuadre está mal, y el error cuesta dinero.**

Cuando una hamburguesa **ya preparada** no se recoge, **los insumos YA se consumieron**. Ese costo está
**hundido**: no vuelve. La pregunta ya **no** es *"¿cuánto le gano comparado con la venta normal?"*, porque
**la venta normal ya ocurrió y fracasó**.

> **La alternativa real no es vender a $65. La alternativa real es LA BASURA.**

### Las tres columnas que el panel debe mostrar

Con la Hamburguesa a **150 g** (costo **$21.78**, precio **$65**, reoferta a **$50**):

| | Venta normal | **Reoferta** | **Si la tiras** |
|---|---|---|---|
| Precio (con IVA) | $65.00 | $50.00 | — |
| Ingreso real (`/1.16`) | $56.03 | $43.10 | $0.00 |
| Costo (**ya gastado**) | $21.78 | $21.78 | $21.78 |
| **RESULTADO** | **+$34.25** | **+$21.32** | **−$21.78** |

**La reoferta no te bajó la ganancia de $34 a $21. Te rescató de una PÉRDIDA de $21.78 y la convirtió en
una GANANCIA de $21.32.** Eso es un giro de **$43.10** — que es, exactamente, todo el ingreso recuperado.

### La regla de decisión (y la que la contrapesa)

```txt
Precio de NO-PÉRDIDA (reoferta) = costo × 1.16 = $25.26
   ↑ debajo de esto SIGUES perdiendo dinero… pero MENOS que tirándola.
```

**Contra el costo hundido, cualquier precio > $0 le gana a la basura.** Si anclas el piso al costo,
**tirarás hamburguesas que podías vender en $20**.

**PERO** hay una razón real para poner un piso, y **no es el costo**: es la **canibalización**. Si la
reoferta es muy barata y muy predecible, **los estudiantes dejan de pedir a precio normal y esperan al
descuento**. Eso destruye el negocio de precio lleno, que es el que de verdad paga.

```txt
piso_reoferta = max( costo × 1.16 ,  precio_normal × factor_anti_canibalización )
                     └── no perder ──┘  └── no enseñar al cliente a esperar ──┘
```

→ **`app_settings.reoferta_piso_pct` (default 0.60).** Es un ajuste de negocio **por cooperativa**, no una
constante. Y como todo lo demás: **advertencia, no bloqueo** — mostrador puede bajar más, con override
registrado en el `audit-log`.

### Y si NO se re-oferta (o la reoferta vence)

Entonces sí: **MERMA TOTAL.** Los insumos se registran como merma incidental (motivo: *no recogido*), y la
pérdida es el costo completo. Eso es lo que la reoferta **evita**, y es la métrica que hay que ponerle
enfrente a mostrador:

> **"Recuperaste $43.10 que se iban a la basura."**

---

## 8. La alerta que salva dinero

No es la del momento de fijar el precio. Es esta:

> **Re-evaluar el margen cuando SUBE el costo de un insumo.**
> Un producto puede quedar **bajo el agua sin que nadie lo haya tocado.**

```txt
Sube la carne de $50/kg a $65/kg
  → el CPP de la carne sube
  → el costo de la Hamburguesa sube
  → su food cost pasa de 39 % a 47 %
  → 🔔 "Hamburguesa cayó bajo el margen mínimo. Precio sugerido: $78"
```

**Y el sistema NO re-precia solo.** La decisión de precio es humana: advertencia + override explícito +
entrada en el `audit-log` (que ya existe). El admin legítimamente puede querer un producto gancho.

---

## 9. Modelo de datos (lo que este diseño obliga)

```txt
ingredients          base_unit      'g' | 'ml' | 'pza'
                     yield_pct      NUMERIC(5,4)   ← el rendimiento. 0.80 = carne con hueso
                     track_stock    boolean        ← ⚠️ la sal. Ver §5
                     iva_rate       NUMERIC(5,4)   ← 0.00 cruda · 0.16 empaques/gas
                     stock          NUMERIC(14,3)  CHECK >= 0
                     avg_unit_cost  NUMERIC(14,6)  ← SEIS decimales (§4, paso 1)

ingredient_purchases qty_purchased · purchase_unit · factor_to_base   ← el factor va AQUÍ (§1)
  (los LOTES)        total_cost · unit_cost NUMERIC(14,6) · expires_at (FEFO) · supplier

stock_movements      COMPRA(+) · CONSUMO_VENTA(−) · MERMA(−, motivo) · AJUSTE_CONTEO(±)
  (LIBRO MAYOR)      append-only. Stock = SUM(movimientos). El ledger es la verdad.

product_ingredients  qty_net NUMERIC(14,3)   ← 500 (g). NO un booleano.
  (LA RECETA)        is_default · is_customizable

order_item_ingredients   name_snapshot · qty_gross_snapshot · unit_cost_snapshot   ← §7

products             price          ← CON IVA incluido (lo que ve el estudiante)
                     iva_rate       NUMERIC(5,4) DEFAULT 0.16   ← comida preparada

branches             iva_acreditable  boolean   ← §3.2. Depende del régimen. LEER la CSF.
app_settings         food_cost_max    NUMERIC(5,4) DEFAULT 0.45  ← coop, no restaurante
```

---

## 10. Lo que sigue faltando (§40 — honestidad)

| Falta | Por qué no ahora |
|---|---|
| **Sub-recetas** (la salsa es producto *y* insumo) | Explosión recursiva + ciclos. Se añade cuando exista la primera salsa que se prepare aparte. |
| **Proveedores** como entidad, con historial de precios | El lote guarda `supplier` como texto. Suficiente para negociar. |
| **Traspasos entre sucursales** | Hay multi-sucursal, pero no lo pediste. |
| **Recetas versionadas** (`recipe_version_id` en la línea del pedido) | El `qty_gross_snapshot` ya congela la cantidad. Versionar la receta entera es el paso siguiente. |
| **Costo de mano de obra y gastos fijos** | El food cost solo cubre **materia prima**. La ganancia real también paga gas, luz y renta. **Esto es lo más grande que falta**, y hay que decirlo: *"ganancia" aquí significa margen bruto sobre insumos*, no utilidad neta. |

---

*Referencias: `rules.md` §0 · §38 · §40 · §43 · §46 · BR-011 · BR-015.
LIVA art. 2-A (IVA 16 % en alimentos preparados). ADR pendiente: **D-050**.*
