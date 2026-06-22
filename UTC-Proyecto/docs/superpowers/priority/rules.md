# UTC FOOD / COOPERATIVA — Reglas obligatorias para Claude Code

> Registro canónico de decisiones del proyecto: `docs/decisiones.md`.

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
@utc.edu.mx
```

Dominio institucional UTC (México). El **formato exacto del correo está por confirmar** (NO VERIFICADO); ver `docs/decisiones.md` (D-011). Vale cualquier subdominio institucional oficial que defina la universidad.

Reglas:

```txt
No permitir correos personales.
No permitir usuarios anónimos.
El backend valida identidad mediante Keycloak.
```

---

## BR-003 — ROLES

Roles permitidos:

```txt
admin
user
```

No crear:

```txt
manager
super-admin
owner
staff
cashier
```

sin autorización explícita.

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
