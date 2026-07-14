# UTC FOOD / COOPERATIVA — Reglas obligatorias para Claude Code

> Registro canónico de decisiones del proyecto: `docs/arquitectura/decisiones.md`.

Estas reglas aplican para el proyecto escolar de aplicación de cooperativa / dark kitchen con modalidad Pick Up.

Stack del proyecto:

```txt
Frontend:
Expo Go + TypeScript + NativeWind/Tailwind + FSD

Backend:
NestJS + TypeScript + Controllers + Services + TypeORM

Base de datos:
PostgreSQL local con Docker

Auth:
Keycloak local con Docker

Seguridad:
JWT, roles, DTO validation, rate limiting, MFA admin, circuit breaker

Editor:
Visual Studio Code

Diseño:
Claude Design
```

---

# 0. PRINCIPIO RAÍZ: EVIDENCE OR BLOCK

Claude Code no puede decir que algo está hecho, corregido, funcionando o validado sin evidencia verificable.

Evidencia válida:

```txt
Read real del archivo
grep/search con resultado positivo
git diff revisado
npm run build ejecutado
npm run lint ejecutado
npm test ejecutado
docker compose ps
curl real
logs reales del backend
validación visual de pantalla
validación real contra PostgreSQL
validación real contra Keycloak
```

Evidencia inválida:

```txt
“Debería funcionar”
“Parece correcto”
“Asumo que”
“Normalmente”
“Ya quedó” sin diff
“Compila” sin ejecutar build
“Keycloak funciona” sin probar login/token
```

Si no hay evidencia, responder:

```txt
NO VERIFICADO
NO CONFIRMADO
BLOQUEADO POR FALTA DE EVIDENCIA
```

---

# 1. FAIL-CLOSED POLICY

Ante cualquier error, output vacío, diff inesperado, build fallido, test fallido o validación incompleta, Claude Code debe detenerse.

Responder:

```txt
BLOQUEADO: no puedo continuar porque la verificación falló o no existe evidencia suficiente.
No haré commit ni cerraré la tarea hasta corregirlo.
```

Está prohibido continuar después de:

```txt
0 replacements
String to replace not found
grep sin resultados esperados
git diff vacío cuando se esperaba cambio
build fallido
lint fallido
test fallido
docker caído
Keycloak sin token válido
PostgreSQL sin conexión
```

---

# 2. READ FIRST / MAP FIRST

Antes de modificar código:

```txt
1. Leer README.md si existe.
2. Leer rules.md.
3. Leer estructura del proyecto.
4. Buscar archivos relacionados.
5. Leer controller/service/dto/entity afectado.
6. Confirmar rutas reales antes de editar.
```

Está prohibido:

```txt
editar a ciegas
inventar nombres de archivos
inventar endpoints
inventar entidades
inventar DTOs
asumir estructura FSD
asumir que un módulo existe
```

---

# 3. ARQUITECTURA FRONTEND FSD

El frontend debe respetar Feature-Sliced Design.

Estructura esperada:

```txt
src/
├─ app/
├─ pages/
├─ widgets/
├─ features/
├─ entities/
└─ shared/
```

Reglas:

```txt
app/ solo configuración global
pages/ solo pantallas
widgets/ bloques grandes de UI
features/ acciones del usuario
entities/ modelos de negocio
shared/ componentes reutilizables, helpers, api client y types
```

Prohibido:

```txt
meter lógica de negocio pesada en componentes visuales
hacer llamadas API directas desde cualquier componente sin patrón claro
duplicar tipos entre frontend y backend sin justificación
mezclar features no relacionadas
crear carpetas fuera de FSD sin explicar
```

---

# 4. BACKEND CLEAN ARCHITECTURE

El backend debe respetar el flujo:

```txt
Controller → DTO Validation → Service → TypeORM Repository → PostgreSQL
```

Reglas:

```txt
Controllers solo reciben request y devuelven response
Services contienen lógica de negocio
DTOs validan inputs
Entities representan tablas
Repositories/TypeORM gestionan persistencia
Guards protegen rutas
```

Prohibido:

```txt
consultar base de datos directamente desde controllers
validar permisos solo en frontend
meter lógica de pagos en controller
crear endpoints sin DTO
crear endpoints admin sin guard
```

---

# 5. ROLES Y PERMISOS

Roles mínimos:

```txt
admin
user
```

Permisos:

```txt
admin:
- crear productos
- editar productos
- cambiar estado de pedidos
- ver pedidos
- ver métricas básicas

user:
- ver productos disponibles
- crear pedido
- ver estado de su pedido
- cancelar pedido si aún no está en preparación
```

Regla dura:

```txt
El frontend puede ocultar botones, pero el backend SIEMPRE debe validar permisos.
```

Prohibido:

```txt
confiar solo en la UI
permitir que user acceda a rutas admin
cambiar estado de pedido sin validar rol
ver pedidos de otro usuario sin autorización
```

---

# 6. AUTH CON KEYCLOAK

Keycloak será la fuente principal de autenticación.

Configuración esperada:

```txt
Realm: utc-food
Roles: admin, user
MFA: solo para admin
JWT: validado por NestJS
```

Reglas:

```txt
El backend debe validar JWT.
El backend debe validar roles.
Los admins deben usar MFA.
Los usuarios normales no requieren MFA para demo escolar.
```

Prohibido:

```txt
guardar contraseñas manualmente en PostgreSQL
inventar usuarios fuera de Keycloak sin razón
aceptar tokens sin validar firma
aceptar rol enviado desde frontend
```

---

# 7. INPUT VALIDATION

Todo endpoint que reciba datos debe usar DTO.

Validaciones mínimas:

```txt
email válido
password con mínimo razonable
nombre obligatorio
precio mayor a 0
stock mayor o igual a 0
tiempo de preparación mayor a 0
cantidad mayor a 0
estado de pedido dentro de valores permitidos
```

Prohibido:

```txt
aceptar body libre
usar any sin necesidad
guardar strings sin limpiar
aceptar precio negativo
aceptar stock negativo
aceptar estados inventados
```

---

# 8. RATE LIMITING

Debe existir rate limiting básico.

Reglas sugeridas:

```txt
login: 5 intentos por minuto
crear pedido: 10 por minuto
consultar productos: 60 por minuto
rutas admin: 30 por minuto
```

Si se excede el límite:

```txt
Responder HTTP 429.
No procesar la acción.
No escribir en base de datos.
```

---

# 9. CIRCUIT BREAKER PARA PAGOS

Como es proyecto escolar, el pago puede ser simulado o preparado para PayPal/Mercado Pago.

Regla:

```txt
Si el servicio de pagos falla varias veces, activar circuit breaker temporal.
```

Respuesta esperada:

```txt
El servicio de pago no está disponible temporalmente. Intenta más tarde.
```

Prohibido:

```txt
reintentar infinitamente
crear pedido pagado si el pago falló
marcar como pagado sin evidencia
```

---

# 10. REGLAS DE NEGOCIO PICK UP

Estados del pedido:

```txt
pending
preparing
ready
picked_up
not_picked_up
cancelled
```

Reglas:

```txt
Un pedido inicia como pending.
El admin puede pasarlo a preparing.
El admin puede pasarlo a ready.
Cuando está ready, inicia ventana de recogida.
Si no se recoge en 20 minutos (ventana de recogida), puede pasar a not_picked_up.
Un pedido picked_up ya no puede modificarse.
Un pedido cancelled no puede pasar a preparing.
```

Prohibido:

```txt
saltar estados sin validación
permitir que usuario marque pedido como ready
permitir editar pedido ya recogido
permitir cancelar pedido ya preparado sin regla explícita
```

---

# 11. POSTGRESQL / TYPEORM

Reglas:

```txt
Usar entidades TypeORM.
Usar migraciones si el cambio modifica esquema.
No depender solo de synchronize:true para cambios importantes.
Validar conexión real a PostgreSQL.
```

Entidades mínimas:

```txt
UserProfile
Product
Order
OrderItem
Payment
PreparationMetric
```

Prohibido:

```txt
borrar tablas sin respaldo
hacer cambios destructivos sin avisar
meter datos sensibles innecesarios
guardar tokens completos si no hace falta
```

---

# 12. DOCKER LOCAL

Servicios esperados:

```txt
postgres
keycloak
backend
```

Comandos esperados:

```bash
docker compose up -d
docker compose ps
docker compose logs
docker compose down
```

Prohibido:

```txt
decir que Docker funciona sin docker compose ps
decir que PostgreSQL funciona sin conexión real
decir que Keycloak funciona sin probar login/token
```

---

# 13. FRONTEND / EXPO GO

Reglas:

```txt
La app debe poder correr con Expo Go.
La app debe usar TypeScript.
La UI debe usar NativeWind/Tailwind.
La navegación debe estar clara.
```

Pantallas mínimas:

```txt
Login
Home productos
Detalle producto
Carrito/Pedido
Estado del pedido
Admin productos
Admin pedidos
```

Prohibido:

```txt
crear pantallas sin conectarlas
crear estilos inline excesivos
duplicar componentes
mezclar lógica admin/user sin separación
```

---

# 14. DESIGN CON CLAUDE DESIGN

Claude Design se usará para:

```txt
prototipos
paleta de colores
componentes visuales
UX/UI
pantallas base
```

Regla:

```txt
El diseño no manda sobre seguridad ni reglas de negocio.
```

Prohibido:

```txt
priorizar estética sobre validaciones
ocultar errores críticos
crear flujos bonitos pero inseguros
```

---

# 15. NO FABRICATION POLICY

Claude Code tiene prohibido inventar:

```txt
outputs
logs
usuarios
tokens
endpoints
tablas
migraciones
tests pasados
build exitoso
capturas revisadas
```

Si no se ejecutó:

```txt
No ejecutado.
No verificado.
No confirmado.
```

---

# 16. GIT DISCIPLINE

Antes de cambiar:

```bash
git status
git branch --show-current
```

Después de cambiar:

```bash
git diff --stat
git diff
```

Prohibido:

```txt
commit -a
commitear archivos .env
commitear node_modules
commitear dist
commitear secretos
commitear cambios no relacionados
```

No commitear:

```txt
.env
.env.local
.env.production
node_modules/
dist/
coverage/
*.log
```

---

# 17. SECRETOS

Nunca guardar en git:

```txt
passwords
client secrets
JWT secrets
tokens
connection strings con credenciales
API keys
```

Permitido en documentación:

```txt
KEYCLOAK_REALM=utc-food
KEYCLOAK_CLIENT_ID=mobile-app
POSTGRES_HOST=localhost
```

Pero no valores sensibles reales.

---

# 18. TEST / BUILD MINIMUM

Antes de cerrar una tarea técnica, ejecutar según aplique:

Frontend:

```bash
npm run lint
npm run typecheck
npx expo start
```

Backend:

```bash
npm run lint
npm run build
npm test
```

Docker:

```bash
docker compose ps
docker compose logs
```

Base de datos:

```txt
probar conexión
verificar tabla o migración
```

---

# 19. DEFINITION OF DONE

Una tarea solo puede cerrarse con:

```txt
Archivos leídos
Cambios realizados
Diff revisado
Validaciones ejecutadas
Resultados reales
Riesgos detectados
Qué NO fue validado
Nivel de confianza
```

Formato obligatorio:

```txt
Observaciones:
- ...

Riesgos:
- ...

Validaciones realizadas:
- ...

Validaciones pendientes:
- ...

Supuestos explícitos:
- ...

Nivel de confianza:
- Alto / Medio / Bajo
- Justificación:
```

---

# 20. PRIORIDADES DEL PROYECTO

Orden de prioridad:

```txt
1. Que funcione
2. Seguridad básica
3. Claridad del código
4. Arquitectura limpia
5. Facilidad de explicar en clase
6. Diseño visual
7. Optimización
```

---

# 21. REGLA FINAL

Claude Code no puede cerrar con “listo” si no puede completar esta frase:

```txt
Está verificado porque ejecuté/leí/revisé ______ y el resultado fue ______.
```

Si no puede completarla:

```txt
No verificado.
```

---

# 22. CONFIANZA MÍNIMA PARA APLICAR CAMBIOS (95–100%)

Cada vez que exista un plan posterior a un cambio (plan post-cambio), el cambio
solo se aplica si el nivel de confianza —validado con workflows y un agente de
regresión— está entre 95% y 100%.

Procedimiento obligatorio antes de aplicar el cambio:

```txt
1. Ejecutar el plan en workflows (fan-out de verificación / pruebas).
2. Lanzar el agente de regresión sobre el área afectada.
3. Calcular el nivel de confianza con base en evidencia real (no estimada).
```

Regla dura:

```txt
Confianza 95–100%  → se aplica el cambio.
Confianza < 95%    → BLOQUEADO, no se aplica el cambio.
```

Si la confianza es menor a 95%, responder:

```txt
BLOQUEADO: confianza < 95%.
No aplico el cambio hasta cerrar la brecha con evidencia (workflows + agente de regresión).
```

Prohibido:

```txt
aplicar cambios con confianza solo estimada, sin evidencia
declarar 95%+ sin haber corrido workflows ni agente de regresión
omitir la regresión por prisa
cerrar la tarea sin reportar el nivel de confianza final
```

# 23. REGLA DE ORO — GIT LO EJECUTA EL USUARIO (commit y push manuales)

El historial de git es responsabilidad del **usuario** (aprendizaje de GitHub y control humano del repositorio). Claude Code prepara, propone y se detiene.

Claude Code **NO ejecuta**:

```txt
git commit
git push
git merge / git rebase sobre ramas publicadas
```

Claude Code **SÍ puede** (para dejar el terreno listo):

```txt
git status
git diff / git diff --cached
git add explícito
proponer el mensaje de commit completo (incluido el footer Co-Authored-By)
```

Flujo obligatorio:

```txt
1. Claude realiza los cambios y los deja staged.
2. Claude muestra git status/diff y PROPONE los comandos de commit + push.
3. Claude SE DETIENE.
4. El usuario ejecuta `git commit` y `git push` a mano (push a main).
```

Excepción única: el usuario pide explícitamente en ese momento "hazlo tú / haz el commit". Sin esa orden explícita, Claude no comitea ni pushea.

---

# 24. DOCUMENTOS VIVOS DEL CÍRCULO DE INNOVACIÓN

Conforme el proyecto avanza, **tres documentos** deben mantenerse **actualizados siempre** (en cuanto algo cambie) para que reflejen lo que la app realmente tiene (alcance, productos, pantallas, funcionalidades, decisiones y reglas de negocio):

```txt
docs/propuesta/algoritmo-circulo-innovacion.md  → la Propuesta (Ocurrencia → Idea → Propuesta → Implementación → Valor agregado → Adopción)
docs/propuesta/Algoritmo-ejecucion.md           → la Implementación (algoritmo de pasos para construir la Propuesta)
docs/arquitectura/decisiones.md                 → el registro de decisiones (ADR ligero: una entrada D-00X por decisión)
```

Cada cambio que altere el alcance, los productos, las pantallas, las decisiones o las reglas de negocio obliga a actualizar el documento correspondiente, en **su** tono, sin romperlo:

```txt
algoritmo-circulo-innovacion.md → tono juvenil / estudiantil (cercano, sin tecnicismos)
Algoritmo-ejecucion.md          → tono plano y directo (pasos numerados)
decisiones.md                   → estilo ADR: Contexto · Decisión · Verificación, conciso (sin explayar de más)
```

Prohibido:

```txt
dejar los documentos desactualizados frente al código real
meter tono técnico en algoritmo-circulo-innovacion.md
romper la numeración de las fases o de los pasos
agregar secciones sin su número (dejarlas "volando")
```

---

# 38. REGLA DE ORO — EXPLICACIONES EN DOBLE FRENTE (TECNICO + ALEGORIA)

> Decision 2026-06-25. Cuando el usuario pida una EXPLICACION (cualquier forma:
> "explicame", "mas explicacion", "que es", "como funciona", "no entiendo",
> "detalla", "profundiza"), Claude DEBE responder desde DOS frentes obligatorios.

```txt
1. FRENTE TECNICO
   - Preciso y anclado al codigo real (archivos, funciones, flujo, orden de
     pasos, edge cases, propiedades de seguridad). Respeta #0 EVIDENCE OR BLOCK:
     nada inventado; si no se verifico, marcarlo.

2. FRENTE ALEGORICO (analogia)
   - Una metafora concreta de la vida cotidiana que MAPEE FIELMENTE la realidad
     tecnica, pieza por pieza. La alegoria sirve para iluminar, no para adornar.
```

Reglas del doble frente:

```txt
- Los dos frentes son OBLIGATORIOS cuando se pide explicacion (no uno u otro).
- La alegoria NO puede contradecir ni distorsionar el frente tecnico (#7 No
  Fabrication sigue vigente). Si una pieza tecnica no tiene buen mapeo, decirlo
  ("aqui la analogia se rompe porque...") en vez de forzarla.
- Cada elemento clave del frente tecnico deberia tener su contraparte en la
  alegoria (keyId -> X, dominio -> Y, cache -> Z), idealmente explicitado.
- Escala la longitud a la complejidad: explicaciones simples = alegoria breve.
- No aplica a respuestas que NO son explicacion (un status, un diff, un comando
  listo para pegar). Aplica cuando el objetivo es que el usuario ENTIENDA algo.
```

Cierre: una explicacion no esta completa si falta cualquiera de los dos frentes.

---

# 39. DOCUMENTACIÓN OBLIGATORIA DE CAMBIOS — CON HORA Y EXPLICACIÓN

> Decision 2026-07-06. Todo cambio técnico significativo del proyecto debe
> quedar documentado en el CHANGELOG con fecha, hora estimada, descripción y
> decisión relacionada. La documentación es parte de la entrega, no opcional.

```txt
OBLIGATORIO en docs/superpowers/priority/CHANGELOG.md:
- Commit hash (git show <hash> --stat)
- Fecha ISO 8601 + hora estimada (ej. 2026-07-03 14:00)
- Descripción breve (qué cambió en 1-2 líneas)
- Explicación técnica (por qué, qué implicaciones, decisión)
- Decisión relacionada (D-00X en docs/arquitectura/decisiones.md, si aplica)
- Evidencia verificable (git show, archivo leído, prueba ejecutada)
```

Cambios que REQUIEREN CHANGELOG:

```txt
- Feature nueva (desde 100 líneas)
- Fix crítico (auth, pagos, estado)
- Refactor de arquitectura
- Migración de tecnología
- Cambio de puerto/host/config
- Decision que afecta scope o reglas de negocio
```

Cambios que NO requieren CHANGELOG:

```txt
- Typo en documentación
- Indentación
- Cambio de variable local sin impacto
- Bump de version minor (npm update)
```

Regla dura:

```txt
El CHANGELOG es la fuente de verdad del progreso. Si no está, el cambio no cuenta
como validado. Mínimo semanal: revisar git log y actualizar CHANGELOG.
```

Cierre: documentar ES TRABAJAR. La historia del proyecto vive en CHANGELOG,
junto a git log; ambos deben estar sincronizados.

---

# 40. AUTOCRÍTICA OBLIGATORIA — NO DAR LA RAZÓN POR DEFECTO

> Decision 2026-07-01. Claude NO es un complaciente. Debe evaluar críticamente
> TANTO lo que el usuario afirma COMO lo que el propio Claude propone/hizo.

```txt
- NO asumir que el usuario tiene razon solo porque lo dice. Evaluar con lógica +
  evidencia (regla #0). Si el usuario acierta: decirlo CON el razonamiento y, si
  aplica, la autocritica del propio error. Si NO: argumentar en contra con
  evidencia, respetuosamente, en vez de ceder.
- NO asumir que lo que Claude propuso/implementó está bien: buscar activamente el
  contra-argumento, el caso que lo rompe, el supuesto no validado. Preferir
  "esto puede fallar si X" antes que "esto queda perfecto".
- Prohibido el patron yes-man: "tienes toda la razon" sin verificar; aceptar un
  requisito sin señalar su riesgo/costo; confirmar que algo funciona sin evidencia.
- Al recibir feedback/correccion: primero verificar si es correcto (a veces el
  usuario tambien se equivoca); luego reconocer el propio error explicitamente si
  lo hubo, sin adornarlo.
- Aplica SIEMPRE, especialmente bajo presion de tiempo o cuando "parece obvio".
```

Cierre: dar la razon por inercia es una falla; la lealtad es a la VERDAD verificable
y al mejor resultado del usuario, no a complacerlo en el momento.

---

# 41. CÓDIGO MODULAR OBLIGATORIO — SUBRUTINAS + COMENTARIOS ESPECÍFICOS

> Decision 2026-07-06. Todo código NUEVO que se escriba se descompone en
> subrutinas/funciones con una sola responsabilidad y lleva comentarios
> específicos. Aplica al código nuevo — NO obliga a re-modularizar código
> existente (respeta la regla #28 MINIMUM SAFE CHANGE).

```txt
- MODULAR: extraer la lógica en funciones/subrutinas de una sola responsabilidad,
  preferentemente puras y testeables sin DI (patron vigencias-dates.ts /
  carga-nueva.ts / extracted-fecha.ts). NADA de bloques monolíticos inline cuando
  la lógica tiene nombre propio y es reutilizable.
- REUSO PRIMERO (ponytail): antes de escribir, buscar si ya existe la función/helper
  y reusarlo; solo escribir código nuevo si no hay algo que reusar. Menos código = menos bugs.
- COMENTARIOS ESPECÍFICOS: cada subrutina explica QUÉ hace, sus entradas/salidas y
  el PORQUÉ / invariante no obvio (ej. "ancla mediodia UTC para no retroceder 1 dia
  en MX"). Prohibidos los comentarios genéricos que solo repiten el nombre.
- ALCANCE: aplica al código nuevo del cambio en curso. NO gatilla refactors del
  código viejo circundante (regla #28); si el código existente ya es monolítico,
  se deja salvo que el cambio lo toque directamente.
```

Cierre: código modular con comentarios específicos = revisable, testeable y con
menos superficie de bug; el reuso (ponytail) evita el código basura antes de escribirlo.

---

# 42. UBICACIÓN DEL CÓDIGO — YAGNI + REUTILIZACIÓN

> Decision 2026-07-06. Antes de escribir código, Claude debe preguntarse dónde 
> debe vivir. Esta regla previene código duplicado y decisiones de ubicación 
> por conveniencia.

```txt
Antes de escribir código, responder OBLIGATORIAMENTE:

¿Existe ya un lugar
donde este código debería vivir?

SI ↓
   Moverlo ahí.
   (Reutilizar: buscar en domain/, application/, 
    infrastructure/, shared/ — en ese orden)

NO ↓
   Crear el lugar adecuado.
   (Aplicar arquitectura limpia: en qué capa vive)

Nunca crear código por conveniencia.
```

Aplicar **siempre**, especialmente bajo presión de tiempo:

```txt
- NO copiar una función si ya existe en shared/
- NO duplicar un servicio si está en application/
- NO crear un helper si TypeORM ya lo provee
- NO escribir validación si class-validator ya la cubre
```

Regla dura:

```txt
Código duplicado = BLOQUEADO hasta encontrar la ubicación real.
```

Cierre: la ubicación correcta es parte de la calidad del código, no un lujo.

---

# 43. DECISIONES ARQUITECTÓNICAS — ANÁLISIS OBLIGATORIO

> Decision 2026-07-06. Toda decisión arquitectónica debe responder 6 preguntas 
> explícitamente. Aplica a cambios que tocan > 1 módulo o introducen nuevas 
> dependencias.

```txt
Antes de implementar un cambio arquitectónico, responder:

1. ¿Por qué aquí?
   (Justificar ubicación específica: por qué en este módulo/capa)

2. ¿Por qué no en otro módulo?
   (Considerar alternativas: por qué no en X, Y, Z)

3. ¿Qué dependencia nueva introduce?
   (Listar deps: npm packages, módulos internos, externos)

4. ¿Rompe encapsulamiento?
   (¿Viola límites de módulo? ¿Expone internals?)

5. ¿Aumenta el acoplamiento?
   (¿Más módulos dependiendo de uno? ¿Circular?)

6. ¿Disminuye la cohesión?
   (¿La función del módulo sigue clara? ¿Sigue teniendo UNA responsabilidad?)

---

Preguntas de futuro (si aplica):

7. ¿Este cambio hace más fácil o más difícil
   mantener DOXIA en dos años?
   (D = Durabilidad, O = Observabilidad, X = eXtensibilidad, 
    I = Independencia, A = Autotestabilidad)

```

Prohibido:

```txt
implementar cambio arquitectónico sin responder las 6 preguntas
responder "probablemente sí" en lugar de analizar
ignorar impacto en acoplamiento/cohesión por prisa
decidir arquitectura basado en "parece limpio"
```

Regla dura:

```txt
Si no puedes responder las 6 preguntas, BLOQUEADO.
El cambio se vuelve un riesgo técnico no documentado.
```

Cierre: buena arquitectura = decisiones **conscientes y documentadas**, no intuiciones.

---

# 44. NO CREAR CARPETAS SIN JUSTIFICACIÓN

> Decision 2026-07-07. Claude tiende a crear carpetas demasiado rápido. Antes de
> proponer una carpeta nueva, debe existir una razón arquitectónica clara.

Antes de crear una carpeta nueva, responder las 4 preguntas:

```txt
1. ¿Qué responsabilidad encapsula?
2. ¿Qué problema evita?
3. ¿Qué principio SOLID mejora?
4. ¿Qué ocurrirá dentro de un año si NO existe?
```

Regla dura:

```txt
Si no puedes responder las 4 preguntas, NO crees la carpeta.
```

Cierre: una carpeta sin responsabilidad clara es deuda estructural desde el día 1.

---

# 45. NO ACEPTAR PATRONES POR AUTORIDAD

> Decision 2026-07-07. Ningún patrón se adopta solo porque venga de una fuente
> prestigiosa. Se adopta si aporta valor al proyecto **actual**.

```txt
Aunque el patrón provenga de Microsoft, AWS, Google, ThoughtWorks o Martin
Fowler, verifica primero si aporta valor a UTC Pick Sazón en su contexto real
(1 dev, 160h, tesis, futuro AZURE).

Critica TODAS las decisiones antes de aceptarlas. Analiza críticamente cada
propuesta — la mía, la de ChatGPT, la de cualquier libro.
```

Cierre: la autoridad de la fuente no reemplaza el análisis. El contexto manda.

---

# 46. UMBRALES YAGNI DE ESTRUCTURA (cuándo subdividir)

> Decision 2026-07-07. Complemento de la regla 44. No se crean sub-carpetas
> "para después": se crean cuando el volumen real las pide. Umbrales concretos:

```txt
application/         → archivos planos (CreateOrder.ts, GetOrder.ts) hasta 5 casos
                       de uso. A partir de ~20 casos → separar commands/ y queries/.

infrastructure/      → arrancar solo con persistence/ y external/.
                       messaging/, cache/, queue/ se agregan cuando aparezca el
                       primer RabbitMQ / Redis / Azure Queue real. No antes.

presentation/        → archivos planos (OrdersController.ts, OrderGuard.ts) mientras
                       haya UNO de cada tipo. Carpetas controllers/ guards/ pipes/
                       filters/ solo cuando existan VARIOS.

tests/               → solo unit/ e integration/ al inicio.
                       contract/, builders/, fixtures/ cuando realmente aparezcan.

contracts/           → dentro del módulo (modules/orders/contracts/) por defecto.
                       Solo se promueve a backend/contracts/ (API pública) si se
                       genera SDK / OpenAPI client / frontend automático. Eso es
                       una decisión arquitectónica (regla 43), no un default.

frontend (FSD v2)    → app, pages, widgets, features, entities, shared.
                       processes/ SOLO para flujos largos reales (Checkout,
                       Onboarding, Order Tracking). NO usar flows/ además de
                       processes/: duplica responsabilidades.
```

Regla dura:

```txt
Carpeta con un solo archivo dentro = huele a prematura. Colapsar a archivo plano.
```

Cierre: la estructura sigue al código, no lo precede. Ver [[bounded-contexts]] para
qué módulo puede hablar con cuál.

---
---

# BUSINESS RULES — UTC PICK SAZÓN (BR)

Reglas de negocio obligatorias del dominio. Complementan las reglas 0–22.
Ante conflicto entre una BR y una regla operativa, prevalece la BR para temas de negocio.

## BR-001 — NO DELIVERY

UTC Pick Sazón es exclusivamente Pick Up.

Prohibido implementar:

```txt
Repartidores
Geolocalización de entrega
Cálculo de rutas
Costos de envío
Tracking de repartidor
```

Si un cambio introduce conceptos de delivery:

```txt
BLOQUEADO.
```

---

## BR-002 — IDENTIDAD UTC

Los usuarios deben autenticarse mediante correo institucional UTC.

Formato esperado:

```txt
@edu.utc.mx
```

Dominio institucional UTC (México), **confirmado el 2026-06-24: `@edu.utc.mx`** (orden invertido respecto al supuesto inicial `utc.edu.mx`). Ver `docs/arquitectura/decisiones.md` (D-011).

Reglas:

```txt
No permitir correos personales.
No permitir usuarios anónimos.
El backend valida identidad mediante Keycloak.
```

---

## BR-003 — ROLES

> **MODIFICADA el 2026-07-14** por autorización explícita del usuario (ADR **D-047**).
> La versión anterior solo permitía `admin` y `user`, y prohibía `staff`/`cashier` — que es,
> literalmente, lo que `mostrador` es. **La autorización, textual:**
>
> *"Por cooperativa suelen ser 3 personas. Quiero que una persona se dedique a cocinar; que otra haga el
> inventario y lo registre junto con costos y ganancias; que otra reciba las órdenes, cambie estatus por
> orden de cocina, cobre y dé cambio cuando es en efectivo, y facture. Más el admin que ya tenemos."*

Roles permitidos:

```txt
user          cliente de la PLATAFORMA (@edu.utc.mx). Sin cooperativa fija.
cocina        ACEPTA y TERMINA los pedidos. Ve qué preparar.
inventario    materia prima, costos, recetas, mermas, ganancia.
mostrador     cobra, da cambio, CAJA, entrega, reoferta, layout CFDI.
admin         administrador de UNA cooperativa. Superconjunto de los tres.
```

**Regla dura — los DOS ejes del permiso:**

```txt
1. ¿QUÉ PUEDES HACER?   → el ROL
2. ¿SOBRE QUÉ?          → la COOPERATIVA (branch_id)
```

**Todo rol distinto de `user` está anclado a EXACTAMENTE UNA cooperativa.**
**El `branch_id` de autorización sale del JWT — JAMÁS del request.**
El query string solo puede *filtrar dentro* de lo que el token ya permite. *(Ver BR-016.)*

**Una persona = un rol.** Keycloak permite arreglos, pero no se usan: le da **dueño inequívoco** al
faltante de caja.

No crear:

```txt
manager
super-admin      ← EXPRESAMENTE rechazado: un rol que vea TODAS las cooperativas es
owner              superficie de ataque que el proyecto no necesita. Dar de alta
                   cooperativas y administradores se hace en la consola de Keycloak,
                   FUERA de la aplicación.
```

sin autorización explícita.

---

## BR-016 — EL ALCANCE SALE DEL TOKEN, NO DEL REQUEST

> **Nueva el 2026-07-14** (ADR D-047). Nace de un defecto real encontrado en auditoría.

**Prohibido autorizar con un dato que manda el cliente.**

```txt
❌ @Get('all') findAll(@Query('branchId') branchId?: string)   ← el CLIENTE decide qué ve
✅ @Get('all') findAll(@Req() { user })  → user.branchId       ← el TOKEN decide
```

**Y el filtro debe ser IMPOSIBLE de olvidar:** la firma del puerto exige `branchId: string`
(**no** `string | undefined`), para que **el compilador** sea el guardia.

Prohibido:

```txt
aceptar branch_id / branchName como texto libre en un DTO (debe validarse contra el catálogo)
devolver TODAS las cooperativas cuando falta el filtro (fail-open)
confiar en que el frontend mande el alcance correcto
```

Si alguien manda un `branchId` que no es el suyo → **403**, no un 200 filtrado en silencio.
**Queremos que truene, para que el intento se note.**

---

## BR-004 — FLUJO DEL PEDIDO

Estados válidos:

```txt
pending
preparing
ready
picked_up
not_picked_up
cancelled
```

Transiciones válidas:

```txt
pending -> preparing
preparing -> ready
ready -> picked_up
ready -> not_picked_up
pending -> cancelled
```

Prohibido:

```txt
picked_up -> cualquier otro estado
cancelled -> preparing
cancelled -> ready
```

---

## BR-005 — READY_AT ES FUENTE DE VERDAD

`ready_at` es el timestamp oficial para:

```txt
tiempo listo
ventana de recogida
cálculo de no recogido
```

Nunca usar timestamps del frontend. Siempre usar hora del servidor.

---

## BR-006 — REOFERTA DE PREPARADOS

Cuando un pedido entra a `not_picked_up`, sus productos pueden ser re-ofertados.

Reglas:

```txt
tag = "Preparados"
```

La UI debe mostrar "Listo hace X minutos" calculado desde `ready_at`.

---

## BR-007 — HISTÓRICO DE PREPARACIÓN

El histórico de preparación es la única fuente para calcular promedios.

Tabla:

```txt
preparation_times
```

Reglas:

```txt
mínimo 3 registros para confiar en promedio
menos de 3 → usar tiempo_base
promedio basado en últimas 20 muestras
```

Prohibido:

```txt
inventar tiempos
usar tiempos enviados por frontend
```

---

## BR-008 — ADMIN COMO AUTORIDAD

Solo admin puede:

```txt
cambiar estados
marcar pedido listo
registrar tiempos reales
```

User nunca puede modificar:

```txt
ready_at
accepted_at
estado interno
```

---

## BR-009 — PAGOS

Métodos válidos:

```txt
mercado_pago
paypal
tdc
tdd
efectivo
```

No agregar métodos sin autorización.

Regla:

```txt
efectivo = no requiere pasarela.
```

---

## BR-010 — CIRCUIT BREAKER

Si la pasarela falla repetidamente:

```txt
estado = OPEN
```

Mientras OPEN:

```txt
no intentar cobrar
devolver error controlado
sugerir método alternativo
```

---

## BR-011 — STOCK PREPARADOS

La categoría `Preparados` debe respetar:

```txt
stock mínimo
stock máximo
```

definidos por administración. Nunca permitir stock negativo.

---

## BR-012 — NOTIFICACIONES

Eventos que generan push:

```txt
Pedido aceptado
Pedido listo
Pedido cancelado
Pedido marcado como no recogido
```

No enviar notificaciones duplicadas.

---

## BR-013 — MÉTRICAS

Métricas permitidas:

```txt
tiempo promedio por producto
productos más vendidos
pedidos diarios
pedidos no recogidos
```

No almacenar información académica.

---

## BR-014 — PRIVACIDAD

Un usuario solo puede consultar sus propios pedidos.

Prohibido:

```txt
consultar pedidos de otros estudiantes.
```

---

## BR-015 — FUENTE DE VERDAD

Backend es la única fuente de verdad.

Frontend:

```txt
muestra datos
solicita acciones
```

Backend:

```txt
valida
autoriza
calcula
persiste
decide estados
```
