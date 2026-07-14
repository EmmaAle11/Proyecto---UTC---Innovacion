# Uso de Inteligencia Artificial en UTC Pick Sazón — Registro y prompts

> **Para qué existe este documento.** Dejar constancia **verificable** de cómo se usó la IA en este
> proyecto: qué se le pidió, qué hizo, **qué NO hizo**, y dónde se equivocó. No es un anexo de marketing:
> es el registro que permite auditar la autoría.
>
> **Fecha de corte:** 2026-07-14 · **Herramienta:** Claude Code (Anthropic), modelo Opus 4.8 ·
> **Periodo:** 2026-06-20 → 2026-07-14 (25 días).

---

## 1. La división del trabajo — quién hizo qué

**El diseño del producto es del autor. La IA fue un ejecutor técnico y un asesor de arquitectura.**
Esa frase hay que poder sostenerla con evidencia, así que aquí está desglosada:

| Frente | Autor (Emmanuel) | Claude Code |
|---|---|---|
| **La idea y el problema** | ✅ **Íntegramente.** La congestión del recreo, el modelo Pick Up, la cooperativa como dark kitchen. | — |
| **Círculo de innovación, SCAMPER, propuesta** | ✅ **Íntegramente.** | Formateo y consistencia de los documentos. |
| **Reglas de negocio** (BR-001…BR-015) | ✅ **Íntegramente.** Estados del pedido, ventana de 20 min, reoferta, privacidad, roles. | Redacción formal en `rules.md`; señalar contradicciones. |
| **Diseño visual e identidad** | ✅ **Íntegramente.** Paleta, logo, mascota, tipografía, y la elección de cada componente de uiverse. | Reconstruir en React Native lo que el autor eligió. |
| **Decisiones de alcance** | ✅ **Íntegramente.** Qué entra, qué no, qué se difiere, cuándo parar. | Proponer opciones y **cuantificar el costo** de cada una. |
| **Arquitectura** | ✅ **Decide.** Pidió Hexagonal + DDD + Vertical Slice + FSD y aprobó cada paso. | 🤝 **Propone.** Diseñó la migración, los ADR y los mapas de dependencia. |
| **Código** | Revisa y aprueba. | ✅ **Escribe la mayor parte**, bajo dirección. |
| **Auditorías y hardening** | ✅ **Exige el estándar** ("0 P0-P5"). | ✅ Ejecuta las auditorías multi-agente y corrige. |
| **Investigación técnica** | ✅ **Formula las preguntas.** | ✅ Investiga y reporta con fuentes. |
| **Git (commits y push)** | ✅ **Íntegramente, a mano.** Regla §23 del proyecto. | ❌ **Prohibido.** Solo prepara y propone los comandos. |

> **La regla §23 no es un detalle:** el autor decidió, desde el inicio, **ejecutar todos los commits a
> mano** para aprender Git de verdad. La IA tiene prohibido hacer `commit`, `push`, `merge` o `rebase`.

---

## 2. Los números (evidencia, no impresión)

```txt
Periodo                     2026-06-20 → 2026-07-14   (25 días)
Commits totales             119
  ├─ con co-autoría de IA     41   (34 %)
  └─ del autor, sin IA        78   (66 %)
Código (TS/TSX)          13 358 líneas
Documentación (Markdown) 10 695 líneas   ← casi 1:1 con el código
Reglas del proyecto          46 + 15 reglas de negocio
Decisiones (ADR)             D-001 … D-046
Pruebas automatizadas       117 (verdes)
```

**El dato que más dice:** **la documentación pesa casi tanto como el código** (10 695 vs 13 358 líneas).
No es accidente — es el método (§3).

---

## 3. El método: cómo se usó la IA

No fue "pídele código y pégalo". El proyecto impuso **un protocolo**, escrito en
[`rules.md`](../superpowers/priority/rules.md), que la IA está obligada a seguir:

### 3.1 `rules.md` — el contrato

**46 reglas + 15 reglas de negocio** que gobiernan cada intervención. Las que más forma dieron al trabajo:

| Regla | Qué obliga |
|---|---|
| **§0 — Evidence or block** | La IA **no puede decir que algo funciona sin evidencia verificable**: salida de comandos, tests verdes, respuesta HTTP real. Prohibido "debería funcionar". |
| **§1 — Fail-closed** | Ante la duda, se bloquea. Nunca se asume permiso. |
| **§15 — No fabrication** | Prohibido inventar datos, cifras o fuentes. |
| **§22 — Confianza 95–100 %** | Ningún cambio se aplica sin pasar un *gate*: compilación + pruebas + auditoría multi-agente + agente de regresión. |
| **§23 — Git es del usuario** | La IA **nunca** commitea. |
| **§24 — Documentos vivos** | Todo cambio actualiza su documento canónico. |
| **§38 — Doble frente** | Toda explicación va en **dos registros**: técnico (código real) y **alegórico** (una analogía que mapee pieza por pieza). Si falta uno, la explicación está incompleta. |
| **§40 — Autocrítica obligatoria** | La IA **no puede dar la razón por defecto**. Debe señalar cuando el autor se equivoca. |
| **§43 / §45** | Las decisiones de arquitectura exigen análisis escrito. **Prohibido aceptar un patrón "porque es la buena práctica"**. |

### 3.2 El ciclo: **spec → plan → código → gate**

Ningún código se escribe antes de que exista **un diseño escrito y aprobado**:

```txt
1. SPEC    docs/superpowers/specs/    → el DISEÑO. Qué se va a hacer y por qué. Decisiones abiertas.
2. (el autor aprueba o corrige)
3. PLAN    docs/superpowers/plans/    → la EJECUCIÓN. Tareas, archivos, pasos, verificación.
4. CÓDIGO
5. GATE    §22 → compilación + 117 pruebas + auditoría multi-agente + 0 defectos P0-P5
6. El AUTOR commitea a mano (§23)
```

### 3.3 Agentes en paralelo

Para investigación y auditoría se lanzan **múltiples agentes simultáneos** con lentes distintos
(corrección, seguridad, rendimiento, convenciones), y luego **agentes adversarios** que intentan
**refutar** cada hallazgo. Solo sobrevive lo que resiste el intento de refutación.

---

## 4. Registro de prompts (cronológico)

> **Nota de honestidad (§15).** Los prompts marcados **[VERBATIM]** están transcritos literalmente.
> Los marcados **[RECONSTRUIDO]** se reconstruyen a partir del historial de Git, los planes y los ADR que
> produjeron — el texto exacto no se conservó, pero **el contenido de la petición sí es verificable**
> contra el commit que la ejecutó.

### Fase 0 — Cimientos *(2026-06-20 → 06-22)*

**[RECONSTRUIDO]** · commits `2ea18f4`, `bd16e10`, `1ae1d33`
> Vamos a construir la app de la cooperativa. Necesito reglas obligatorias que sigas siempre, un
> documento de diseño de la arquitectura, y el plan de implementación. Levanta la infraestructura:
> Docker con Postgres y Keycloak, backend NestJS con `/health`, y el frontend en Expo con FSD.

**[RECONSTRUIDO]** · commit `4ba173c`
> Me siento perdido con la cantidad de archivos del `design-system/`. Recorta lo que no aporte valor
> para construir la app, conserva solo la referencia de marca útil, y deja el repo ordenado.

### Fase 1 y 2 — Autenticación y seguridad *(2026-06-22 → 06-23)*

**[RECONSTRUIDO]** · commits `1eddf5b`, `0aada36`, `fab5ebe`
> Auth con Keycloak local, sin Microsoft. El cliente se auto-registra con `@edu.utc.mx`. El admin va
> sembrado y con MFA. El backend valida el JWT y el rol. Guard de sesión y roles (`user` / `admin`).

**[RECONSTRUIDO]** · commit `5f5276d`
> Endurece la seguridad: `.gitignore` y un hook de pre-commit que impida subir secretos.

### Turno de datos — Cablear la app a la base *(2026-06-25 → 06-29)*

**[RECONSTRUIDO]** · commits `d0d177f`, `a0ae218`, `7b691c2`, `e441fbd`
> Ahora el turno de datos: quita los mocks y conecta la app a `UTC_PROJECT_DB`. Paso 1 el catálogo,
> paso 2 la escritura del admin, paso 3 los pedidos del cliente, paso 4 las transiciones del admin.

**[VERBATIM]** · commit `c9deb59`
> *(el autor pega HTML y CSS de componentes de uiverse.io)*
> Reconstruye esto en React Native con nuestra paleta.

### Arquitectura — Hexagonal + DDD + Vertical Slice *(2026-07-07 → 07-10)*

**[VERBATIM]**
> Dame los comandos de commit. Daremos una última iteración a este proyecto. Debes seguir las rules.md.
> Debes seguir la regla de: Alineación · Escalabilidad · Entity, object value, domain, aggregate root,
> puerto, adaptador, coordinados · Infraestructura, application, presentation y domain presentes y con
> 0 error de sintaxis / coherencia.

**[VERBATIM]**
> Vamos a realizar #1 + #2. Cuando terminemos revisaremos lo del panel administrativo, eso no es tan
> importante ahora. Debes leer rules.md. Debes leer las skills/plugins que tenemos y usarlas.
> **Debemos de lograr 0_P0_P5.** Debemos mantener la alineación + normalización + coherencia +
> escalabilidad.

**[VERBATIM]**
> SI están muertos o no usables debes eliminarlos, no vamos a conservar mock basura. Esos mock se
> crearon para simular en la app porque por el túnel de Cloudflare no funcionaba.

**[VERBATIM]**
> Ahora haz una auditoría al sistema. Quiero que revises principalmente la documentación
> `.claude/Architecture.md` y `.claude/REFACTORING_PLAN_DDD.md`, y actualices lo que deba ser actualizado.

### Módulo de administración y expansión del alcance *(2026-07-14)*

**[VERBATIM]**
> Vamos a atacar el módulo de administración.
> 1. Debemos generar un árbol jerárquico sobre lo que cada persona tiene de acceso para el panel de la
>    cooperativa.
> 2. Vas a tomar el PDF y le vas a quitar el añadido de la página 25.
> 3. Vamos a integrar las siguientes funciones, empezando por la vista del cliente:
>    - En el método de pago efectivo, poder colocar con cuánto dinero exacto se va a pagar. Ej.: si el
>      pedido es de $150, el usuario elige con cuántas monedas y cuántos billetes paga. Esta información
>      debe aparecer en el ticket tanto para el cliente como para el panel de Cocina / admin.
>    - Poder personalizar los pedidos. Ej.: el combo de hamburguesa lleva lechuga, jitomate, mayonesa y
>      aderezo a elección; el usuario debe poder elegir qué sí y qué no, además de notas para comentarios
>      extra. Para eso debemos listar las ramas de cada producto y llenarlas en la base de datos, ya que
>      cada uno de esos insumos tendrá stock.
> 4. Quiero arreglar el error de conexión al puerto 5433.

**[VERBATIM]** — *el autor corrige el proceso*
> **No escribas más código, no veo la propuesta de roles. Tampoco veo tu plan con writing plans + specs**
> en `docs/superpowers`.

**[VERBATIM]** — *el autor define el modelo de roles*
> Por cooperativa suelen ser 3 personas. Quiero que una persona se dedique a cocinar; que otra haga el
> inventario y lo registre junto con costos y ganancias; que otra reciba las órdenes, cambie estatus por
> orden de cocina, cobre y dé cambio cuando es en efectivo, y facture. Más el admin que ya tenemos.
> Haz la propuesta.

**[VERBATIM]**
> Debemos integrar RLS (Row Level Security) para mostrar a cada rol solo lo que le corresponde.
> Quiero que el usuario encargado también pueda colocar cuál fue el costo del insumo registrado. Digamos
> que coloca 3 kilos de carne, el costo es de 150 pesos; cada hamburguesa cuesta 500 g de carne, eso
> quiere decir que por carne cuesta 25 MXN, y al menos debe sacar ganancia en el costo total de la
> hamburguesa. **Haremos un estudio grande.**

**[VERBATIM]**
> También debemos implementar Single Source Of Truth. Son 3 cambios grandes + el diseño del ticket con
> los cambios pertinentes. **Debes generar un plan por sección.**

**[VERBATIM]** — *el autor acota el alcance*
> No nos vamos a complicar, porque hacerlo de esta forma provoca que tengamos que hacerlo con cada
> producto. Vamos a resolver la pregunta: ¿cuál es el promedio de insumos y cantidades que se usan para
> preparar los siguientes alimentos? Con esa respuesta podremos agregar el panel por alimento de:
> 1. Ítems involucrados sugeridos — el usuario encargado puede añadir o quitar.
> 2. Porción por ítem sugerida — el usuario encargado puede ajustar.
> 3. Ganancia total por producto en venta normal, y aplicar la regla de reducción de merma en reoferta.
> 4. Definir unidades de medición — no tendrá kg el agua.

---

## 5. Los prompts de sistema (recuperados del historial de Git)

Además de las peticiones puntuales, el proyecto mantuvo **prompts de contexto** para que cada sesión nueva
de IA arrancara sabiendo dónde estaba todo. Están en el historial (commit `0041ded`, que los retiró del
roadmap una vez integrados):

| Documento | Qué era |
|---|---|
| `PROMPT_CONTINUIDAD.md` (48 líneas) | El mensaje que se pega al abrir una sesión nueva tras compactar la memoria: qué leer primero, en qué estado está el proyecto, las reglas que no se pueden romper, los puertos y comandos, y qué sigue. |
| `PROMPT_CONTEXTO_ARQUITECTURA.md` (1 080 líneas) | Guía de arquitectura **agnóstica del dominio**: Hexagonal + DDD + Vertical Slice + CQRS ligero en el backend y FSD en el frontend. Escrita para que **cualquier** desarrollador o IA entienda y extienda el sistema. |

Y el sistema de **memoria persistente** (`~/.claude/projects/…/memory/`): una carpeta de archivos donde la
IA guarda lo aprendido entre sesiones (puertos del equipo, decisiones tomadas, runbooks verificados,
trampas conocidas), indexada en `MEMORY.md`.

---

## 6. Lo que la IA encontró y un humano difícilmente habría visto

Esto es lo que justifica su uso, y conviene que sea concreto:

| Hallazgo | Por qué importa |
|---|---|
| **RLS habría sido teatro.** Se **probó experimentalmente** que activar Row Level Security con el usuario actual de la base **no protegía nada**: la política más restrictiva (`USING(false)`) seguía devolviendo todas las filas, porque el usuario es **superusuario** y Postgres **no le aplica RLS**. | Se habría commiteado una medida de seguridad que **miente**, y eso es peor que no tenerla. |
| **El costo de la hamburguesa estaba mal, y el error iba siempre hacia abajo.** Faltaba el **rendimiento (yield)**: 3 kg de carne con hueso no dan 3 kg útiles. | Sin él, el negocio **cree que gana más de lo que gana** y el inventario "se pierde" solo. |
| **El cliente decidía a qué cocina iba su pedido.** `branchId` era texto libre: un pedido podía cobrarse y **quedar invisible para todas las cocinas**. | Fuga de autorización (OWASP A01) + pedidos fantasma. |
| **25 duplicaciones** entre backend y frontend, incluida **la fórmula del precio a cobrar**. | El carrito podía mostrar un total y la caja cobrar otro. |
| **El IVA del 16 % no existía en el sistema.** La comida preparada lo causa (LIVA art. 2-A). | El margen estaba **inflado ~16 puntos**. |
| **Una regresión introducida por la propia IA** (D-037): un refactor perdió los bloqueos de concurrencia. | Ver §7 — la detectó una prueba que **construía el repositorio real**, no un mock. |

---

## 7. Dónde la IA se equivocó *(§40 — y esto es lo que hace creíble el resto)*

Un registro que solo cuente los aciertos no es un registro, es publicidad.

| Error | Qué pasó | Cómo se detectó |
|---|---|---|
| **Regresión D-037** | Un refactor "DDD híbrido" hecho por la IA **perdió los bloqueos pesimistas y la protección TOCTOU** del inventario al mover la lógica de servicio a repositorio. | Una prueba que construye el **repositorio real** (no un mock) lo dejó al descubierto — commit `e86ccbc`. Se restauró en `4773a96`. |
| **Bug P0: la app no arrancaba** | La IA inyectó un servicio en un módulo que **nunca lo proveyó**. Los tests unitarios no lo detectan porque **no construyen el grafo de dependencias**. | Solo apareció al **arrancar la aplicación de verdad** dentro del gate §22. |
| **Afirmación falsa, corregida en el acto** | La IA afirmó que el frontend seguía usando datos falsos. Al leer el código, **era mentira**: ya consumía la API real. | Se autocorrigió explícitamente (§40). |
| **Se saltó el proceso** | Escribió código (`Money.tsx`, conversión de assets) **antes** de existir el spec y el plan. | **El autor lo detectó y lo detuvo:** *"No escribas más código, no veo la propuesta de roles. Tampoco veo tu plan con writing plans + specs."* |
| **Modeló mal los insumos** | Los diseñó como "porciones" contables, con stock entero. **No podía expresar** que 3 kg de carne cuestan $0.05/g. | El autor lo detectó al plantear su ejemplo de la carne. **El modelo tuvo que rehacerse.** |

**El patrón es claro y vale la pena decirlo:** la IA falla **en silencio y con confianza**. Lo que la
atrapa no es revisar su prosa — es **ejecutar el código de verdad** (§0: *evidence or block*) y tener a un
humano que **conoce el negocio** y detecta cuando el modelo no representa la realidad.

---

## 8. Conclusión — qué se puede afirmar en la defensa

1. **El diseño del producto, las reglas de negocio y la identidad visual son autoría del alumno.** La IA
   no propuso el problema, ni la solución, ni el modelo de negocio, ni el aspecto.
2. **La IA fue un ejecutor técnico y un asesor de arquitectura**, sujeto a un protocolo escrito
   (`rules.md`, 46 reglas) que el alumno definió y hace cumplir.
3. **El 66 % de los commits no tienen participación de IA.** Y **el 100 % de los commits los ejecutó el
   alumno a mano** — la IA tiene prohibido tocar el historial de Git (§23).
4. **La IA aportó valor que es medible**: encontró un agujero de autorización, un error sistemático de
   costeo, una medida de seguridad que habría sido falsa, y 25 duplicaciones de lógica.
5. **La IA también introdujo errores**, y el proyecto los documentó en vez de esconderlos. Ese es,
   precisamente, el motivo por el que existen el gate §22 y la regla §0.

---

*Documento vivo (regla §24). Ver también: [`rules.md`](../superpowers/priority/rules.md) ·
[`decisiones.md`](../arquitectura/decisiones.md) ·
[`algoritmo-circulo-innovacion.md`](algoritmo-circulo-innovacion.md).*
