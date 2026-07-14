# Recetas, insumos y costos — UTC Pick Sazón

> **Qué es este documento.** El **catálogo canónico** de las 10 recetas de la cooperativa, sus 68 insumos,
> los rendimientos y los costos de compra. Es la **semilla** del motor de costeo
> ([`motor-de-costeo-design.md`](../superpowers/specs/2026-07-14-motor-de-costeo-design.md)) y la fuente del
> `seed-demo.sql`.
>
> **Fecha de corte:** 2026-07-14 · **Plaza:** Ciudad de México

---

# 🚨 LO PRIMERO: TODO ESTE DOCUMENTO ES UNA **SUGERENCIA**

**Ninguna cantidad y ningún precio de aquí es una verdad del negocio. Son SEMILLA DE DEMO.**

```txt
EL SISTEMA NO SABE CUÁNTO CUESTA UNA HAMBURGUESA.
El sistema sabe SUMAR lo que el inventarista le dice que lleva.

  El inventarista captura:  sus insumos · sus gramajes · sus compras reales
  El sistema calcula:       costo · food cost · ganancia · disponibilidad · alertas
```

- **Los gramajes son un punto de partida.** La hamburguesa **podría llevar 180 g de carne y costar $70** —
  y el sistema costearía **eso**, con **todos los insumos que el inventarista declare**, no con los de esta
  tabla. Los 130 g de aquí son una sugerencia investigada, **no una receta oficial de la cooperativa**.
- **Los precios son de mercado, pero de DEMO.** Sirven para que el sistema arranque con algo plausible y
  para **probar que la aritmética funciona**. La cooperativa costea **con sus propias compras**.
- **El valor del sistema NO está en estos números: está en que el número se calcule solo** — y en que
  **grite** cuando un producto no da margen, cuando sube un insumo, o cuando se acaba el pan.

> **Por eso la sección §9 (banderas rojas) no dice "tu negocio está mal".** Dice: *"con estos números
> sugeridos, esto es lo que el sistema te gritaría."* **Que es exactamente para lo que existe.**

---

## 0. Método de captación de los datos

> **Regla §15 del proyecto (no-fabrication):** todo dato aquí está marcado como **CITADO** (con fuente
> verificable) o **ESTIMADO** (juicio profesional). **No se mezclan.**
> *(Una versión anterior de este documento **sí los mezcló** y llegó a **fabricar una cifra** con una
> fuente real detrás. Está corregido y registrado en §6 y §7 — no borrado.)*

| Fuente | Tipo de acceso | Método | Fecha |
|---|---|---|---|
| **SNIIM — Secretaría de Economía** | **Consulta web pública** (formulario `.aspx`) | Lectura directa de la tabla de mayoreo, Central de Abasto de Iztapalapa. Los precios vienen **por presentación comercial** (arpilla, caja, docena) y se dividieron a unidad base. | 2026-07-14 |
| **PROFECO — "Quién es Quién en los Precios"** | **Portal público de datos abiertos** | ⚠️ **CORRECCIÓN:** una versión anterior afirmaba haber usado el endpoint `GET /api/precios?clave_ciudad=0901`. **Ese llamado devuelve `{"success":false,"message":"El criterio de búsqueda son obligatorios","data":[]}` — cero filas.** El método real fue **consulta del portal**, no una API con esos parámetros. Se corrige para que sea reproducible. | 2026-07-14 |
| **SAT — Ley del IVA (art. 2-A)** | Texto de ley, portal oficial | Lectura directa. **Verificado:** dice 0 % a *"productos destinados a la alimentación humana"* y **16 % a los preparados, *"inclusive cuando sean para llevar"***. | 2026-07-14 |
| **Literatura culinaria** (recetas mexicanas, fichas de *food service*) | Consulta web pública | Gramajes de porción. Las conversiones "cucharada → gramo" son **ESTIMACIÓN**. | 2026-07-14 |
| **Sam's Club · Walmart** | ⚠️ **BLOQUEADO** | Devuelven captcha a la lectura automatizada. **Los precios de granel NO se pudieron capturar** → todo lo de *food service* a granel es **ESTIMADO**. *(Ver §6: una versión anterior violó esto.)* | 2026-07-14 |

### 0.1 Convenciones

1. **Unidad base: solo `g`, `ml`, `pza`.** Nunca kg ni L — esas son unidades de **compra**, y viven en la
   línea de compra con su factor de conversión.
2. **Cantidad NETA = lo que se arma en la porción, medida en CRUDO** (la carne cruda ya formada, la papa
   congelada antes de freír).
3. **El rendimiento (*yield*) es merma de LIMPIEZA**, no de cocción: cuánta materia prima útil sale de lo
   que compras (quitar cáscara, tronco, hueso, olote).
   **La merma de cocción NO se modela** — la receta declara crudo, que es lo que sale del almacén y lo que
   ya pagaste. Restarla otra vez sería **contar la pérdida dos veces**.
4. **`track_stock = false`** para lo que nadie cuenta jamás (sal, especias, popotes). **Se costea, pero no
   bloquea la disponibilidad.** *(Si la sal entrara en el cálculo, el sistema reportaría "0 hamburguesas"
   para siempre.)*
5. **Costo por unidad base con 6 decimales.** Un aceite de $37/L son **$0.037/ml**; con 2 decimales sería
   $0.04 → **8 % de error en cada plato**. Se redondea **una sola vez, al final**.

### 0.2 Clasificación de los insumos

```txt
BASE       No se puede quitar (el pan, la carne, la tortilla).
           ⚠️ GOBIERNA LA DISPONIBILIDAD: si se acaba, el producto sale del menú.
ESTÁNDAR   Viene por defecto, el cliente puede quitarlo (lechuga, jitomate, mayonesa).
EXTRA      No viene, el cliente puede agregarlo (tocino, aderezo mango habanero).
```

---

## 1. Las 10 recetas

### 1.1 Hamburguesa de la casa — $65

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Pan para hamburguesa | 1 | pza | 100 % | **BASE** | ✅ |
| Carne molida de res 80/20 (cruda, formada) | 130 | g | 100 % | **BASE** | ✅ |
| Tocino en rebanadas | 20 | g | 100 % | ESTÁNDAR | ✅ |
| Queso amarillo (rebanada) | 1 | pza | 100 % | ESTÁNDAR | ✅ |
| Lechuga | 15 | g | **85 %** | ESTÁNDAR | ✅ |
| Jitomate | 30 | g | **95 %** | ESTÁNDAR | ✅ |
| Cebolla | 10 | g | **90 %** | ESTÁNDAR | ✅ |
| Mayonesa | 12 | g | 100 % | ESTÁNDAR | ✅ |
| Catsup | 10 | g | 100 % | ESTÁNDAR | ✅ |
| Mostaza | 5 | g | 100 % | ESTÁNDAR | ✅ |
| Aceite (plancha) | 3 | ml | 100 % | ESTÁNDAR | ✅ |
| Sal | 1 | g | 100 % | ESTÁNDAR | ❌ |
| Pimienta | 0.3 | g | 100 % | ESTÁNDAR | ❌ |
| Papel encerado / charola | 1 | pza | 100 % | **BASE** | ✅ |
| *Tocino extra* | 20 | g | 100 % | EXTRA | ✅ |
| *Queso extra (rebanada)* | 1 | pza | 100 % | EXTRA | ✅ |
| *Piña en rodaja* | 25 | g | 100 % | EXTRA | ✅ |
| *Jalapeño en rodajas* | 15 | g | 100 % | EXTRA | ✅ |
| *Aderezo mango habanero* | 20 | g | 100 % | EXTRA | ✅ |

> **Calibración (ESTIMADO).** 130 g de carne cruda ≈ **105 g cocida** (merma de cocción ~20 %). Es una
> hamburguesa "de casa" honesta a $65. Alternativas: **120 g** si se quiere margen, **150 g** si se quiere
> que se sienta grande. **Nunca 500 g** — eso es medio kilo de carne: costaría **$65.00 solo de carne** (500 g × $0.130/g),
> el producto entero saldría en **~$79**, y el precio tendría que ser **~$204** para cerrar al 45 %.
> **La carne MOLIDA no tiene rendimiento**: ya viene sin hueso.

### 1.2 Boneless BBQ — $58

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Pechuga de pollo sin hueso (cruda, en cubos) | 160 | g | **95 %** | **BASE** | ✅ |
| Harina para empanizar (sazonada) | 25 | g | 100 % | **BASE** | ✅ |
| Huevo | 0.5 | pza | 100 % | **BASE** | ✅ |
| Leche (para el baño) | 20 | ml | 100 % | ESTÁNDAR | ✅ |
| Aceite para freír (absorción) | 15 | ml | 100 % | **BASE** | ✅ |
| Salsa BBQ | 45 | ml | 100 % | **BASE** | ✅ |
| Aderezo ranch | 30 | ml | 100 % | ESTÁNDAR | ✅ |
| Bastones de apio | 25 | g | **85 %** | ESTÁNDAR | ✅ |
| Bastones de zanahoria | 20 | g | **85 %** | ESTÁNDAR | ✅ |
| Sal | 1 | g | 100 % | ESTÁNDAR | ❌ |
| Pimienta | 0.3 | g | 100 % | ESTÁNDAR | ❌ |
| Ajo en polvo | 0.5 | g | 100 % | ESTÁNDAR | ❌ |
| Charola / vaso de 12 oz | 1 | pza | 100 % | **BASE** | ✅ |
| *Salsa mango habanero* | 30 | g | 100 % | EXTRA | ✅ |
| *Salsa buffalo* | 45 | g | 100 % | EXTRA | ✅ |
| *Ranch extra* | 30 | ml | 100 % | EXTRA | ✅ |

> **Calibración (CITADO + estimación).** La porción de *food service* es de 3–4 oz (85–113 g); una orden de
> 6–8 piezas pesa ~140–200 g (Domino's: 8 pzas = 202 g; SnapCalorie: 1 porción = 140 g). Se puso **160 g en
> crudo** → ~125 g fritos, dentro del rango.
> **El aceite (15 ml) es la ABSORCIÓN real por porción**, no lo que cabe en la freidora — la fritura absorbe
> ~8–12 % del peso *(estimación)*.
> **El empanizado:** se ponen ~35 g en el bowl, pero **solo ~25 g se adhieren**. Ese 25 es el neto.

### 1.3 Quesadilla de tinga — $38

> **Nota de modelado.** La tinga se modela **aplanada**: sus componentes son insumos directos, para que el
> encargado ajuste el pollo **sin tocar una sub-receta**. *(Cuando el sistema soporte sub-recetas, la
> alternativa limpia es un insumo `Tinga de pollo (preparada)` = 85 g.)*

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Tortilla de harina 30 cm | 1 | pza | 100 % | **BASE** | ✅ |
| Queso Oaxaca | 60 | g | 100 % | **BASE** | ✅ |
| Pechuga de pollo (cruda, para deshebrar) | 70 | g | **95 %** | **BASE** | ✅ |
| Jitomate | 45 | g | **95 %** | **BASE** | ✅ |
| Cebolla | 20 | g | **90 %** | **BASE** | ✅ |
| Chile chipotle adobado | 8 | g | 100 % | **BASE** | ✅ |
| Aceite | 6 | ml | 100 % | ESTÁNDAR | ✅ |
| Crema | 15 | g | 100 % | ESTÁNDAR | ✅ |
| Lechuga rallada | 10 | g | **85 %** | ESTÁNDAR | ✅ |
| Ajo | 1 | g | **90 %** | ESTÁNDAR | ❌ |
| Sal / laurel / orégano | 1 | g | 100 % | ESTÁNDAR | ❌ |
| Charola / papel | 1 | pza | 100 % | **BASE** | ✅ |
| *Queso extra* | 30 | g | 100 % | EXTRA | ✅ |
| *Aguacate* | 25 | g | **70 %** | EXTRA | ✅ |
| *Salsa verde o roja* | 20 | g | 100 % | EXTRA | ✅ |

> **Nota honesta (ESTIMADO).** 70 g de pechuga cruda rinden ~50 g de pollo deshebrado (merma de cocción
> ~30 %), que con el jitomate y la cebolla forman ~85 g de tinga terminada.
> **Esa merma NO está en el yield del 95 %** (ese 95 % es solo limpieza/recorte): está implícita en que la
> cantidad **se declara en crudo**. Ver §0.1, regla 3.

### 1.4 Combo estudiante — $50

> **Qué contiene y por qué.** Hamburguesa **sencilla** (no la "de la casa": sin tocino, 90 g de carne) +
> papas chicas (80 g) + agua fresca del día (400 ml).
> **Justificación:** la Hamburguesa de la casa **sola** cuesta $65 — el combo **no puede contenerla**.
> A $50, el combo tiene que ser **la versión austera de los tres productos que ya se venden**.

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Pan para hamburguesa | 1 | pza | 100 % | **BASE** | ✅ |
| Carne molida de res 80/20 (cruda, formada) | 90 | g | 100 % | **BASE** | ✅ |
| Lechuga | 12 | g | **85 %** | ESTÁNDAR | ✅ |
| Jitomate | 25 | g | **95 %** | ESTÁNDAR | ✅ |
| Cebolla | 8 | g | **90 %** | ESTÁNDAR | ✅ |
| Mayonesa | 8 | g | 100 % | ESTÁNDAR | ✅ |
| Catsup | 8 | g | 100 % | ESTÁNDAR | ✅ |
| Mostaza | 4 | g | 100 % | ESTÁNDAR | ✅ |
| Papa a la francesa congelada | 80 | g | 100 % | **BASE** | ✅ |
| Aceite para freír (absorción) | 8 | ml | 100 % | **BASE** | ✅ |
| Agua fresca del día (preparada) | 400 | ml | 100 % | **BASE** | ✅ |
| Vaso 500 ml + tapa | 1 | pza | 100 % | **BASE** | ✅ |
| Charola / bolsa | 1 | pza | 100 % | **BASE** | ✅ |
| Sal | 1.5 | g | 100 % | ESTÁNDAR | ❌ |
| Pimienta | 0.3 | g | 100 % | ESTÁNDAR | ❌ |
| *Queso amarillo (rebanada)* | 1 | pza | 100 % | EXTRA | ✅ |
| *Tocino* | 20 | g | 100 % | EXTRA | ✅ |
| *Catsup extra para papas* | 20 | g | 100 % | EXTRA | ✅ |

> 🚩 **BANDERA ROJA — el precio no da.** Este combo sale con un **food cost de ~65–70 % sobre $50**.
> Es viable en una cooperativa **subsidiada**, pero es **delgado**.
> **Las tres palancas:** bajar la carne a 80 g · dejar el queso en `EXTRA` (ya está) · **subir el combo a $60**.
> **Verificar con los precios reales de compra de la cooperativa antes de fijar el precio.**
>
> **Nota de modelado:** `Agua fresca del día (preparada)` se deja como insumo en `ml`, porque **el sabor
> rota**. Si no se quieren sub-preparaciones, se aplana con la receta más barata (jamaica): jamaica 6 g +
> azúcar 28 g + agua 400 ml.

### 1.5 Papas con queso — $32

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Papa a la francesa congelada | 110 | g | 100 % | **BASE** | ✅ |
| Aceite para freír (absorción) | 12 | ml | 100 % | **BASE** | ✅ |
| Queso cheddar fundido / líquido | 40 | g | 100 % | **BASE** | ✅ |
| Sal | 1 | g | 100 % | ESTÁNDAR | ❌ |
| Vaso / charola | 1 | pza | 100 % | **BASE** | ✅ |
| *Tocino en trozos* | 20 | g | 100 % | EXTRA | ✅ |
| *Jalapeño en rodajas* | 15 | g | 100 % | EXTRA | ✅ |
| *Chile en polvo* | 1 | g | 100 % | EXTRA | ❌ |
| *Limón* | 0.5 | pza | 100 % | EXTRA | ✅ |

> 🚩 **BANDERA ROJA — su food cost es peor que el del sencillo (46 % vs. 43 %)**, aunque **gana más en
> términos absolutos**.
>
> ⚠️ **CORRECCIÓN (§40).** Una versión anterior afirmaba aquí que *"gana MENOS que su hermano simple"* y que
> *"pierde dinero contra el sencillo"*. **Es FALSO — la resta estaba mal hecha.** Ver **§9.3**, donde se
> demuestra que **gana $1.11 MÁS**: lleva **10 g menos de papa** y **no lleva los 20 g de catsup** que sí
> lleva la sencilla. *(La bandera se corrigió en §9.3 y **se quedó viva aquí** — el documento se desmentía a
> sí mismo a 580 líneas de distancia.)*
>
> **Variante papa fresca:** si se compra papa en costal en vez de congelada, el insumo es
> `Papa (fresca)` **140 g** con **yield 80 %** (cáscara + ojos).

### 1.6 Papas a la francesa — $28

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Papa a la francesa congelada | 120 | g | 100 % | **BASE** | ✅ |
| Aceite para freír (absorción) | 12 | ml | 100 % | **BASE** | ✅ |
| Sal | 1 | g | 100 % | ESTÁNDAR | ❌ |
| Catsup | 20 | g | 100 % | ESTÁNDAR | ✅ |
| Vaso / charola | 1 | pza | 100 % | **BASE** | ✅ |
| *Aderezo ranch* | 30 | ml | 100 % | EXTRA | ✅ |
| *Queso cheddar fundido* | 40 | g | 100 % | EXTRA | ✅ |
| *Chile en polvo* | 1 | g | 100 % | EXTRA | ❌ |
| *Limón* | 0.5 | pza | 100 % | EXTRA | ✅ |

> **Calibración (CITADO).** El estándar de *food service* ronda **85–88 g** (McCain Foodservice); la porción
> típica servida es de **100–150 g**. Se pusieron **120 g**: generoso para cooperativa, defendible a $28.

### 1.7 Esquites en vaso — $22 *(vaso de 250 ml / 8 oz)*

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Grano de elote (congelado o desgranado) | 150 | g | 100 % | **BASE** | ✅ |
| Cebolla | 10 | g | **90 %** | **BASE** | ✅ |
| Mayonesa | 20 | g | 100 % | ESTÁNDAR | ✅ |
| Queso cotija rallado | 15 | g | 100 % | ESTÁNDAR | ✅ |
| Mantequilla | 5 | g | 100 % | ESTÁNDAR | ✅ |
| Limón | 0.5 | pza | 100 % | ESTÁNDAR | ✅ |
| Chile en polvo (piquín) | 2 | g | 100 % | ESTÁNDAR | ❌ |
| Epazote | 1 | g | 100 % | ESTÁNDAR | ❌ |
| Sal | 1 | g | 100 % | ESTÁNDAR | ❌ |
| Agua purificada *(caldo de cocción)* | 60 | ml | 100 % | **BASE** | ✅ |
| Vaso 250 ml | 1 | pza | 100 % | **BASE** | ✅ |
| Cuchara desechable | 1 | pza | 100 % | ESTÁNDAR | ❌ |
| *Crema* | 15 | g | 100 % | EXTRA | ✅ |
| *Chile en polvo extra / Tajín* | 2 | g | 100 % | EXTRA | ❌ |
| *Queso cotija extra* | 15 | g | 100 % | EXTRA | ✅ |
| *Chicharrón en trozos* | 10 | g | 100 % | EXTRA | ✅ |

> **Gramajes (CITADO → convertido, ESTIMADO).** Las recetas mexicanas describen la porción como
> *"1 cucharada de mayonesa, 1 cucharada de crema, queso cotija rallado generosamente, chile en polvo y el
> jugo de medio limón"* (México en mi Cocina; Isabel Eats).
> **La conversión cucharada → gramo es estimación:** 1 cda de mayonesa ≈ 14–15 g (se subió a **20 g**
> porque en la calle se pone más), 1 cda de crema ≈ 15 g, "queso generoso" ≈ 15 g.
> Los **150 g de grano** son estimación para un vaso de 250 ml (el grano ocupa ~60 % del vaso; el resto es
> caldo y toppings).
>
> ⚠️ **Si se compra elote EN MAZORCA** en vez de grano congelado: el insumo es `Elote en mazorca` con
> **yield ~55 %** (olote + hojas) → **150 g netos = ~273 g brutos**.
> Con el factor de §4.0 (**350 g/mazorca**), eso son **≈ 0.78 mazorcas por vaso** — no 1.5, como decía una
> versión anterior *(que además se contradecía con su propio factor)*.
> **Es el peor rendimiento del catálogo… y aun así, la compra MÁS BARATA por gramo útil** (§4.0).

### 1.8 Agua de horchata — $18 *(vaso de 500 ml)*

> **Cómo se modela.** **No** como polvo comercial, sino como **base concentrada casera + agua de dilución**,
> porque la cooperativa la prepara **en garrafón**. Las cantidades ya están **por vaso de 500 ml**,
> obtenidas dividiendo un lote de 10 L entre 20 vasos.
> *(El vaso de 600 ml existe, pero a $18 se come el margen. Si se usa 600, escalar todo ×1.2.)*

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Arroz blanco (crudo) | 25 | g | 100 % | **BASE** | ✅ |
| Azúcar | 35 | g | 100 % | **BASE** | ✅ |
| Leche en polvo | 10 | g | 100 % | ESTÁNDAR | ✅ |
| Agua purificada | 480 | ml | 100 % | **BASE** | ✅ ⚠️ |
| Canela en raja | 1.5 | g | 100 % | ESTÁNDAR | ❌ |
| Vainilla | 1 | ml | 100 % | ESTÁNDAR | ❌ |
| Hielo | 80 | g | 100 % | ESTÁNDAR | ❌ |
| Vaso 500 ml + tapa | 1 | pza | 100 % | **BASE** | ✅ |
| Popote | 1 | pza | 100 % | ESTÁNDAR | ❌ |

> **Base (CITADO → calibrado, ESTIMADO).** Las recetas usan **200 g de arroz + 1 L de agua** de remojo, se
> licúa, se cuela y **se completa hasta ~3 L** (Pati Jinich; Bon Viveur) → **≈ 65 g de arroz por litro final**.
> Se bajó a **50 g/L** (= 25 g por vaso de 500 ml) porque a $18 la cooperativa la hace más ligera —
> **esa calibración es estimación, no la receta citada**. El azúcar (70 g/L) y la leche en polvo también son
> estimación: las recetas dicen *"azúcar al gusto"*.

### 1.9 Agua de jamaica — $18 *(vaso de 500 ml)*

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Flor de jamaica seca | 8 | g | 100 % | **BASE** | ✅ |
| Azúcar | 35 | g | 100 % | **BASE** | ✅ |
| Agua purificada | 500 | ml | 100 % | **BASE** | ✅ ⚠️ |
| Hielo | 80 | g | 100 % | ESTÁNDAR | ❌ |
| Vaso 500 ml + tapa | 1 | pza | 100 % | **BASE** | ✅ |
| Popote | 1 | pza | 100 % | ESTÁNDAR | ❌ |

> **Modelado (CITADO).** Igual que la horchata: **concentrado + dilución**, aplanado a por-vaso.
> La proporción para agua fresca lista para tomar es de **10–15 g de flor por litro** (hasta 20 g para sabor
> intenso), y el concentrado se hace con 50 g/L y se diluye 1:3 (Radio Fórmula; Sabor a Tierra y Mar).
> Se pusieron **16 g/L = 8 g por vaso de 500 ml**, el extremo alto del rango, porque el agua de cooperativa
> **se sirve con color fuerte**.

### 1.10 Gelatina de mosaico — $15

> **Cómo se modela la porción.** Se cuaja en un molde de ~3 L y **se corta en 20 porciones de ~150 g**.
> Las cantidades de abajo son **el lote entre 20**. Si se corta más grande o más chico, el encargado
> **solo cambia las porciones por molde** y las cantidades escalan.

| Insumo | Neta | Unidad | Yield | Clasif. | `track_stock` |
|---|---|---|---|---|---|
| Gelatina de sabor en polvo (surtida, para cubos) | 9 | g | 100 % | **BASE** | ✅ |
| Leche condensada | 19 | g | 100 % | **BASE** | ✅ |
| Leche evaporada | 18 | g | 100 % | **BASE** | ✅ |
| Grenetina sin sabor | 1.4 | g | 100 % | **BASE** | ✅ |
| Agua purificada | 110 | ml | 100 % | **BASE** | ✅ ⚠️ |
| Vasito / plato desechable | 1 | pza | 100 % | **BASE** | ✅ |
| Cuchara desechable | 1 | pza | 100 % | ESTÁNDAR | ❌ |
| *Nuez picada* | 5 | g | 100 % | EXTRA | ✅ |

> **Derivación del lote (CITADO → ajustado, ESTIMADO).** Las recetas usan **4 sobres de gelatina de sabor +
> 1 lata de leche condensada (387 g) + 1 lata de leche evaporada (360 ml) + 2 sobres de grenetina de 14 g +
> 1 taza de agua**, y rinden **10–15 porciones** (Cocina Delirante; Recetas Nestlé; batchrecetas).
> **El lote se ajustó a 3 L / 20 porciones de 150 g** (≈180 g de polvo de sabor para 1.5 L de cubos +
> 1.5 L de base blanca), porque **la porción de cooperativa a $15 es más chica que la porción casera**.
> **Ese ajuste es estimación, no de la fuente.**

---

## 2. ⚠️ El agua purificada — decisión del usuario (2026-07-14)

> Usuario: *"El inventarista tiene la **obligación** de llenar el stock de agua disponible."*

**`Agua purificada` = `BASE` + `track_stock = true`.** Se captura **por garrafón** (unidad de compra,
`factor_a_base = 20 000` ml, ≈ **$0.002/ml**) y **se descuenta por porción**.

**Y eso convierte las alertas en el seguro de vida del modelo, no en un adorno:** si el agua llega a **0**,
**se caen CUATRO productos de golpe**.

| Si `Agua purificada` llega a 0, se caen… |
|---|
| **Agua de horchata · Agua de jamaica · Esquites en vaso** (caldo de cocción) **· Gelatina de mosaico** |

> ⚠️ **DOS CORRECCIONES ENCADENADAS (§40).** (1) Una versión decía *"las TRES bebidas"* — omitía Esquites y
> Gelatina. (2) La corrección **se pasó al otro extremo y dijo "CINCO"**, metiendo al **Combo**.
> **El Combo NO lleva `Agua purificada`:** lleva **`Agua fresca del día (preparada)`**, que es **otro
> insumo** (§10, hueco #5). **Son CUATRO.**
>
> *Una alerta que omite productos miente. Una que sobra, también.*

**Dos salvaguardas lo hacen seguro:**
1. **Alerta de stock mínimo** — avisa **antes** de llegar a 0, no después.
2. **El sistema nombra al insumo limitante y a TODO lo que se cae con él:**
   *"Agua purificada: quedan 2 garrafones (mínimo: 3). Sin ella se caen Horchata, Jamaica, Combo, Esquites
   y Gelatina."* **Accionable, no misterioso.**

---

## 3. Catálogo consolidado de insumos

### 3.0 ⚠️ Los rendimientos son **TODOS ESTIMADOS**

> §0 promete que **CITADO y ESTIMADO no se mezclan** — y **las tablas de rendimiento no llevaban marca**.
> **Ninguno de los `yield` de este documento está citado.** Son **juicio profesional** (0.55 el elote, 0.70
> el aguacate, 0.80 los cortes con hueso y la papa fresca, 0.85 la lechuga, 0.90 la cebolla, 0.95 el
> jitomate).
>
> **Es EL dato que el inventarista debe medir con una báscula**, no heredar de aquí: pesa lo que compra,
> pesa lo que le queda limpio, y divide. **El rendimiento es lo más fácil de medir y lo que más cuesta
> equivocarse.**

### 3.1 Insumos que SÍ se rastrean (55)

| # | Insumo | U. base | Yield | IVA compra | Aparece en |
|---|---|---|---|---|---|
| 1 | Pan para hamburguesa | pza | 100 % | 0 % | 1, 4 |
| 2 | Carne molida de res 80/20 | g | 100 % | 0 % | 1, 4 |
| 3 | Tocino | g | 100 % | 0 % | 1, 4, 5 |
| 4 | Queso amarillo (rebanada) | pza | 100 % | 0 % | 1, 4 |
| 5 | Lechuga | g | **85 %** | 0 % | 1, 3, 4 |
| 6 | Jitomate | g | **95 %** | 0 % | 1, 3, 4 |
| 7 | Cebolla | g | **90 %** | 0 % | 1, 3, **4**, 7 |
| 8 | Mayonesa | g | 100 % | 0 % | 1, 4, 7 |
| 9 | Catsup | g | 100 % | 0 % | 1, 4, 6 |
| 10 | Mostaza | g | 100 % | 0 % | 1, 4 |
| 11 | Aceite (freír / plancha) | ml | 100 % | 0 % | 1–6 |
| 12 | Pechuga de pollo sin hueso | g | **95 %** | 0 % | 2, 3 |
| 13 | Harina para empanizar sazonada | g | 100 % | 0 % | 2 |
| 14 | Huevo | pza | 100 % | 0 % | 2 |
| 15 | Leche líquida | ml | 100 % | 0 % | 2 |
| 16 | Salsa BBQ | **ml** | 100 % | 0 % | 2 |
| 17 | Aderezo ranch | **ml** | 100 % | 0 % | 2, 6 |
| 18 | Apio | g | **85 %** | 0 % | 2 |
| 19 | Zanahoria | g | **85 %** | 0 % | 2 |
| 20 | Salsa mango habanero | g | 100 % | 0 % | 1, 2 |
| 21 | Salsa buffalo | g | 100 % | 0 % | 2 |
| 22 | Tortilla de harina 30 cm | pza | 100 % | 0 % | 3 |
| 23 | Queso Oaxaca | g | 100 % | 0 % | 3 |
| 24 | Chile chipotle adobado | g | 100 % | 0 % | 3 |
| 25 | Crema | g | 100 % | 0 % | 3, 7 |
| 26 | Aguacate | g | **70 %** | 0 % | 3 |
| 27 | Salsa verde / roja | g | 100 % | 0 % | 3 |
| 28 | Papa a la francesa congelada | g | 100 % | 0 % | 4, 5, 6 |
| 29 | *(alt.)* Papa fresca | g | **80 %** | 0 % | 5, 6 |
| 30 | Queso cheddar fundido / líquido | g | 100 % | 0 % | 5, 6 |
| 31 | Jalapeño en rodajas | g | 100 % | 0 % | 1, 5 |
| 32 | Piña en rodaja | g | 100 % | 0 % | 1 |
| 33 | Grano de elote (congelado) | g | 100 % | 0 % | 7 |
| 34 | *(alt.)* **Elote en mazorca** | g | **55 %** ⚠️ | 0 % | 7 |
| 35 | Queso cotija rallado | g | 100 % | 0 % | 7 |
| 36 | Mantequilla | g | 100 % | 0 % | 7 |
| 37 | Limón | pza | 100 % | 0 % | 5, 6, 7 |
| 38 | Chicharrón | g | 100 % | 0 % | 7 |
| 39 | Arroz blanco | g | 100 % | 0 % | 8 |
| 40 | Azúcar | g | 100 % | 0 % | 8, 9 |
| 41 | Leche en polvo | g | 100 % | 0 % | 8 |
| 42 | Flor de jamaica seca | g | 100 % | 0 % | 9 |
| 43 | Gelatina de sabor en polvo | g | 100 % | 0 % | 10 |
| 44 | Grenetina sin sabor | g | 100 % | 0 % | 10 |
| 45 | Leche condensada | g | 100 % | 0 % | 10 |
| 46 | Leche evaporada | **g** | 100 % | 0 % | 10 |
| 47 | Nuez picada | g | 100 % | 0 % | 10 |
| 48 | Agua fresca del día (preparada) | ml | 100 % | 0 % | 4 |
| 49 | **Agua purificada** ⚠️ | ml | 100 % | 0 % | **7, 8, 9, 10** |
| 50 | Vaso 250 ml | pza | 100 % | **16 %** | 7 |
| 51 | Vaso 500 ml + tapa | pza | 100 % | **16 %** | 4, 8, 9 |
| 52 | Charola / vaso 12 oz | pza | 100 % | **16 %** | 2, 3, 5, 6 |
| 53 | Papel encerado hamburguesa | pza | 100 % | **16 %** | 1 |
| 54 | Bolsa | pza | 100 % | **16 %** | 4 |
| 55 | Vasito / plato desechable | pza | 100 % | **16 %** | 10 |

### 3.2 Insumos con `track_stock = FALSE` (los que nunca se cuentan)

> **Se costean, pero NO bloquean la disponibilidad.** *(Si la sal entrara en el cálculo del mínimo, el
> sistema reportaría "0 hamburguesas" para siempre. **Es el fallo #1 en la práctica.**)*

| # | Insumo | U. base | Yield | Por qué `false` |
|---|---|---|---|---|
| 56 | Sal | g | 100 % | Nadie la descuenta por venta |
| 57 | Pimienta | g | 100 % | Especia |
| 58 | Ajo en polvo | g | 100 % | Especia |
| 59 | Ajo (diente) | g | **90 %** | Cantidad ínfima |
| 60 | Orégano / laurel | g | 100 % | Especia |
| 61 | Epazote | g | 100 % | Cantidad ínfima |
| 62 | Chile en polvo / Tajín | g | 100 % | Especia ⚠️ *(zona gris de IVA — ver §5.2)* |
| 63 | Canela en raja | g | 100 % | Especia |
| 64 | Vainilla | ml | 100 % | Cantidad ínfima |
| 65 | Hielo | g | 100 % | Se hace en casa |
| 66 | Popote | pza | 100 % | Nadie lo cuenta |
| 67 | Cuchara desechable | pza | 100 % | Nadie la cuenta |
| 68 | Servilleta | pza | 100 % | Nadie la cuenta |

---

## 4. Costos de compra

### 4.0 ⚠️ El puente que faltaba — **sin esto el motor NO puede correr**

La auditoría encontró **8 insumos donde la unidad base NO coincide con la unidad del precio**:

```txt
Lechuga:    se mide en GRAMOS   pero se compra POR PIEZA   ($8.33/pza)
Limón:      se mide en PIEZAS   pero se cotiza POR GRAMO   ($0.0205/g)
Queso am.:  se mide en PIEZAS   pero se cotiza POR GRAMO   ($0.130/g)
```

**`costo = cantidad_bruta × $/unidad_base` es una multiplicación entre unidades distintas.** Da un número,
y **ese número es basura**.

> **Y la lección es mejor que el error:** el spec **ya tenía el lugar donde va este dato** — es la
> **capa 2**, el `factor_a_base` de la línea de compra. **El diseño estaba bien; el dato faltaba.**
> Faltó preguntarse **cuánto pesa una lechuga**.

**Factores de conversión** *(todos **ESTIMADOS** — el inventarista los corrige con una báscula):*

| Insumo | U. base | Se compra en | **Factor** | → $ / u. base |
|---|---|---|---|---|
| Lechuga (romanita) | `g` | pza | **500 g / pza** | $8.333333 ÷ 500 = **$0.016667/g** |
| Apio (manojo) | `g` | pza | **500 g / pza** | $25.00 ÷ 500 = **$0.050000/g** |
| Elote en mazorca | `g` | pza | **350 g / pza** *(con hojas)* | $7.50 ÷ 350 = **$0.021429/g** |
| Limón (#3) | `pza` | kg | **60 g / pza** | $0.020526 × 60 = **$1.231560/pza** |
| Queso amarillo | `pza` *(rebanada)* | kg | **20 g / rebanada** | $0.130000 × 20 = **$2.600000/pza** |
| Huevo | `pza` | kg | **≈17 pza / kg** | ya resuelto: **$2.647059/pza** ✅ |
| Salsa BBQ · Ranch | `ml` ⚠️ *(la base era `g`)* | L | *(se corrige la base a `ml`)* | **$0.090000/ml** · **$0.110000/ml** |
| Leche evaporada | `g` ⚠️ *(la base era `ml`)* | lata | *(se corrige la base a `g`)* | **$0.052778/g** |
| **Agua purificada** | `ml` | **garrafón 20 L** | **20 000 ml / garrafón** | $40.00 ÷ 20 000 = **$0.002000/ml** *(ESTIMADO — no tenía precio)* |

### 🔎 El elote: el rendimiento **no** encarece un insumo — lo hace **COMPARABLE**

§1.7 llamaba a la mazorca *"el peor rendimiento del catálogo"*, insinuando **mala compra**.
**Es al revés — y es la lección de §6 aplicada bien:**

```txt
Mazorca:          $7.50/pza ÷ 350 g   = $0.021429 por gramo COMPRADO
                  ÷ 0.55 de rendimiento → $0.038961 por gramo ÚTIL

Grano congelado:                        $0.055000 por gramo ÚTIL (yield 100 %)
                  ────────────────────────────────────────────────────────────
                  LA MAZORCA ES 29 % MÁS BARATA — aun tirando la mitad.
```

**Bajo rendimiento ≠ caro.** El yield **entra al $/g útil; no lo sustituye.**
Y como los Esquites son el producto más apretado del catálogo, **este es justo el ahorro que los salva** —
y el documento lo desaconsejaba.

---

**Costo por unidad base, 6 decimales.** Cada renglón marcado **CITADO** (con fuente) o **ESTIMADO**.

### 4.1 Proteínas, lácteos y huevo

| Insumo | Presentación | Precio | **$ / u. base** | IVA | Origen |
|---|---|---|---|---|---|
| Carne molida res 80/20 | 1 kg granel | $130.00 | **0.130000** /g | 0 % | **CITADO** — PROFECO, CEDA, 27/05/2026. *(Piso observado: $98.90/kg en hipermercado)* |
| Pechuga de pollo s/hueso | 1 kg granel | $150.98 | **0.150980** /g | 0 % | **CITADO** — PROFECO. *(Mayoreo SNIIM: $102–110/kg)* |
| Tocino | 1 kg | $180.00 | **0.180000** /g | 0 % | *ESTIMADO* |
| Queso amarillo rebanado | Paq. 2 kg | $260.00 | **0.130000** /g | 0 % | *ESTIMADO* |
| Queso Oaxaca | 1 kg granel | $95.00 | **0.095000** /g | 0 % | **CITADO** — PROFECO, CEDA, 29/04/2026 |
| Queso cotija | 1 kg granel | $105.00 | **0.105000** /g | 0 % | **CITADO** — PROFECO, CEDA, 29/04/2026 |
| Queso cheddar líquido | Lata 3 kg | $300.00 | **0.100000** /g | 0 % | *ESTIMADO* |
| Crema | 1 kg granel | $47.00 | **0.047000** /ml | 0 % | **CITADO** — PROFECO, CEDA, 29/04/2026 *(densidad ≈ 1)* |
| Leche líquida | 1 L | $26.00 | **0.026000** /ml | 0 % | *ESTIMADO* |
| Leche en polvo | 1 kg | $180.00 | **0.180000** /g | 0 % | *ESTIMADO* |
| Leche condensada | Lata 375 g | $24.90 | **0.066400** /g | 0 % | **CITADO** — PROFECO, 29/04/2026 |
| Leche evaporada | Lata 360 g | $19.00 | **0.052778** /g | 0 % | *ESTIMADO* |
| Huevo | 1 kg (≈17 pzas) | $45.00 | **2.647059** /pza | 0 % | *ESTIMADO* |

### 4.2 Panadería y tortillería

| Insumo | Presentación | Precio | **$ / u. base** | IVA | Origen |
|---|---|---|---|---|---|
| Pan para hamburguesa | Paq. 8 pzas | $38.00 | **4.750000** /pza | 0 % | *ESTIMADO* |
| Tortilla de harina 30 cm | Paq. 10 pzas | $45.00 | **4.500000** /pza | 0 % | *ESTIMADO* |

### 4.3 Frutas y verduras *(precios de MAYOREO — Central de Abasto)*

| Insumo | Presentación | Precio | **$ / u. base** | IVA | Origen |
|---|---|---|---|---|---|
| Lechuga (romanita grande) | Docena | $100.00 | **8.333333** /pza | 0 % | **CITADO** — SNIIM CEDA, **14/07/2026** |
| Jitomate (saladette) | Caja 13 kg | $120.00 | **0.009231** /g | 0 % | **CITADO** — SNIIM CEDA, **14/07/2026**. *Rango hoy: $8.40–$17.50/kg* |
| Cebolla (bola) | Arpilla 30 kg | $360.00 | **0.012000** /g | 0 % | **CITADO** — SNIIM CEDA, **14/07/2026** |
| Papa fresca | Arpilla 50 kg | $1,900.00 | **0.038000** /g | 0 % | **CITADO** — SNIIM CEDA, **14/07/2026** |
| Limón (c/semilla #3) | Arpilla 19 kg | $390.00 | **0.020526** /g | 0 % | **CITADO** — SNIIM CEDA, **14/07/2026**. *Persa s/semilla: 0.009000/g* |
| Elote fresco | Docena | $90.00 | **7.500000** /pza | 0 % | **CITADO** — SNIIM CEDA, **14/07/2026** |
| Jalapeño fresco | Arpilla 30 kg | $390.00 | **0.013000** /g | 0 % | **CITADO** — SNIIM CEDA, **14/07/2026** |
| Aguacate (Hass) | 1 kg | $80.00 | **0.080000** /g | 0 % | *ESTIMADO* |
| Zanahoria | 1 kg | $20.00 | **0.020000** /g | 0 % | *ESTIMADO* |
| Apio | Pieza | $25.00 | **25.000000** /pza | 0 % | *ESTIMADO* |

### 4.4 Abarrotes y procesados

| Insumo | Presentación | Precio | **$ / u. base** | IVA | Origen |
|---|---|---|---|---|---|
| Mayonesa | Frasco 790 g | $60.00 | **0.075949** /g | 0 % | **CITADO** — PROFECO, Chedraui, 29/04/2026. *Cubeta 3.4 kg ≈ 0.055/g (estimado)* |
| Catsup | Bote 1.13 kg | $60.00 | **0.053097** /g | 0 % | *ESTIMADO* |
| Mostaza | Frasco 430 g | $28.00 | **0.065116** /g | 0 % | **CITADO** — PROFECO, Chedraui, 15/06/2026 |
| Salsa BBQ | Bote 1 L | $90.00 | **0.090000** /ml | 0 % | *ESTIMADO* |
| Aderezo ranch | Bote 1 L | $110.00 | **0.110000** /ml | 0 % | *ESTIMADO* |
| Salsa mango habanero | Bote 1 kg | $120.00 | **0.120000** /g | 0 % | *ESTIMADO* |
| Chile chipotle adobado | Lata 380 g | $35.00 | **0.092105** /g | 0 % | *ESTIMADO* |
| Harina para empanizar | Bolsa 1 kg | $45.00 | **0.045000** /g | 0 % | *ESTIMADO* |
| **Aceite para freír** | Botella 850 ml | $25.00 | **0.029412** /ml | 0 % | **CITADO** — PROFECO, Bodega Aurrerá, 07/07/2026 |
| Papa a la francesa congelada | Bolsa 2 kg | $120.00 | **0.060000** /g | 0 % | *ESTIMADO* |
| Grano de elote congelado | Bolsa 1 kg | $55.00 | **0.055000** /g | 0 % | *ESTIMADO* |
| Mantequilla | 1 kg | $180.00 | **0.180000** /g | 0 % | *ESTIMADO* |
| Arroz blanco | 1 kg | $28.00 | **0.028000** /g | 0 % | *ESTIMADO* |
| **Azúcar** | Bolsa 1 kg | $19.00 | **0.019000** /g | 0 % | **CITADO** — PROFECO, CEDA/La Comer, 01/07/2026 |
| Flor de jamaica seca | 1 kg | $100.00 | **0.100000** /g | 0 % | *SEMI-CITADO* — SNIIM 14/07/2026 en otras plazas ($95 Tijuana, $105 Minatitlán, $110 Acapulco). **No hubo cotización en CEDA ese día.** |
| Gelatina de sabor en polvo | Bolsa 1 kg | $90.00 | **0.090000** /g | 0 % | *ESTIMADO* |
| Grenetina sin sabor | Bolsa 1 kg | $220.00 | **0.220000** /g | 0 % | *ESTIMADO* |
| Nuez picada | 1 kg | $280.00 | **0.280000** /g | 0 % | *ESTIMADO* |
| Chicharrón | 1 kg | $220.00 | **0.220000** /g | 0 % | *ESTIMADO* |
| Sal | 1 kg | $12.00 | **0.012000** /g | 0 % | *ESTIMADO* |
| Chile en polvo (Tajín) | 1 kg | $180.00 | **0.180000** /g | 0 % ⚠️ | *ESTIMADO* — **ver §5.2** |

### 4.5 Desechables y empaques — **los únicos con IVA del 16 %**

| Insumo | Presentación | Precio | **$ / u. base** | IVA | Origen |
|---|---|---|---|---|---|
| Vaso 250 ml | Paq. 50 pzas | $35.00 | **0.700000** /pza | **16 %** | *ESTIMADO* |
| Vaso 500 ml + tapa | Paq. 50 pzas | $110.00 | **2.200000** /pza | **16 %** | *ESTIMADO* |
| Charola / vaso 12 oz | Paq. 50 pzas | $90.00 | **1.800000** /pza | **16 %** | *ESTIMADO* |
| Papel encerado | Paq. 500 hojas | $180.00 | **0.360000** /pza | **16 %** | *ESTIMADO* |
| Bolsa | Paq. 100 pzas | $40.00 | **0.400000** /pza | **16 %** | *ESTIMADO* |
| Vasito desechable (1 oz) | Paq. 100 pzas | $25.00 | **0.250000** /pza | **16 %** | *ESTIMADO* |

---

## 5. El IVA — lo que descubrimos y por qué importa

### 5.1 Casi todo el alimento es **0 %** (más de lo que parece)

**LIVA art. 2-A, fracc. I, inciso b): tasa 0 % a la enajenación de *productos destinados a la alimentación
humana*.**

**Eso INCLUYE** — y es donde casi todo el mundo se equivoca — el **aceite comestible**, la **mayonesa**, la
**catsup**, la **mostaza**, los **aderezos**, las **salsas** y el **azúcar**. **No pagan 16 % por ser
procesados: son alimento.**

**Lo único que grava 16 %** de todo el catálogo son los **desechables** (vasos, charolas, bolsas, papel).

### 5.2 Las dos trampas

| Trampa | Nos pega en… |
|---|---|
| **Jarabes, concentrados, polvos o esencias que al diluirse den refrescos → 16 %** | ⚠️ **El polvo/concentrado de horchata**, si se compra comercial. *(Por eso la receta la modela como base casera: arroz + azúcar, ambos a 0 %.)* |
| **Saborizantes, microencapsulados y aditivos alimenticios → 16 %** | ⚠️ **Zona gris del chile en polvo tipo Tajín.** Como *sazonador de mesa* va a 0 %; facturado como *saborizante* va a 16 %. **Hay que mirar la factura del proveedor, no adivinar.** |

### 5.3 La consecuencia que la cooperativa debe saber ANTES

```txt
VENTAS (comida preparada, 16 %)  →  se cobra MUCHO IVA
COMPRAS (casi todo alimento, 0 %) →  casi NO hay IVA acreditable
──────────────────────────────────────────────────────────────
EL IVA QUE SE COBRA ES CASI TODO IVA A PAGAR
```

**Y "para llevar" NO exenta.** La comida **preparada** causa 16 % *"inclusive cuando sean para llevar o para
entrega a domicilio"* (LIVA art. 2-A, último párrafo). El SAT tiene incluso un **criterio no vinculativo
(4/IVA/NV)** contra quienes aplican 0 % a alimentos preparados.

---

## 6. Dónde compra una cooperativa

> ⚠️ **TODA esta sección es ESTIMADA.** Son órdenes de magnitud de mercado, **no mediciones**. Se marcan
> como tales porque §0 promete que CITADO y ESTIMADO **no se mezclan** — y una versión anterior de esta
> sección los mezclaba.

| Canal | Vs. base | Origen | Nota |
|---|---|---|---|
| **Central de Abasto** (mayoreo) | −25 % a −40 % en frutas y verduras | *ESTIMADO* | Es el piso, **pero obliga a la presentación completa**: arpilla de 30–50 kg, caja de 13 kg. Comprar 5 kg de papa ahí **no aplica**. Requiere transporte y madrugar. |
| **Sam's / Costco** (*food service*) | −10 % a −25 % en abarrotes y congelados | *ESTIMADO* | Membresía. ⚠️ **No siempre gana** — ver abajo. |
| **Bodega Aurrerá** | *base* | *ESTIMADO* | El piso realista de autoservicio (marca propia). |
| **Walmart / Chedraui / La Comer** | +10 % a +25 % | *ESTIMADO* | El techo. |
| **Distribuidor a domicilio** | ≈ Sam's ±10 % | *ESTIMADO* | Más caro por unidad, **pero da crédito y entrega** — para una cooperativa sin camioneta, eso puede valer el sobreprecio. |

**Dispersión entre tiendas (PROFECO, CDMX):** para el **mismo genérico**, la carne molida va de **$98.90 a
$130.00/kg** = **+31 %** *(CITADO — un solo genérico)*. El resto del rango que una versión anterior daba
(*"+28 % a +31 %"*) **no tiene un segundo dato detrás**: se retira. *ESTIMADO: la dispersión de
autoservicio ronda el 30 %.*

### 🔎 La pregunta que el sistema contesta y que a ojo no se ve

> **Comprar a granel NO siempre es más barato.**
> **No compares el precio del bulto — compara el $/gramo.**

**Ese es el punto, y el motor de costeo lo resuelve solo:** en cuanto el inventarista captura las dos
presentaciones, el `costo_por_unidad_base` las hace comparables. Una botella de 850 ml y una tina de 20 L
dejan de ser peras y manzanas.

> ⚠️ **CORRECCIÓN (§15 / §40).** Una versión anterior afirmaba, **como hallazgo**, que *"el aceite de 20 L
> de Sam's sale más caro por mililitro ($0.037698/ml) que la botella de Bodega Aurrerá ($0.029412/ml)"* —
> **con seis decimales y sin marca de estimado**, cuando **§0 de este mismo documento dice que Sam's
> bloqueó la lectura y sus precios NO pudieron capturarse.**
> Era una **contradicción interna** al servicio de un hallazgo atractivo. **El principio sigue siendo
> cierto y es la lección que importa; el dato que lo "probaba", no.** Queda como hipótesis a verificar con
> una compra real, no como hecho.

---

## 7. Advertencia de vigencia

**Estos precios envejecen rápido.** El INPC de la primera quincena de junio de 2026 registra un alza de
**+5.76 %** en *"papa y otros tubérculos"* (INEGI, 2026, cuadro 2) — **en una sola quincena**.

> ⚠️ **CORRECCIÓN (§15 / §40).** Una versión anterior de este documento afirmaba que *"la papa subió ~21 % y
> el limón ~26 % en un mes, según el INPC"*. **Esos números eran FALSOS.** La auditoría del proyecto
> descargó el boletín citado: dice **5.76 %** para la papa, y **la palabra "limón" no aparece en todo el
> documento**. Fue una cifra **fabricada con una fuente real detrás** — la peor variante de lo que §15
> prohíbe, porque la cita legítima le presta credibilidad al invento. Queda registrada aquí en vez de
> borrada en silencio.

→ Y **esa volatilidad es justamente la razón** de que cada lote de compra guarde
**`unit_cost` + `purchased_at` + `supplier`**: esa tabla **es el histórico de precios**, y el reporte de
"qué subió y qué bajó" sale gratis de ahí.
Ver [`04-inventario-costeo`](../superpowers/plans/2026-07-14-04-inventario-costeo.md), Task 5, Steps 8–10.

**Ningún precio de este documento debe usarse para fijar un precio de venta.** Son semilla de demo.
La cooperativa costea **con sus compras reales**.

---

## 8. Referencias (APA 7.ª ed.)

### 8.1 Fuentes oficiales — precios y mercado

Instituto Nacional de Estadística y Geografía. (2026). *Índice Nacional de Precios al Consumidor* [Boletín
de prensa]. https://www.inegi.org.mx/contenidos/saladeprensa/boletines/2026/inpc/inpc_1q2026_06.pdf

Procuraduría Federal del Consumidor. (2026). *Quién es Quién en los Precios* [Conjunto de datos abiertos;
API pública]. https://qqp.profeco.gob.mx/

Procuraduría Federal del Consumidor. (2026). *Datos abiertos — Quién es Quién en los Precios*.
https://datos.profeco.gob.mx/datos_abiertos/qqp.php

Secretaría de Economía. (2026, 14 de julio). *Precios de mayoreo de frutas y hortalizas: Central de Abasto
de Iztapalapa, D. F.* Sistema Nacional de Información e Integración de Mercados.
http://www.economia-sniim.gob.mx/nuevo/

### 8.2 Fuentes oficiales — marco fiscal

Servicio de Administración Tributaria. (2026). *Ley del Impuesto al Valor Agregado, artículo 2-A*.
https://wwwmatnp.sat.gob.mx/articulo/06071/articulo-2-a

Servicio de Administración Tributaria. (2026). *Anexo 20: Guía de llenado de los comprobantes fiscales
digitales por Internet, versión 4.0*.
http://omawww.sat.gob.mx/tramitesyservicios/Paginas/documentos/Anexo_20_Guia_de_llenado_CFDI.pdf

### 8.3 Recetas y gramajes de porción

Bon Viveur. (s. f.). *Horchata de arroz*. Recuperado el 14 de julio de 2026, de
https://bonviveur.com/es/recetas/horchata-de-arroz

Cocina Delirante. (s. f.). *Irresistible gelatina de mosaico: receta fácil de preparar*. Recuperado el 14 de
julio de 2026, de https://www.cocinadelirante.com/recetas/irresistible-gelatina-de-mosaico-receta-facil-de-preparar

Isabel Eats. (s. f.). *Esquites (Mexican corn in a cup)*. Recuperado el 14 de julio de 2026, de
https://www.isabeleats.com/esquites/

Jinich, P. (s. f.). *Horchata: agua de arroz y canela*. Recuperado el 14 de julio de 2026, de
https://patijinich.com/es/horchata-agua-de-arroz-y-canela/

batchrecetas. (s. f.). *Gelatina mosaico: receta*. Recuperado el 14 de julio de 2026, de
https://batchrecetas.com/gelatina-mosaico-receta/

McCain Foodservice México. (s. f.). *Papas fritas con cáscara, corte recto 7/16"* [Ficha de producto].
Recuperado el 14 de julio de 2026, de https://mccain.com.mx/foodservice/

NutriScan. (s. f.). *Domino's boneless chicken wings: información nutricional* [Ficha]. Recuperado el 14 de
julio de 2026, de https://nutriscan.app/calories-nutrition/dominos-boneless-chicken-wings

SnapCalorie. (s. f.). *Boneless wings: nutrition* [Ficha]. Recuperado el 14 de julio de 2026, de
https://www.snapcalorie.com/nutrition/boneless_wings_nutrition.html

México en mi Cocina. (s. f.). *Receta de esquites*. Recuperado el 14 de julio de 2026, de
https://www.mexicoenmicocina.com/receta-de-esquites/

Nestlé México. (s. f.). *Gelatina mosaico tradicional*. Recuperado el 14 de julio de 2026, de
https://www.recetasnestle.com.mx/recetas/gelatina-mosaico-tradicional

Radio Fórmula. (2024, 24 de abril). *¿Cuál es la cantidad de jamaica para un litro de agua?*
https://www.radioformula.com.mx/estilo-de-vida/2024/4/24/cual-es-la-cantidad-de-jamaica-para-un-litro-de-agua-812288.html

Sabor a Tierra y Mar. (s. f.). *¿Cuántos gramos de jamaica para un litro de agua?* Recuperado el 14 de julio
de 2026, de https://saboratierraymar.es/cuantos-gramos-de-jamaica-para-un-litro-de-agua/

### 8.4 Referencias de costeo e industria restaurantera

Restaurant365. (s. f.). *Understanding what is a good food cost percentage*. Recuperado el 14 de julio de
2026, de https://www.restaurant365.com/blog/cooking-up-success-understanding-what-is-a-good-food-cost-percentage/

Sculpture Hospitality. (s. f.). *FIFO vs. LIFO vs. WAC: What restaurant inventory costing method is best?*
Recuperado el 14 de julio de 2026, de
https://www.sculpturehospitality.com/blog/fifo-vs-lifo-vs-wac-what-restaurant-inventory-costing-method-is-best

Toast. (s. f.). *How to calculate food cost percentage*. Recuperado el 14 de julio de 2026, de
https://pos.toasttab.com/blog/on-the-line/how-to-calculate-food-cost-percentage

Toast. (s. f.). *Restaurant inventory costing methods*. Recuperado el 14 de julio de 2026, de
https://pos.toasttab.com/blog/on-the-line/restaurant-inventory-costing-methods

---

## 9. Lo que el sistema te gritaría con estos números

> ⚠️ **Recuerda el encabezado: estos números son SUGERIDOS.** Esta sección **no dice "tu negocio está
> mal"** — dice: ***"con estos gramajes y estos precios de demo, esto es lo que el sistema te avisaría."***
> **Con los gramajes y las compras reales de la cooperativa, la lista será otra.**
>
> **Y ese es el punto entero del proyecto:** que este cálculo lo haga el sistema, solo, todos los días —
> y no un documento, una vez.

### 9.1 SEIS de los nueve calculables superarían el techo del 45 %

> ⚠️ **Estos números SE REPRODUCEN desde las tablas de este documento** (§1 gramajes + §3 rendimientos +
> §4 precios + §4.0 factores). El script está en §9.4. **Si no reproducen, es un bug del documento.**
>
> *(Una versión anterior publicó una tabla que **no salía de sus propias tablas** — el error que este
> documento existe para evitar. §40.)*

| Producto | Precio | Costo | Ingreso neto | Ganancia | **Food cost** |
|---|---:|---:|---:|---:|---:|
| **Boneless BBQ** | $58 | $39.95 | $50.00 | $10.05 | **79.9 %** 🚩🚩 |
| **Quesadilla de tinga** | $38 | $25.67 | $32.76 | $7.09 | **78.4 %** 🚩🚩 |
| **Esquites en vaso** | $22 | $14.53 | $18.97 | $4.43 | **76.6 %** 🚩🚩 |
| **Hamburguesa de la casa** | $65 | $30.80 | $56.03 | $25.23 | **55.0 %** 🚩 |
| **Papas con queso** | $32 | $12.76 | $27.59 | $14.82 | **46.3 %** 🚩 |
| Papas a la francesa | $28 | $10.43 | $24.14 | $13.71 | 43.2 % ✅ |
| Agua de horchata | $18 | $6.59 | $15.52 | $8.92 | 42.5 % ✅ |
| Agua de jamaica | $18 | $4.67 | $15.52 | $10.85 | 30.1 % ✅ |
| Gelatina de mosaico | $15 | $3.80 | $12.93 | $9.13 | 29.4 % ✅ |
| ⚠️ **Combo estudiante** | $50 | **NO CALCULABLE** | — | — | **—** |

> 🔴 **El Combo NO SE PUEDE COSTEAR.** Su insumo `Agua fresca del día (preparada)` es **`BASE` y no tiene
> precio** — porque es una **sub-preparación**, no un insumo (§10, hueco #5).
> **Y eso NO es un defecto del documento: es el sistema haciendo su trabajo.** Un producto cuyo costo no se
> puede derivar **debe negarse a fingir un número**.

**Ninguno pierde dinero en margen bruto. Pero el margen bruto no paga gas, luz, sueldo ni renta.**
Con **$4.43 de ganancia por vaso**, los Esquites **no pagan ni el gas de cocerlos**.

### 9.2 Lo que enseña cada bandera *(y no es "sube el precio")*

- **Boneless (80 %):** el pollo (`160 g ÷ 0.95 = 168.4 g × $0.150980` = **$25.43**) es el **64 % del costo**.
  Y además hay **$7.35 de salsa** (BBQ $4.05 + ranch $3.30) **en un plato de $58**: como `ESTÁNDAR` es
  cara; como `EXTRA`, **se paga sola**.
- **Quesadilla (78 %):** tortilla **$4.50** + Oaxaca **$5.70** + pollo **$11.12** = **$21.32 de tres
  insumos** sobre $32.76 de ingreso. **El pollo pesa más que la tortilla y el queso juntos.**
- **Esquites (77 %):** 150 g de grano son **$8.25** — el **43 % de food cost del puro elote**. Es una
  ración de restaurante en un vaso de $22.
  La **mazorca** sale **29 % más barata por gramo útil** (§4.0) y baja el costo a **$12.12**… **pero deja
  el food cost en 64 %: sigue rojo.** **La porción de 150 g es el problema de fondo, no el proveedor.**
- **Hamburguesa (55 %):** **el producto insignia está por encima del techo.** Y la carne **no es todo el
  problema**: **todo lo que NO es carne cuesta $13.90** (pan $4.75 + tocino $3.60 + queso $2.60 +
  salsas $1.77 + verduras $0.72 + empaque $0.36 + aceite/sal $0.10) — contra **$16.90** de carne.
  ⚠️ **Y sacar el tocino NO la salva:** $30.80 − $3.60 = **$27.20** → **48.5 %**, **todavía sobre el techo**.
  Hace falta **una segunda palanca** (subir a ~$80, o bajar el gramaje).
  *(Una versión anterior imprimía una suma que no sumaba y proponía el tocino como palanca **suficiente**.
  Las dos cosas eran falsas. §40.)*
- **Papas con queso (46 %):** roza el techo, pero **gana $14.82** — más que su hermana sencilla (§9.3).
  **Food cost alto ≠ mal negocio.** Son dos preguntas distintas, y confundirlas es el error clásico.

> ✅ **Y una que sale del rojo al recalcular: la Horchata (42.5 %).** Una versión anterior la marcaba al
> **47 %** con números que **no salían de sus propias tablas**. **Con la aritmética de §9.4, pasa.**
> *(La jamaica gana con holgura —30 %— porque le faltan **dos** insumos que la horchata sí lleva: la leche
> en polvo **y** el arroz.)*

### 9.3 ⚠️ Y una bandera que estaba MAL — se retira

Una versión anterior afirmaba que las **Papas con queso "ganan menos que su hermano simple"**.
**Es falso, y la resta estaba mal hecha:**

```txt
Δ ingreso neto  =  $4 / 1.16                                              = +$3.45
Δ costo         =  +40 g cheddar ($4.00)
                   −10 g de papa  ($0.60)    ← llevan MENOS papa
                   −20 g de catsup ($1.06)   ← NO llevan catsup, la sencilla SÍ
                                                                          = +$2.34
────────────────────────────────────────────────────────────────────────────────
Δ MARGEN        =  +$1.11        ← el "premium" GANA MÁS, no menos.
```

**Lo cierto es otra cosa, y más fina:** su **food cost % es peor** (46 % vs. 43 %), aunque su **margen
absoluto es mayor**. Son dos afirmaciones distintas, y la que estaba escrita era la falsa.

> **Esto es exactamente por qué el cálculo tiene que hacerlo el sistema y no una persona con una tabla.**

### 9.4 El script que reproduce la tabla *(§0 — evidence or block)*

**Un número que no se puede re-derivar no es evidencia: es una impresión.** Esta es la aritmética,
completa, con los datos de este mismo documento. Cópiala y córrela.

```python
# costo_linea = (neto / rendimiento) x $/unidad_base   ·   solo BASE y ESTÁNDAR (los EXTRA no vienen)
# ingreso_neto = precio / 1.16      (el IVA del 16 % NO es de la cooperativa)
# food_cost    = costo / ingreso_neto

P = {  # $/unidad base — §4 y §4.0
 'pan':4.75,'carne':0.130,'tocino':0.180,'quesoAm':2.60,'lechuga':0.016667,'jitomate':0.009231,
 'cebolla':0.012,'mayo':0.075949,'catsup':0.053097,'mostaza':0.065116,'aceite':0.029412,
 'sal':0.012,'papel':0.360,'pollo':0.150980,'harina':0.045,'huevo':2.647059,'leche':0.026,
 'bbq':0.090,'ranch':0.110,'apio':0.050,'zanahoria':0.020,'charola':1.800,'tortilla':4.50,
 'quesoOax':0.095,'chipotle':0.092105,'crema':0.047,'papaCong':0.060,'cheddar':0.100,
 'elote':0.055,'cotija':0.105,'mantequilla':0.180,'limon':1.23156,'chilePolvo':0.180,
 'vaso250':0.700,'arroz':0.028,'azucar':0.019,'lechePolvo':0.180,'canela':0.180,
 'vaso500':2.200,'jamaica':0.100,'gelatina':0.090,'grenetina':0.220,'condensada':0.0664,
 'evaporada':0.052778,'vasito':0.250,'agua':0.002,
}
costo = lambda it: sum((q / y) * P[k] for k, q, y in it)   # (insumo, neto, rendimiento)

R = {  # §1 — recetas
 'Hamburguesa': (65, [('pan',1,1),('carne',130,1),('tocino',20,1),('quesoAm',1,1),('lechuga',15,.85),
    ('jitomate',30,.95),('cebolla',10,.90),('mayo',12,1),('catsup',10,1),('mostaza',5,1),
    ('aceite',3,1),('sal',1.3,1),('papel',1,1)]),
 'Boneless': (58, [('pollo',160,.95),('harina',25,1),('huevo',.5,1),('leche',20,1),('aceite',15,1),
    ('bbq',45,1),('ranch',30,1),('apio',25,.85),('zanahoria',20,.85),('sal',1.8,1),('charola',1,1)]),
 'Quesadilla': (38, [('tortilla',1,1),('quesoOax',60,1),('pollo',70,.95),('jitomate',45,.95),
    ('cebolla',20,.90),('chipotle',8,1),('aceite',6,1),('crema',15,1),('lechuga',10,.85),
    ('sal',2,1),('charola',1,1)]),
 'Papas con queso': (32, [('papaCong',110,1),('aceite',12,1),('cheddar',40,1),('sal',1,1),('charola',1,1)]),
 'Papas a la francesa': (28, [('papaCong',120,1),('aceite',12,1),('catsup',20,1),('sal',1,1),('charola',1,1)]),
 'Esquites': (22, [('elote',150,1),('cebolla',10,.90),('mayo',20,1),('cotija',15,1),('mantequilla',5,1),
    ('limon',.5,1),('chilePolvo',4,1),('agua',60,1),('vaso250',1,1)]),
 'Horchata': (18, [('arroz',25,1),('azucar',35,1),('lechePolvo',10,1),('canela',1.5,1),('agua',480,1),
    ('vaso500',1,1)]),
 'Jamaica': (18, [('jamaica',8,1),('azucar',35,1),('agua',500,1),('vaso500',1,1)]),
 'Gelatina': (15, [('gelatina',9,1),('condensada',19,1),('evaporada',18,1),('grenetina',1.4,1),
    ('agua',110,1),('vasito',1,1)]),
 # 'Combo estudiante': NO CALCULABLE — 'Agua fresca del día' es BASE y NO tiene precio (§10, hueco #5).
}

for nombre, (precio, receta) in R.items():
    c = costo(receta); base = precio / 1.16
    print(f"{nombre:<22} costo ${c:6.2f}   neto ${base:6.2f}   "
          f"ganancia ${base-c:6.2f}   food cost {c/base*100:5.1f}%")
```

**Si este script deja de reproducir la tabla de §9.1, el documento está mintiendo.** Ese es el punto.

---

## 10. Los huecos que la auditoría destapó (pendientes de diseño)

| # | Hueco | Por qué importa |
|---|---|---|
| **1** | **No existe el "producto terminado".** La gelatina se cuaja en molde de 20 porciones; el aceite se compra en tina de 20 L; la reoferta vende una hamburguesa **ya hecha, cuyo respaldo de insumos es cero**. El modelo solo conoce **insumos** y **recetas**. | Es **una sola ausencia con cuatro síntomas**. Sin ella, la disponibilidad derivada dice "0" mientras hay comida en la barra. |
| **2** | **El aceite va a derivar siempre.** Se descuentan 12 ml de absorción por porción (~1.2 L/día), pero **la tina se tira entera cada N días** (~5 L/día). | El sistema descuenta 1.2 y la realidad se lleva 5. **El inventarista verá un faltante crónico y dejará de confiar en el sistema.** Solución: la absorción es **food cost**; el cambio de tina es una **merma de operación**. No son lo mismo. |
| **3** | **El medio huevo y el medio limón.** `0.5 pza` se descuenta bien del stock decimal — pero **nadie guarda medio huevo crudo**. | La fracción se vuelve **merma silenciosa**. Arreglo barato: **unidad base en `g`** (huevo 50 g/pza, limón 60 g/pza) — y de paso arregla §4.0. |
| **5** | **`Agua fresca del día (preparada)` es un insumo HUÉRFANO.** Es `BASE` en el Combo, pero **no tiene precio en §4** ni receta propia — porque es una **sub-preparación** (agua + azúcar + sabor), y las sub-recetas están fuera de alcance. **El costo del Combo NO es derivable.** | Es el mismo hueco del **producto terminado** (#1): la cocina **prepara en lote**. La salida sin sub-recetas: **tres insumos hermanos** (`Agua fresca — jamaica`, `— horchata`) y que el CPP promedie, o **aplanar el Combo** a la receta de jamaica (6 g + 28 g azúcar + 400 ml agua), que es lo más barato. **Y entonces el Combo SÍ se cae con el agua.** |
| **6** | **14 de los 68 insumos NO tienen precio en §4** *(Salsa buffalo, Salsa verde/roja, Piña, Agua fresca del día, y 10 especias/desechables con `track_stock=false`)*. | Los de `track_stock=false` **sí se costean** (aunque no bloqueen disponibilidad) → **su costo se está contando como $0**. Es una subestimación pequeña pero **sistemática**. |
| **4** | **Las bebidas no caben en su vaso.** Jamaica = 500 ml de agua **+ 80 g de hielo** en un vaso de **500 ml**. La gelatina son **150 g** en un *"vasito de 1 oz"* (30 ml). | El costo del envase (30 % del costo de la horchata) está calculado sobre **un envase que no existe**. |

*(El detalle y el arreglo de cada uno, en los planes de `docs/superpowers/`.)*

---

*Documento vivo (regla §24). Ver también:
[`motor-de-costeo-design.md`](../superpowers/specs/2026-07-14-motor-de-costeo-design.md) ·
[`04-inventario-costeo`](../superpowers/plans/2026-07-14-04-inventario-costeo.md) ·
[`06-panel-de-receta-por-alimento`](../superpowers/plans/2026-07-14-06-panel-de-receta-por-alimento.md).*
