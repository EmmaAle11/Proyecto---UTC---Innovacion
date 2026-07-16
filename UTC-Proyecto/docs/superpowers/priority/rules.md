# UTC PICK SAZÓN — Reglas obligatorias para Claude Code

> Registro canónico de decisiones: `docs/arquitectura/decisiones.md`.
> **Reformulado con SCAMPER el 2026-07-16.** Se fusionaron reglas que decían lo mismo y se **desecharon**
> las que duplicaban o **contradecían** a una BR / a la arquitectura congelada (D-038). El mapa completo de
> qué se fusionó, qué murió y por qué está al final (§SCAMPER).
>
> **Los números NO se renumeraron.** Son identificadores vivos: los citan `decisiones.md`, el CHANGELOG,
> la memoria y los prompts ("§23", "gate §22", "regla #0"). Renumerar rompería cada referencia a cambio de
> cero valor. Los números muertos quedan como **lápida** que apunta a su sucesor.

Proyecto: cooperativa escolar / dark kitchen, modalidad **Pick Up**. Tesis, 1 dev.

```txt
Frontend:  Expo SDK 56 + TypeScript + FSD
Backend:   NestJS + TypeScript + TypeORM  (Hexagonal + DDD + Vertical Slice — D-038)
BD:        PostgreSQL 16 (Docker local, puerto 5433)
Auth:      Keycloak 26 (Docker local, 8082) — JWT RS256 + roles + MFA admin
Backend:   puerto 3002 (D-034)
Seguridad: JWT, roles, DTO validation, rate limiting, MFA admin, circuit breaker
```

**Jerarquía ante conflicto:** `decisiones.md` (ADR) → **BR** (negocio) → reglas operativas (0–46).
Si una regla operativa contradice una BR o un ADR, **gana la BR/ADR y la regla se corrige**, no se obedece.

---

# 0. PRINCIPIO RAÍZ — EVIDENCIA O BLOQUEO

> **Fusiona las antiguas #0 (evidence), #1 (fail-closed), #15 (no fabrication) y #21 (regla final).**
> Eran cuatro formas de decir *"no afirmes lo que no ejecutaste"*. Ahora es una sola, con sus tres tiempos:
> antes (fabricar), durante (fallar), después (cerrar).

## 0.1 Nada se declara hecho sin evidencia verificable

Evidencia **válida** (algo que se ejecutó o se leyó, con su salida real):

```txt
Read real del archivo · grep con resultado · git diff revisado
npm run build / lint / test ejecutados (con su salida)
docker compose ps · curl real · logs reales del backend
validación real contra PostgreSQL / Keycloak (login + token)
validación visual de pantalla
```

Evidencia **inválida**:

```txt
"debería funcionar" · "parece correcto" · "asumo que" · "normalmente"
"ya quedó" sin diff · "compila" sin build · "Keycloak funciona" sin token
```

Sin evidencia → `NO VERIFICADO` / `BLOQUEADO POR FALTA DE EVIDENCIA`.

## 0.2 Prohibido FABRICAR

Nunca inventar: outputs, logs, usuarios, tokens, endpoints, tablas, migraciones, **tests que pasaron**,
**builds exitosos**, capturas revisadas, **cifras, fuentes o citas**.

> **Ampliada 2026-07-14** tras una auditoría real: se detectaron fabricaciones mías (un INPC inventado, una
> fuente inexistente) **y reincidencia dentro de la propia corrección**. Lo único que lo atrapa es
> **ejecutar el código, recalcular a mano y publicar el comando**. Un número sin comando reproducible es
> una fabricación esperando a que alguien la crea. Ver `leccion-auditoria-ia-miente` (memoria).

Si no se ejecutó: **"No ejecutado. No verificado. No confirmado."**

## 0.3 FAIL-CLOSED — ante el fallo, detenerse

Ante error, output vacío, diff inesperado, build/test fallido o validación incompleta:

```txt
BLOQUEADO: no puedo continuar porque la verificación falló o no hay evidencia suficiente.
No cierro la tarea hasta corregirlo.
```

Prohibido continuar después de: `0 replacements` · `String to replace not found` · grep sin el resultado
esperado · `git diff` vacío cuando se esperaba cambio · build/lint/test fallido · docker caído · Keycloak
sin token · PostgreSQL sin conexión.

## 0.4 La frase de cierre

No se puede cerrar con "listo" sin poder completar, con datos reales:

```txt
Está verificado porque ejecuté/leí/revisé ______ y el resultado fue ______.
```

Si no se puede completar → **No verificado.**

---

# 2. LEER Y MAPEAR ANTES DE TOCAR (análisis de impacto)

> **Fusiona la antigua #2 (read first) con las "pautas" que el usuario repite en cada arranque.**
> El orden no es decorativo: *entender* precede a *simplificar* (ponytail), nunca al revés.

**Antes de modificar código:**

```txt
1. Analiza el OBJETIVO (qué problema real se resuelve; el síntoma no es la causa).
2. Identifica los archivos principales.
3. Detecta lo relacionado: rutas, imports, servicios, controladores, DTOs,
   entidades, migraciones, hooks, componentes, tests.
4. Haz el ANÁLISIS DE IMPACTO (quién llama a lo que vas a cambiar: grep de callers).
```

**Después de modificar código:**

```txt
1. Revisa tus propios cambios (git diff).
2. Verifica si rompiste dependencias.
3. Ejecuta validación tipo pruebas de regresión.
4. Revisa errores de TypeScript, imports rotos, rutas incorrectas y contratos front↔back.
5. Si algo falla, corrígelo ANTES de dar el resultado final.
```

**Regla dura: no hagas cambios aislados.** Un fix que solo tapa la ruta que menciona el ticket deja rotos
a todos los llamadores hermanos. El fix perezoso **es** el fix de causa raíz: un guard en la función
compartida es un diff más chico que un guard en cada llamador.

Prohibido: editar a ciegas · inventar nombres de archivo, endpoints, entidades o DTOs · asumir que un
módulo existe.

---

# 3. ARQUITECTURA FRONTEND — FSD

> Absorbe lo vivo de la antigua **#13** (Expo). Se **desechó** su lista de "pantallas mínimas": la app
> tiene hoy muchas más y la lista solo servía para quedar desactualizada. El inventario real de pantallas
> vive en `.claude/Architecture.md §4.1` (que sí se mantiene).

```txt
src/
├─ app/        solo configuración global y navegación
├─ pages/      solo pantallas
├─ widgets/    bloques grandes de UI
├─ features/   acciones del usuario (store + api + lib + ui colocados)
├─ entities/   modelos de negocio
└─ shared/     reutilizable: ui, api client, theme, helpers, types
```

Invariantes (verificables con grep):

```txt
shared/ NUNCA importa de features/            ← dirección de dependencia
features/X no importa de features/Y           ← desacoplamiento
la app corre en Expo SDK 56 + TypeScript
```

Prohibido: lógica de negocio pesada en componentes visuales · llamadas API sueltas fuera de
`features/*/api` o `entities/*/api` · duplicar tipos front↔back sin justificación (ver **BR-015**) ·
crear carpetas fuera de FSD sin explicar (**#44**).

---

# 4. ARQUITECTURA BACKEND — HEXAGONAL + DDD + VERTICAL SLICE (D-038)

> **SUSTITUIDA (SCAMPER "S") el 2026-07-16.** La versión anterior mandaba
> `Controller → DTO → Service → TypeORM Repository → PostgreSQL`. Eso **contradice frontalmente** la
> arquitectura congelada en **D-038** (ya ejecutada y cerrada, D-040→D-046): hoy el dominio define
> **puertos** y la infraestructura los implementa. Una regla que ordena lo contrario de lo que el código
> hace no es una regla, es una trampa. El molde real vive en `.claude/Architecture.md`.

El código se organiza **por módulo de negocio**, no por capa técnica global:

```txt
modules/<contexto>/
├─ contracts/       DTOs públicos del módulo
├─ domain/          NÚCLEO PURO: agregados, value objects, events, ports/
├─ application/     casos de uso (service) — depende del PUERTO, no del adapter
├─ infrastructure/  adapters que IMPLEMENTAN los puertos (TypeORM, HTTP…)
├─ presentation/    controller + module (solo orquestación HTTP)
└─ tests/
```

**La prueba mnemónica:** borra `infrastructure/` de un módulo → su `domain/` **debe seguir compilando**.
Todo apunta al dominio; el dominio no apunta a nadie.

```txt
✅ Presentation → Application → Domain/Ports        ✅ Infrastructure → Domain Ports (implementa)
✗ Domain → Infrastructure / Application / Presentation
✗ Application → adapter concreto (depende del PORT)
✗ imports circulares entre módulos                  ✗ import del domain/ interno de otro módulo
```

**Excepción deliberada (regla #46, no es deuda):** `auth` / `settings` / `payments` siguen en capas
clásicas — CRUD y cross-cutting que no ameritan el molde. `products` es slice **pragmático**
(entity-as-model, D-046). Solo `orders` es DDD táctico completo.

Reglas que se conservan de la versión vieja porque siguen siendo verdad:

```txt
Controllers solo reciben request y devuelven response  ·  DTOs validan inputs
La lógica de negocio vive en el AGREGADO, no en un service anémico ni en el repo
Guards protegen rutas  ·  la estrategia de error es ÚNICA: DomainError (D-039)
```

Prohibido: consultar la BD desde un controller · validar permisos **solo** en el frontend · lógica de
pagos en el controller · endpoint sin DTO · endpoint privilegiado sin guard · `Result`/`Either`.

---

# 5. ~~ROLES Y PERMISOS~~ → **LÁPIDA. Ver BR-003 y BR-016.**

> **DESECHADA (SCAMPER "E") el 2026-07-16.** Decía *"Roles mínimos: admin, user"* y repartía permisos con
> ese supuesto. **BR-003 la derogó el 2026-07-14** (D-047, autorización explícita del usuario): son
> **cinco** roles. Mantener las dos era garantizar que alguien obedeciera la equivocada.
>
> Lo único que aportaba y que **no** estaba en BR-003 se movió allá: *"el frontend puede ocultar botones,
> pero el backend SIEMPRE valida permisos"*.

---

# 6. AUTH CON KEYCLOAK

Keycloak es la **única** fuente de autenticación.

```txt
Realm: utc-food
Roles HOY en código:   user · admin
Roles OBJETIVO (D-047): user · cocina · inventario · mostrador · admin   ← los implementa el Plan 01
MFA: obligatoria para admin (TOTP). El user no la requiere (demo escolar).
JWT RS256 validado por NestJS contra JWKS. TTL 30 min + refresh 7 días.
```

Prohibido: guardar contraseñas a mano en PostgreSQL · inventar usuarios fuera de Keycloak · aceptar tokens
sin validar firma · **aceptar el rol o el alcance que manda el frontend** (ver **BR-016**).

---

# 7. VALIDACIÓN DE ENTRADA

Todo endpoint que reciba datos usa **DTO** con `class-validator`.

```txt
email válido (@edu.utc.mx, BR-002)   ·  precio > 0        ·  stock >= 0
cantidad > 0                          ·  tiempo de prep > 0
estado del pedido dentro de BR-004   ·  ids como UUID, no string libre
```

Prohibido: body libre · `any` sin necesidad · precio o stock negativo · estados inventados ·
**texto libre donde debe ir un id del catálogo** (BR-016).

> El límite de confianza no es opcional (ponytail no aplica aquí): la validación en la frontera **nunca**
> se simplifica.

---

# 8. RATE LIMITING

```txt
login: 5 / min      crear pedido: 10 / min
productos: 60 / min rutas privilegiadas: 30 / min
```

Al exceder: **HTTP 429**, no procesar, **no escribir en BD**.

---

# 9. ~~CIRCUIT BREAKER PARA PAGOS~~ → **LÁPIDA. Ver BR-010.**

> **FUSIONADA (SCAMPER "C") en BR-010 el 2026-07-16.** Ambas describían el mismo mecanismo con distintas
> palabras. Lo que #9 tenía y BR-010 no (los tres "prohibido") se mudó a BR-010.

---

# 10. ~~REGLAS DE NEGOCIO PICK UP~~ → **LÁPIDA. Ver BR-004.**

> **DESECHADA (SCAMPER "E") el 2026-07-16.** Era una copia literal de BR-004 (mismos estados, mismas
> transiciones) con un desfase peligroso: **#10 no conocía `READY_LATER`**, que sí existe en el código.
> Dos listas de estados = una de las dos miente. Sobrevive la BR.

---

# 11. POSTGRESQL / TYPEORM

```txt
Entidades TypeORM. Migraciones SIEMPRE que el cambio toque el esquema.
NUNCA synchronize:true. Validar conexión real antes de afirmar que funciona.
Las invariantes duras van en la BD (CHECK, FK, índice único), no solo en la app.
Preferir text + CHECK sobre enum de PG: crecer no debe requerir ALTER TYPE.
```

> Se **eliminó** la lista de "entidades mínimas" que vivía aquí: nació con 6, hoy hay más
> (`FinishedGood`, `StockMovement`, `AuditLog`, `Branch`…) y solo servía para quedar obsoleta. El modelo
> de datos real y mantenido está en `.claude/Architecture.md §7`.

Prohibido: borrar tablas sin respaldo · cambios destructivos sin avisar · guardar datos sensibles
innecesarios · guardar tokens completos.

---

# 12. DOCKER LOCAL

```bash
docker compose up -d   # postgres · keycloak · backend
docker compose ps      # ← sin esto, NO se puede decir "Docker funciona" (#0)
docker compose down    # SIN -v: conserva los datos (no re-migrar ni re-sembrar)
```

Prohibido afirmar que Docker / PostgreSQL / Keycloak funcionan sin `ps`, sin conexión real y sin
login+token real. Runbook verificado: `docs/Read/levantar-proyecto.md`.

---

# 13. ~~FRONTEND / EXPO GO~~ → **LÁPIDA. Ver #3 (FSD) y `.claude/Architecture.md §4`.**

> **FUSIONADA (SCAMPER "C") el 2026-07-16.** Sus invariantes vivas se mudaron a #3. Su lista de "pantallas
> mínimas" se **desechó**: quedó obsoleta el día que la app creció, y una lista obsoleta en la regla es
> peor que ninguna lista. Además el instalable real es **dev build APK (solo Android)**, no Expo Go.

---

# 14. DISEÑO E IDENTIDAD VISUAL

> **SUSTITUIDA (SCAMPER "S").** Decía "Claude Design"; hoy la identidad es **"Editorial Street-Food"**,
> con los másters en `brand/` y primitivas `Type` + `expo-font` (D-020). `design-system/` fue eliminado.

Regla que **no cambia** y es la razón de ser de esta sección:

```txt
El diseño NO manda sobre la seguridad ni sobre las reglas de negocio.
```

Prohibido: priorizar estética sobre validaciones · ocultar errores críticos · flujos bonitos pero
inseguros.

---

# 15. ~~NO FABRICATION POLICY~~ → **LÁPIDA. Ver #0.2.**

> **FUSIONADA en #0** el 2026-07-16 (era su mismo principio, partido en dos). Se aprovechó para
> **amplificarla** (SCAMPER "M") con la lección de la auditoría 2026-07-14.

---

# 16. GIT — DISCIPLINA Y REGLA DE ORO

> **Fusiona #16 (disciplina), #17 (secretos) y #23 (el usuario commitea).** Las tres gobiernan el mismo
> acto: *qué entra al historial y quién lo mete*. **§23 sigue siendo citable** (apunta aquí).

## 16.1 REGLA DE ORO — el historial lo ejecuta el USUARIO (ex-§23)

El historial de git es del **usuario** (aprendizaje de GitHub + control humano del repositorio).

Claude **NO ejecuta**: `git commit` · `git push` · `git merge`/`rebase` sobre ramas publicadas.
Claude **SÍ hace**: `git status` · `git diff` · `git add` explícito · **proponer** el mensaje completo
(incluido el trailer `Co-Authored-By`) · **detenerse**.

```txt
1. Claude hace los cambios y los deja staged.
2. Claude muestra status/diff y PROPONE los comandos de commit + push.
3. Claude SE DETIENE.
4. El usuario ejecuta commit y push a mano.
```

**Excepción única:** el usuario dice explícitamente *"hazlo tú"* en ese momento.

## 16.2 Qué nunca entra al historial (ex-#17)

```txt
passwords · client secrets · JWT secrets · tokens
connection strings con credenciales · API keys
.env / .env.local / .env.production · node_modules/ · dist/ · coverage/ · *.log
```

Permitido en documentación: `KEYCLOAK_REALM=utc-food`, `POSTGRES_HOST=localhost` — **nombres, nunca
valores sensibles reales**.

Prohibido además: `commit -a` · commitear cambios no relacionados.

---

# 17. ~~SECRETOS~~ → **LÁPIDA. Ver #16.2.**

---

# 18. TEST / BUILD MÍNIMO

```bash
# Backend                    # Frontend                # Infra
npm run lint                 npm run lint              docker compose ps
npm run build                npm run typecheck         docker compose logs
npm test                     npx expo start
```

Base de datos: probar conexión real + verificar la tabla o la migración.
Esto es el **piso**; el techo para aplicar un cambio lo pone **#22**.

---

# 19. DEFINITION OF DONE

Una tarea solo cierra con: archivos leídos · cambios hechos · diff revisado · validaciones **ejecutadas** ·
resultados reales · riesgos detectados · **qué NO se validó** · nivel de confianza.

```txt
Observaciones:            Riesgos:
Validaciones realizadas:  Validaciones pendientes:
Supuestos explícitos:     Nivel de confianza: Alto/Medio/Bajo + justificación
```

> "Qué NO fue validado" es el campo más importante del formato: es el único que se pierde solo.

---

# 20. ~~PRIORIDADES DEL PROYECTO~~ → conservada, con su matiz

Orden de prioridad:

```txt
1. Que funcione          2. Seguridad básica       3. Claridad del código
4. Arquitectura limpia   5. Explicable en clase    6. Diseño visual     7. Optimización
```

**Matiz (autocrítica, #40):** este orden **no** autoriza a saltarse la seguridad "porque primero hay que
hacer que funcione". El #2 no es negociable contra el #1 en las fronteras de confianza (ver #7). La lista
ordena **el esfuerzo**, no **los permisos**.

---

# 21. ~~REGLA FINAL~~ → **LÁPIDA. Ver #0.4.**

---

# 22. GATE DE CONFIANZA 95–100 % PARA APLICAR CAMBIOS

Cuando exista un plan posterior a un cambio, el cambio **solo se aplica** si la confianza —validada con
**workflows** y **agente de regresión**— está entre 95 % y 100 %.

```txt
1. Ejecutar el plan en workflows (fan-out de verificación / caza adversaria).
2. Lanzar el agente de regresión sobre el área afectada.
3. Calcular la confianza con evidencia REAL (no estimada).

Confianza 95–100 %  → se aplica.
Confianza < 95 %    → BLOQUEADO.
```

Prohibido: aplicar con confianza solo estimada · declarar 95 %+ sin haber corrido workflows ni regresión ·
omitir la regresión por prisa · cerrar sin reportar la confianza final.

**Corolario del usuario (2026-07-15), vigente:** *"No se documenta ninguno, sin importar si es P5: todo se
arregla."* Un hallazgo P0–P5 **no se difiere como residual**; se arregla o se **prueba con evidencia** que
no es un defecto. El gate cierra en **0 P0-P5**, y las rondas de caza se repiten hasta converger.

---

# 23. ~~REGLA DE ORO — GIT~~ → **LÁPIDA. Ver #16.1** (sigue citable como §23).

---

# 24. DOCUMENTAR ES TRABAJAR — DOCUMENTOS VIVOS + CHANGELOG

> **Fusiona #24 (documentos vivos) y #39 (changelog con hora).** Ambas decían *"si no está documentado,
> no cuenta"*; una miraba la propuesta, la otra el historial.

## 24.1 Los documentos vivos (siempre al día con el código real)

```txt
docs/propuesta/algoritmo-circulo-innovacion.md → la Propuesta   · tono juvenil / estudiantil
docs/propuesta/Algoritmo-ejecucion.md          → la Ejecución    · tono plano, pasos numerados
docs/arquitectura/decisiones.md                → ADR ligero D-00X · Contexto · Decisión · Verificación
.claude/Architecture.md                        → el manual técnico (modelo de datos, flujos, invariantes)
```

Todo cambio de alcance, productos, pantallas, decisiones o reglas de negocio **obliga** a actualizar el
documento que le toca, **en su tono**, sin romper la numeración de fases ni dejar secciones "volando".

## 24.2 El CHANGELOG (`docs/superpowers/priority/CHANGELOG.md`)

Requieren entrada: feature nueva (desde ~100 líneas) · fix crítico (auth, pagos, estado) · refactor de
arquitectura · migración · cambio de puerto/host/config · decisión que afecte alcance o negocio.
No la requieren: typos, indentación, variable local sin impacto, bump minor.

Cada entrada: hash (`git show <hash> --stat`) · fecha ISO + hora · qué cambió (1-2 líneas) · **por qué** y
sus implicaciones · D-00X relacionada · **evidencia verificable**.

## 24.3 La regla dura

Un documento que **contradice al código** es peor que un documento ausente: el ausente se nota, el que
miente se obedece. Si el código y el doc no coinciden, **el doc se corrige en el mismo cambio**.

---

# 38. EXPLICACIONES EN DOBLE FRENTE (TÉCNICO + ALEGORÍA)

Cuando el usuario pida una **explicación** ("explícame", "qué es", "cómo funciona", "no entiendo",
"detalla", "profundiza"), la respuesta lleva **los dos frentes**:

```txt
1. FRENTE TÉCNICO — anclado al código real (archivos, funciones, flujo, edge cases,
   propiedades de seguridad). Sujeto a #0: nada inventado.
2. FRENTE ALEGÓRICO — una metáfora cotidiana que MAPEE la realidad técnica pieza por
   pieza. Ilumina, no adorna.
```

```txt
- Los DOS son obligatorios. Falta uno = explicación incompleta.
- La alegoría no puede contradecir al frente técnico. Si una pieza no tiene buen mapeo,
  DECIRLO ("aquí la analogía se rompe porque…") en vez de forzarla.
- Escala la longitud a la complejidad.
- NO aplica a lo que no es explicación (un status, un diff, un comando listo para pegar).
```

---

# 39. ~~DOCUMENTACIÓN DE CAMBIOS~~ → **LÁPIDA. Ver #24.2.**

---

# 40. AUTOCRÍTICA OBLIGATORIA — NO DAR LA RAZÓN POR DEFECTO

Claude **no** es complaciente. Evalúa críticamente **tanto** lo que el usuario afirma **como** lo que el
propio Claude propone.

```txt
- NO asumir que el usuario tiene razón porque lo dice. Evaluar con lógica + evidencia (#0).
  Si acierta: decirlo CON el razonamiento (y la autocrítica del propio error, si lo hubo).
  Si NO: argumentar en contra con evidencia, respetuosamente, en vez de ceder.
- NO asumir que lo propuesto por Claude está bien: buscar el contra-argumento, el caso que
  lo rompe, el supuesto no validado. Preferir "esto puede fallar si X" a "esto queda perfecto".
- Prohibido el patrón yes-man: "tienes toda la razón" sin verificar; aceptar un requisito sin
  señalar su riesgo/costo; confirmar que funciona sin evidencia.
- Al recibir corrección: primero verificar si es correcta (el usuario también se equivoca);
  luego reconocer el propio error explícitamente, sin adornarlo.
- Aplica SIEMPRE, sobre todo bajo prisa o cuando "parece obvio".
```

**Evidencia de que funciona (no es teoría):** la caza adversaria del Plan 07 encontró que **mis propios
fixes** introdujeron defectos nuevos (un `!== PENDING` demasiado estricto que abría un hueco de ingresos;
un barrido que filtraba por *método* de pago en vez de por *estado*). Sin autocrítica activa, esos cambios
se habrían cerrado como "listo".

Cierre: dar la razón por inercia es una falla. La lealtad es a la **verdad verificable**, no a complacer.

---

# 41. CÓDIGO MODULAR + COMENTARIOS ESPECÍFICOS (código NUEVO)

```txt
- MODULAR: subrutinas de UNA responsabilidad, preferentemente puras y testeables sin DI.
  Nada de bloques monolíticos inline cuando la lógica tiene nombre propio.
- REUSO PRIMERO (ponytail, ver #42): antes de escribir, buscar si ya existe y reusarlo.
- COMENTARIOS ESPECÍFICOS: qué hace, entradas/salidas, y el PORQUÉ / la invariante NO obvia
  ("ancla mediodía UTC para no retroceder un día en MX"). Prohibido el comentario que solo
  repite el nombre de la función.
- ALCANCE: solo el código NUEVO del cambio en curso. NO gatilla refactors del código viejo
  circundante (cambio mínimo seguro).
```

---

# 42. UBICACIÓN DEL CÓDIGO — YAGNI + REUTILIZACIÓN

Antes de escribir, responder **obligatoriamente**: *¿ya existe un lugar donde este código debería vivir?*

```txt
SÍ → moverlo/reusarlo ahí. Buscar en este orden:
     el módulo → su domain/ → su application/ → su infrastructure/ → shared/
NO → crear el lugar adecuado (¿en qué capa vive? #4).
```

```txt
NO copiar una función que ya está en shared/     NO duplicar un servicio de application/
NO crear un helper que TypeORM ya provee         NO escribir validación que class-validator cubre
```

**Regla dura:** código duplicado = **BLOQUEADO** hasta encontrar la ubicación real.
La ubicación correcta es parte de la calidad, no un lujo.

---

# 43. DECISIONES ARQUITECTÓNICAS — ANÁLISIS OBLIGATORIO

> **Fusiona #43 (6 preguntas), #44 (no crear carpetas) y #46 (umbrales YAGNI).** Las tres respondían
> *"¿esta estructura merece existir?"* a distinta escala: el módulo, la carpeta y el umbral.

## 43.1 Cambio que toca > 1 módulo o mete dependencia nueva → las 6 preguntas

```txt
1. ¿Por qué aquí? (justificar el módulo/capa concreto)
2. ¿Por qué no en otro módulo? (considerar X, Y, Z)
3. ¿Qué dependencia nueva introduce? (npm, módulos internos, externos)
4. ¿Rompe encapsulamiento? (¿viola límites? ¿expone internals?)
5. ¿Aumenta el acoplamiento? (¿más módulos colgando de uno? ¿circular?)
6. ¿Disminuye la cohesión? (¿el módulo sigue teniendo UNA responsabilidad?)

7. (futuro) ¿Facilita o dificulta mantenerlo en dos años?
   DOXIA = Durabilidad · Observabilidad · eXtensibilidad · Independencia · Autotestabilidad
```

**Si no puedes responderlas → BLOQUEADO.** El cambio sería un riesgo técnico no documentado.
Prohibido responder *"probablemente sí"* en lugar de analizar, o decidir por *"parece limpio"*.

## 43.2 Carpeta nueva → las 4 preguntas (ex-#44)

```txt
1. ¿Qué responsabilidad encapsula?   2. ¿Qué problema evita?
3. ¿Qué principio SOLID mejora?      4. ¿Qué pasa en un año si NO existe?
```

Si no puedes responderlas, **no la crees**. Una carpeta sin responsabilidad clara es deuda desde el día 1.

## 43.3 Umbrales — la estructura sigue al código (ex-#46)

```txt
application/     archivos planos hasta ~5 casos de uso. commands/ y queries/ nacen a ~20.
infrastructure/  arrancar con persistence/ y external/. messaging/ cache/ queue/ cuando
                 aparezca el primer RabbitMQ/Redis/Azure real. NO antes.
presentation/    archivos planos mientras haya UNO de cada tipo.
tests/           unit/ e integration/. contract/ builders/ fixtures/ cuando aparezcan.
contracts/       dentro del módulo. Se promueve a backend/contracts/ SOLO si se genera
                 SDK/OpenAPI real — y eso es una decisión de §43.1, no un default.
frontend (FSD)   app · pages · widgets · features · entities · shared.
                 processes/ SOLO para flujos largos reales. NUNCA flows/ además.
```

**Regla dura:** carpeta con **un solo archivo** dentro = prematura → colapsar a archivo plano.
Ver `bounded-contexts.md` para qué módulo puede hablar con cuál.

---

# 44. ~~NO CREAR CARPETAS~~ → **LÁPIDA. Ver #43.2.**

# 45. NO ACEPTAR PATRONES POR AUTORIDAD

```txt
Aunque venga de Microsoft, AWS, Google, ThoughtWorks o Martin Fowler, verifica primero si
aporta valor a UTC Pick Sazón en su contexto REAL (1 dev, 160 h, tesis, futuro AZURE).

Critica TODAS las propuestas antes de aceptarlas: la mía, la de ChatGPT, la de cualquier libro.
```

La autoridad de la fuente no reemplaza el análisis. **El contexto manda.**

# 46. ~~UMBRALES YAGNI~~ → **LÁPIDA. Ver #43.3.**

---
---

# BUSINESS RULES — UTC PICK SAZÓN (BR)

Reglas de negocio del dominio. **Ante conflicto entre una BR y una regla operativa (0-46), gana la BR.**

## BR-001 — NO DELIVERY

UTC Pick Sazón es **exclusivamente Pick Up**. Prohibido implementar: repartidores · geolocalización *de
entrega* · cálculo de rutas · costos de envío · tracking de repartidor.

> Matiz (D-035): sí existe **geolocalización de sucursal** (para saber en qué cooperativa pides y que tu
> pedido llegue a esa cocina). Eso **no** es delivery: nadie te lleva nada.

Si un cambio introduce conceptos de delivery → **BLOQUEADO**.

## BR-002 — IDENTIDAD UTC

Los usuarios se autentican con correo institucional **`@edu.utc.mx`** (confirmado 2026-06-24, D-011 — es el
orden invertido del supuesto inicial `utc.edu.mx`).

No permitir correos personales · no permitir anónimos · el backend valida identidad vía Keycloak.

## BR-003 — ROLES

> **MODIFICADA el 2026-07-14** por autorización explícita del usuario (**D-047**). Deroga la antigua regla
> **#5**. La autorización, textual:
>
> *"Por cooperativa suelen ser 3 personas. Quiero que una persona se dedique a cocinar; que otra haga el
> inventario y lo registre junto con costos y ganancias; que otra reciba las órdenes, cambie estatus por
> orden de cocina, cobre y dé cambio cuando es en efectivo, y facture. Más el admin que ya tenemos."*

```txt
user          cliente de la PLATAFORMA (@edu.utc.mx). Sin cooperativa fija.
cocina        ACEPTA y TERMINA los pedidos. Ve qué preparar.
inventario    materia prima, costos, recetas, MERMAS, conteo físico, ganancia.
mostrador     cobra, da cambio, CAJA, entrega, REOFERTA, layout CFDI.
admin         administrador de UNA cooperativa. Superconjunto de los tres.
```

**El principio:** *cada transición la dispara quien tiene la información.* El cocinero es el único que sabe
que la hamburguesa salió; el de mostrador, el único que sabe que el cliente ya está enfrente con el dinero.

**Los DOS ejes del permiso:**

```txt
1. ¿QUÉ PUEDES HACER?  → el ROL
2. ¿SOBRE QUÉ?         → la COOPERATIVA (branch_id)
```

**Todo rol distinto de `user` está anclado a EXACTAMENTE UNA cooperativa**, y ese `branch_id` sale del
**JWT**, jamás del request (**BR-016**). **Una persona = un rol** (Keycloak permite arreglos; no se usan:
un solo dueño inequívoco del faltante de caja).

**Regla dura (heredada de #5, lo único que valía la pena salvar):**

```txt
El frontend puede ocultar botones, pero el BACKEND SIEMPRE valida permisos.
```

No crear sin autorización explícita: `manager` · `owner` · **`super-admin`** ← *expresamente rechazado*: un
rol que vea TODAS las cooperativas es superficie de ataque que el proyecto no necesita. Dar de alta
cooperativas y administradores se hace en la consola de Keycloak, **fuera** de la aplicación.

> **Estado (2026-07-16, verificado):** esto es **diseño**. En código siguen existiendo solo `user` y
> `admin`. Lo implementa el **Plan 01**, que es el primero del orden de ejecución **porque nada de lo demás
> tiene dueño sin él**.

## BR-016 — EL ALCANCE SALE DEL TOKEN, NO DEL REQUEST

> **Nueva el 2026-07-14** (D-047). Nace de un **defecto real** encontrado en auditoría (OWASP A01/BOLA):
> `GET /orders/all?branchId=X` autoriza con un dato que manda el cliente — y **sin** el parámetro devuelve
> TODAS las cooperativas (fail-open). Sigue abierto hasta el Plan 01.

```txt
❌ @Get('all') findAll(@Query('branchId') branchId?: string)   ← el CLIENTE decide qué ve
✅ @Get('all') findAll(@Req() { user })  → user.branchId        ← el TOKEN decide
```

**El filtro debe ser IMPOSIBLE de olvidar:** la firma del puerto exige `branchId: string` (**no**
`string | undefined`) para que **el compilador** haga de guardia.

Prohibido: aceptar `branch_id`/`branchName` como texto libre en un DTO (se valida contra el catálogo) ·
devolver todas las cooperativas cuando falta el filtro (**fail-open**) · confiar en que el frontend mande
el alcance correcto.

Si alguien manda un `branchId` que no es el suyo → **403**, no un 200 filtrado en silencio.
**Queremos que truene, para que el intento se note.**

## BR-004 — FLUJO DEL PEDIDO

> Absorbe la antigua **#10** y **corrige su desfase**: `READY_LATER` (pedido extendido) existe en el
> código y #10 no lo conocía.

Estados: `pending` · `preparing` · `ready` · `ready_later` · `picked_up` · `not_picked_up` · `cancelled`.

```txt
pending      -> preparing | cancelled
preparing    -> ready | cancelled          (cancelar tras cobrar = saga de compensación, D-052)
ready        -> picked_up | not_picked_up | ready_later
ready_later  -> picked_up | not_picked_up
```

Prohibido: `picked_up` → cualquier otro (**terminal**) · `cancelled` → `preparing`/`ready` · saltar estados
sin validación · que el `user` marque `ready` · editar un pedido ya recogido.

**Dónde vive:** en el agregado `Order` (`ALLOWED_TRANSITIONS`), no en el service ni en el repo (#4).

## BR-005 — READY_AT ES FUENTE DE VERDAD

`ready_at` es el timestamp oficial para: tiempo listo · ventana de recogida · cálculo de no recogido.
**Nunca** timestamps del frontend. **Siempre** hora del servidor.

## BR-006 — REOFERTA DE PREPARADOS

> **REESCRITA el 2026-07-15 (D-052, Plan 08).** La versión anterior (*"cuando un pedido entra a
> `not_picked_up`, sus productos pueden ser re-ofertados; tag = Preparados"*) describía **el bug**: la
> unidad volvía a `products.stock` como fresca y sin caducidad → **se vendía para siempre**, y el
> `reoffer_price` en el producto **contaminaba toda venta** con descuento.

**La comida preparada es un OBJETO, no un contador.** Nace, caduca y tiene su propio precio:

```txt
ready → not_picked_up   NO vuelve a products.stock. Nace un finished_good
                        (source='no_recogido', expires_at = now + REOFFER_TTL, 4 h por defecto).

finished_good           ├─ mostrador le pone precio            → reoffer_price DE LA UNIDAD
                        ├─ un cliente la compra                → qty--. Recuperada ✅
                        └─ VENCE (barrido automático)          → stock_movements(merma,'caducado')
                                                                 + se elimina. FIN DEL CICLO ✅
```

```txt
El precio de reoferta es de la UNIDAD (finished_goods.reoffer_price), NUNCA del producto.
La unidad reofertada es un ítem de catálogo DISTINTO, con su precio exacto — no un auto-FEFO
que promedia precios (el carrito no podría predecir el total y divergiría de lo cobrado).
El pedido referencia la unidad concreta (order_items.finished_good_id).
Una unidad vencida NO es vendible (expires_at > now en la reserva), aunque el barrido no haya pasado.
```

**La caducidad es AUTOMÁTICA por tiempo, y es deliberado:** depender de que una persona marque la merma es
exactamente lo que causó el bucle infinito. El auto-vencimiento es la garantía de que el ciclo **termina**.
Una merma **anticipada** manual (rol `inventario`) es una **adición** válida, **nunca** un reemplazo.

La UI muestra *"Listo hace X minutos"* calculado desde `ready_at` (BR-005).

## BR-007 — HISTÓRICO DE PREPARACIÓN

El histórico es la **única** fuente para promedios. Tabla `preparation_times`.

```txt
mínimo 3 registros para confiar en el promedio · menos de 3 → usar tiempo_base
promedio sobre las últimas 20 muestras
```

Prohibido: inventar tiempos (#0.2) · usar tiempos enviados por el frontend.

## BR-008 — QUIÉN MUEVE EL PEDIDO

> **Actualizada 2026-07-14 (D-047).** Antes decía *"solo admin"*; con BR-003 el reparto es por
> información, no por jerarquía.

```txt
cocina     pending → preparing → ready        (acepta y termina)
mostrador  ready → picked_up | not_picked_up  (entrega: es quien ve al cliente)
admin      cualquiera de las anteriores, en SU cooperativa
user       NUNCA modifica ready_at, accepted_at ni el estado interno
```

Registrar tiempos reales es efecto del sistema, no una acción manual.

## BR-009 — PAGOS

Métodos válidos: `mercado_pago` · `paypal` · `tdc` · `tdd` · `efectivo`. No agregar sin autorización.

```txt
efectivo = no pasa por pasarela; se cobra en el mostrador al ENTREGAR.
           Hasta entonces el pago queda pendiente.
Los pagos son SIMULADOS (D-033). Nunca decir ni documentar lo contrario.
```

## BR-010 — CIRCUIT BREAKER

Si la pasarela falla repetidamente → estado **OPEN**. Mientras OPEN:

```txt
no intentar cobrar · devolver error controlado · sugerir método alternativo (efectivo)
```

Mensaje: *"El servicio de pago no está disponible temporalmente. Intenta más tarde."*

Prohibido (heredado de la antigua #9): **reintentar infinitamente** · **crear un pedido pagado si el pago
falló** · **marcar como pagado sin evidencia**.

## BR-011 — STOCK

> **Precisada 2026-07-15 (D-052).** La antigua hablaba de "categoría Preparados" con min/máx; hoy lo
> preparado **no vive en `products.stock`** (BR-006).

```txt
products.stock  = unidades FRESCAS / "se puede hacer". NUNCA negativo (CHECK en BD).
                  Regla dark kitchen: el 0 NO impide vender (se cocina al momento);
                  el candado real de venta es isAvailable, no el número.
finished_goods  = unidades YA HECHAS (BR-006). qty >= 0 (CHECK).
Disponibilidad(producto) = products.stock + Σ finished_goods.qty (no vencidas).
```

`minStock`/`maxStock` son **etiquetas del admin** (alertas), no reorden automático.

## BR-012 — NOTIFICACIONES

Generan push: pedido **aceptado** · **listo** · **cancelado** · **no recogido**.
**No enviar duplicadas.** Se emiten por Domain Event → outbox, dentro de la transacción.

## BR-013 — MÉTRICAS

Permitidas: tiempo promedio por producto · más vendidos · pedidos diarios · no recogidos ·
(D-047) costos, márgenes y ganancia — **visibles solo para `inventario` y `admin`**.

**No almacenar información académica.**

## BR-014 — PRIVACIDAD

Un usuario solo consulta **sus propios** pedidos. Prohibido consultar los de otros estudiantes.

> (D-047) `cocina` **no ve** al cliente: solo el código `#U-00042`. No necesita el nombre para cocinar.

## BR-015 — FUENTE ÚNICA DE VERDAD

```txt
Backend:  valida · autoriza · calcula · persiste · decide estados
Frontend: muestra datos · solicita acciones
```

**Corolario (D-048, Plan 02):** se detectaron **25 duplicaciones** back↔front, incluida **la fórmula del
precio a cobrar** — el carrito podía mostrar un total y la caja cobrar otro. La solución no es generar
código: es que la app **importe los contratos del backend**, para que **si el backend cambia un campo, la
app deje de compilar**. No hay paso de generación que alguien pueda olvidar porque no hay nada que generar.

---
---

# SCAMPER — qué se hizo el 2026-07-16 y por qué

Estado previo: **34 reglas** (0-24 y 38-46) + 16 BR. Varias se contradecían entre sí o contra el código.
Estado nuevo: **20 reglas vivas** + 8 lápidas citables + 16 BR (5 actualizadas contra el código real).

| Letra | Aplicado a | Resultado |
|---|---|---|
| **S** — Substitute | **#4** mandaba `Controller→Service→TypeORM Repo`; **contradecía D-038** (hexagonal+slice, ya ejecutado). **#14** invocaba "Claude Design", que ya no existe. | #4 reescrita al molde real; #14 → identidad "Editorial Street-Food" conservando su única regla viva (*el diseño no manda sobre la seguridad*). |
| **C** — Combine | #0+#1+#15+#21 · #16+#17+#23 · #24+#39 · #43+#44+#46 · #9→BR-010 · #13→#3 | 15 reglas → 4. Cada fusión toma **lo mejor de ambos mundos** (ninguna cláusula "prohibido" se perdió; se listan en la superviviente). |
| **A** — Adapt | #5 (roles) vs **BR-003** (D-047) | #5 muere; lo único que aportaba (*"el frontend oculta, el backend valida"*) se adapta y **vive dentro de BR-003**. |
| **M** — Magnify | **#0.2** (no fabricar) y **#40** (autocrítica) | Amplificadas con **evidencia real**: las fabricaciones de la auditoría 2026-07-14 y los defectos que mis propios fixes introdujeron en el Plan 07. Una regla con su cadáver adjunto se obedece; una abstracta no. |
| **P** — Put to other use | #2 (read first) | Se le acopla el checklist de **análisis de impacto** que el usuario pega en cada arranque: deja de ser un prompt repetido y pasa a ser regla. |
| **E** — Eliminate | **#10** (copia de BR-004, **y sin `READY_LATER`**) · **#5** (contradice BR-003) · listas obsoletas de "entidades mínimas" (#11) y "pantallas mínimas" (#13) | Muertas. Dos listas de estados = una miente. Una lista que envejece sola es peor que no tenerla: el modelo real vive en `.claude/Architecture.md`, que sí se mantiene (#24.1). |
| **R** — Rearrange | La numeración | **NO se renumeró — decisión deliberada.** Los números son IDs vivos citados por ADRs, CHANGELOG, memoria y prompts ("gate §22", "§23", "#38"). Renumerar rompía cada referencia a cambio de estética. Los muertos quedan como **lápida** que apunta al sucesor: `§23` sigue funcionando. |

**Lo que NO se tocó** (pasaron el filtro sin cambios sustantivos): #8 rate limiting · #12 docker · #18
test/build · #19 DoD · #22 gate · #38 doble frente · #41 modular · #42 ubicación · #45 autoridad.

**BRs actualizadas contra el código real:** BR-004 (+`ready_later`) · BR-006 (reescrita: D-052) ·
BR-008 (reparto por rol, D-047) · BR-011 (stock vs finished_goods) · BR-015 (+corolario SSOT, D-048).
