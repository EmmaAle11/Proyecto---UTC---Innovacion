# Changelog — UTC Pick Sazón

Registro canónico de cambios significativos del proyecto, documentados con fecha, hora (estimada), descripción y decisión relacionada.

---

## 2026-07-15

### `(pendiente de commit)` — Plan 08 F1-F3: bug 1 (bucle infinito de reoferta) CERRADO (loop-break)

**Cambio:** se cierra el **bug 1** del ADR D-052 (*la reoferta es un bucle infinito: la comida de ayer se revende para siempre*). Modelo nuevo **`finished_goods`** (lo ya hecho, con caducidad) + **`stock_movements`** (merma). **Con migración** (`1782941000000-AddFinishedGoods`). **127 tests verdes**, tsc 0. Endurecido por **3 rondas de caza adversaria** (convergió: 0 defectos de producto).

- **Esquema (F1):** tablas `finished_goods` (`qty`, `produced_at`, **`expires_at`**, `is_reoffer`, `reoffer_price` DE LA UNIDAD, `source`, `branch_id`) y `stock_movements` (`type`, `reason`, `finished_good_id` suelto); `text`+CHECK (no enum pg) para que Plan 04 crezca sin ALTER.
- **Dominio (F2a):** nuevo `StockEffect 'to_reoffer'` (comida hecha no entregada) distinto de `'release'` (reserva no hecha). `not_picked_up` y cancelar-desde-`ready/ready_later` → `'to_reoffer'`; cancelar-desde-`pending` y admin-cancel → `'release'`.
- **Adapter (F2a+F3):** `produceFinishedGoods` (una unidad por línea, `expires_at=now+4h`, **provenance** `cancelado`/`no_recogido` según el estado, hereda `branch_id`), NO toca `products.stock` → rompe el bucle; `expireOverdue` produce finished_goods en vez de sumar a stock; **`expireFinishedGoods`** barre las caducadas con **claim atómico `DELETE...RETURNING`** (anti doble-merma) → `stock_movements(merma, caducado)`, devuelve unidades. Cableado en el scheduler (3er barrido).

**Decisión:** **D-052** — bug 1 **CERRADO** (loop-break). **Falta bug 2** (Plan 08 F2b: compra de rescate de la unidad + quitar `product.reofferPrice`) + F4/F5 (disponibilidad + frontend). **Alcance elegido: completo en un Plan 08**, ejecutado por fases verdes.
**Evidencia:** `cd backend && npx tsc --noEmit && npx jest` → **127 passed**. Caza: `wf_002c2657` / `wf_5091d9a4` / `wf_4897435b` (R3: 0 defectos de producto).

### `(pendiente de commit)` — Plan 07 CERRADO: bug 3 (reservar en `place()`) a gate §22 = 0 P0-P5

**Cambio:** se **cierra** el **bug 3** del ADR D-052 (*se acepta/paga el pedido antes de reservar*), endurecido por **4 rondas de caza adversaria multi-agente** (§22/§40) que hallaron y cerraron defectos que las propias correcciones introducían. **Sin migración de esquema.** Backend **125 tests verdes**, `tsc` 0 back y front.

- **Dominio (`Order.ts`):** **eliminado el pre-check de stock** (leía un snapshot rancio y daba 400 vs 409 para el mismo "agotado", bug de contrato); `PREPARING → 'none'` (evita **doble reserva**); `cancelByOwner` siempre `'release'` y admin-`CANCELLED → 'release'` (evitan **fuga**).
- **Adapter (`order.repository.ts`):** **`reserveStockOrThrow`** = **único gate de agotado** (UPDATE condicional `WHERE stock >= qty`, `affected` → **409 nombrando el producto**); **saga simétrica bajo `pessimistic_write`** sobre `{PENDING, PREPARING}` = *"vivo por cobrar"*: la **captura (Tx2)** marca `PAID` solo si el pedido sigue vivo (no captura sobre un cancelado en la ventana; sí captura si el admin aceptó, o quedaría "cocinado sin pagar"); la **compensación** cancela+libera solo si sigue vivo (sin **doble release**), **audita siempre** y **notifica solo si venía de PREPARING** (en PENDING el cliente ya vio el 400); **`expireStalePending`** filtra por **estado del pago** (`NOT EXISTS status='paid'`) → barre efectivo abandonado **y** tarjeta PENDING no cobrada, nunca una tarjeta PAID; `applyStockDelta` release-only (borrado el `GREATEST` muerto).
- **Frontend:** el 409 "se agotó" **deja de enmascararse** por el fallback demo (solo status 0) y el carrito lo muestra con título accionable — ahora **todo** agotado es 409 (consistente).
- **Decisiones del usuario:** programados reservan al pedir · reservar **antes** de cobrar (saga lista para pasarela real).

**Decisión:** **D-052** actualizada — bug 3 **IMPLEMENTADO Y CERRADO (0 P0-P5)**; bugs 1-2 (`finished_goods`) → **Plan 08 pendiente**. Revierte **D-037**.
**Evidencia:** `cd backend && npx tsc --noEmit && npx jest` → **125 passed**; `cd frontend && npx tsc --noEmit` → 0. Caza: rondas 1-4 (`wf_adc03e96` … `wf_b4d0d2a3`) → **ronda 4: 0 CONFIRMED, 0 PLAUSIBLE**.

## 2026-07-14

### `a12c44f` + `767e226` — Alcance ampliado: roles de cooperativa, motor de costeo, caja y CFDI (13:40)

**Cambio:** expansión de alcance (**3 614 líneas** de specs y planes). **Solo diseño: cero código.**

- **2 specs + 6 planes** (uno por sección): cimientos/roles · SSOT · RLS · inventario y costeo · efectivo, caja y CFDI · panel de receta.
- **Documentos vivos** (§24): `algoritmo-circulo-innovacion.md` (§1.2 Ocurrencia, §2.2 Idea, §3.17-bis, §3.18–§3.23) y `Algoritmo-ejecucion.md` (§20).
- **Nuevo:** `docs/propuesta/uso-de-ia-y-prompts.md` (registro del uso de IA para la defensa) y `docs/datos/recetas-e-insumos.md` (10 recetas, 68 insumos, costos con citas APA).
- **PDF:** retirada la hoja de derechos (pág. 25) → 24 páginas.

**Decisiones:** **D-047** (roles + alcance por cooperativa; **modifica BR-003**, crea **BR-016**) · **D-048** (SSOT) · **D-049** (RLS) · **D-050** (motor de costeo) · **D-051** (efectivo/caja/CFDI) · **D-052** (producto terminado).

### `(pendiente de commit)` — Auditoría multi-agente y corrección de la propia deuda (16:30)

**Cambio:** auditoría de 4 lentes + workflow de caza P0-P5 (60 hallazgos, 46 confirmados) **sobre lo escrito ese mismo día**. Se corrigió lo encontrado, **dejando el rastro escrito en vez de borrarlo** (§40).

**🔴 Fabricaciones detectadas y corregidas (§15):**
- **Cifra del INPC inventada** *(papa +21 %, limón +26 %)* — la auditoría **descargó el boletín citado**: dice **5.76 %** y **"limón" no aparece**. **Cita real, dato falso** — la peor variante.
- **"Hallazgo" de Sam's** con 6 decimales, mientras el §0 del **mismo documento** decía que Sam's **bloqueó la lectura**.
- **Afirmación de autoría refutable:** *"el 66 % de los commits no tiene IA"* — **7 de los 13 commits que el propio documento presenta como fruto de un prompt no llevan el trailer**. *El trailer mide si alguien pegó el footer, no si hubo IA.*
- **"46 reglas" → son 34** (`rules.md` salta de la 24 a la 38).
- **Número de líneas de Markdown no reproducible** — **dos veces**. Ahora se publica **el comando**, no la cifra.

**🔴 Contradicciones que habrían llegado al código:**
- El **Plan 04 ordenaba un test que consagraba un error** ($31.25 con yield 80 % sobre carne **molida**, que **no tiene hueso**). *La aritmética del usuario era correcta — estaba **mal etiquetada**.*
- El **Plan 06 se contradecía consigo mismo** sobre el agua **dentro del mismo archivo**.
- El **motor de costeo calculaba con precios inexistentes** ($0.05/g vs. $0.130/g reales) → **todas sus conclusiones eran falsas**, incluido un *"✅ negocio sano"* para un producto al **55 %**.
- La **propuesta declaraba el bug de seguridad como "ya no pasa"**… **citando como prueba el parámetro que ES la vulnerabilidad**.
- El **spec de roles decía "APROBADO"** con el modelo que el Plan 04 ya había declarado roto.

**🔴 Bugs de producción destapados (D-052):** la **reoferta es un bucle infinito** (`release → reoferta → not_picked_up → release`, sin merma) y **se cobra antes de reservar** (`pending nunca reservó`).

**Reglas:** **BR-003 modificada** (autoriza `cocina`/`inventario`/`mostrador`) · **BR-016 nueva** (*el alcance sale del token, no del request*).

**Decisiones:** D-047 … D-052.

---

## 2026-07-10

### `(pendiente de commit)` — `products` consolidado a slice + limpieza de mocks basura (13:40)

**Cambio:** Cerrar el split-brain de `products` (backend) y eliminar datos mock que sobraban (frontend).

**Descripción:**
- **Backend (D-046):** `application/products/` + `presentation/products/` + `typeorm-product.repository` → movidos a `modules/products/{application,contracts,infrastructure,presentation,tests}`. Products queda como slice vertical, estilo **pragmático** (entity-as-model, sin aggregate/VOs — regla 46). Una ubicación por contexto.
- **Frontend:** tipos+constantes de display → `entities/{product,order}/admin-types.ts`; **ELIMINADOS** los datos falsos que eran muleta del túnel: `PRODUCTS`+`CATEGORIES`, `ADMIN_PRODUCTS` (fallback __DEV__), `ADMIN_ORDERS` (seed → `[]`). `createCatalogLoader` sin fallback mock (backend = única fuente). `branch/mock.ts` → `branch/branches.ts` (config canónica, no mock).

**Explicación técnica:** el split-brain era deuda de la migración incremental (D-040); consolidarlo da consistencia estructural sin forzar DDD táctico donde no paga. Los mocks se crearon como red de seguridad cuando el túnel de Cloudflare fallaba; con el backend accesible son basura → se borran (el usuario: "no conservamos mock basura").

**Decisión:** D-046.

**Evidencia:** backend `tsc` 0 + 117 tests + build 0 + app arranca (`ProductsController {/products}`, 0 errores DI); frontend `tsc` 0; 0 referencias muertas. Hash pendiente (§23).

---

### `(pendiente de commit)` — Value Objects + bounded context notifications (Domain Events + Outbox) (12:30)

**Cambio:** Última iteración de profundidad DDD sobre `orders` + nuevo slice `notifications`.

**Descripción:**
- **#2 Value Objects (D-044):** kernel gana `ValueObject<T>`; `orders/domain/value-objects/` con `Money` (centavos enteros, sin float drift), `Quantity` (entero ≥1), `OrderId`/`ProductId` (branded). `Order.place()` calcula con VOs; el mapper convierte en el borde. Contracts (DTO) siguen en primitivos.
- **#1 notifications (D-045):** vuelven los Domain Events al kernel (`AggregateRoot.record/pullEvents` + `DomainEvent`); `Order` emite `OrderAccepted/Readied/Cancelled/NotPickedUp` (BR-012). `DomainEventDispatcher` global (`shared/events`, handlers auto-registrados, despacho en la tx). Slice `notifications`: tabla **outbox** (migración `1782940000000`, UNIQUE de-dup + FK CASCADE), handler que materializa el evento en la tx del pedido, `GET /notifications/mine` (JWT, scoped por sub). `expireOverdue` también emite.
- **Fix P0 preexistente:** `AuthService` inyectaba `AuditLogService` (desde `3a14e14`) sin proveerlo en `AuthModule` → la app no arrancaba. Se creó `LoggingModule` @Global; se quitaron providers duplicados.

**Explicación técnica:** cierra la primitive obsession del agregado y elimina la duplicación de BR-012 (antes re-derivada en el cliente por polling+diff): el agregado es ahora la fuente única del evento y el outbox la verdad del servidor. Outbox transaccional = atomicidad (no hay aviso sin cambio ni cambio sin aviso) + de-dup por UNIQUE.

**Decisión:** D-044 (Value Objects), D-045 (notifications + Domain Events + Outbox + LoggingModule).

**Evidencia:** `tsc` 0 + build 0 + **app arranca** (`Nest application successfully started`, ruta `GET /notifications/mine` mapeada, 0 errores DI) + migración aplicada en Postgres real + smoke test outbox (de-dup `INSERT 0 1`→`INSERT 0 0`; FK rechaza pedido inexistente) + 115 tests verdes. Hash pendiente (commit manual del usuario, §23).

---

## 2026-07-03

### `fa25e3f` — Algoritmo de ejecución (14:00)

**Cambio:** Reescritura formal de sección 19 en `Algoritmo-ejecucion.md`.

**Descripción:**
- Tono profesional y formal (sin detalles confesionales).
- Corrección: puerto backend = **3002** (antes 3001).
- Estructura completa: infraestructura, frontend, backend, orchestración local, estructura repo, distribución (APK), verificación pre-commit.
- Apto para presentación al profesor; cubre "todo lo que hicimos para que la app funcionara incluyendo lo del APK de Expo".

**Decisión:** D-038 (Algoritmo-ejecucion formal).

**Evidencia:** `git show fa25e3f --stat` → 141 líneas en Algoritmo-ejecucion.md.

---

### `dc48c21` — Sección 19: stack real y ejecución (13:30)

**Cambio:** Primera versión formal de la sección técnica.

**Descripción:**
- Stack completo: Expo SDK 56, React Native 0.85.3, React 19.2.3, TypeScript, FSD.
- Backend: NestJS 11, TypeORM, PostgreSQL 16, Keycloak 26.
- Docker Compose orchestración local con 3 fases.
- Distribución: APK via Expo/EAS.

**Decisión:** D-038.

**Nota:** Primera versión incluía puerto 3001; corregido a 3002 en `fa25e3f`.

---

## 2026-07-02

### `a4307ef` — Backend a puerto :3002 (16:00)

**Cambio:** Remapeo de puerto backend en infra y configuración.

**Descripción:**
- Backend NestJS migrado de :3000 → :3002.
- Razón: :3000 y :3001 ocupados en la máquina local.
- Actualizado `.env.example`, `docker-compose.yml`, documentación.

**Decisión:** D-034 (puertos locales UTC remapeados); ver `memory/puertos-locales-utc-remapeados.md`.

**Evidencia:** `git show a4307ef --stat` muestra cambios en infra/ y docs/.

---

### `262d4c6` — Cooperativa por geolocalización (15:00)

**Cambio:** Feature §3.12 en ciclo innovación.

**Descripción:**
- Cliente y pedidos scopeados por **sucursal (branch)** mediante geolocalización.
- Admin ve cola por sucursal.
- Timezone CDMX (hora pico) corregida.
- Backend: endpoints `/branches`, `/orders?branchId=`.

**Decisión:** D-028 (geolocalización de ambos — cliente y admin).

**Evidencia:** D-027..D-034 en `docs/arquitectura/decisiones.md`.

---

### `cd40a4f` — CardForm único (checkout + cartera) (14:30)

**Cambio:** Refactor de componente de tarjeta.

**Descripción:**
- Un formulario único `CardForm` para ambos flujos: checkout (crear pedido) y cartera (guardar método).
- Selector de tipo de pago (crédito/débito/Mercado Pago/PayPal/efectivo).
- Validación relajada (formato, no Luhn) para demo.

**Decisión:** D-033 (pagos — métodos y flujos).

**Relacionado:** `fff1145` (validación de tarjeta).

---

### `ea0b1a1` — Refresco de sesión (401 Unauthorized) (14:00)

**Cambio:** Fix auth backend + frontend retry.

**Descripción:**
- Backend: `POST /auth/refresh` renueva token JWT expirado.
- Frontend: interceptor en API client reintenta con nuevo token si recibe 401.
- Token TTL: 30 minutos (rotación cada 5 min en backend).
- Resuelve "sesión perdida tras 5 minutos".

**Decisión:** D-036 (sesión con refresco automático).

**Evidencia:** Backend `auth.service.ts` (refresh), frontend `api-client.ts` (interceptor).

---

### `045e6ac` — Versión de prueba solo Android (APK) (13:30)

**Cambio:** Documentación de distribución.

**Descripción:**
- Dev build APK (Expo prebuild + local SDK o EAS) es la versión instalable.
- Expo Go: SDK 53+ removió notificaciones; iOS sin notificaciones vía Expo Go.
- TestFlight para iOS si es necesario.
- Anotado en: propuesta, arquitectura, runbook.

**Decisión:** Parte de D-038 (distribución).

**Nota:** Honesto: Expo Go limitado; APK es la solución real.

---

### `fff1145` — Validación de tarjeta relajada (13:00)

**Cambio:** DTO + validación CardForm.

**Descripción:**
- Validación de formato (16 dígitos, fecha válida, CVV 3-4 dígitos).
- **NO validación Luhn** (es solo demo, no es transacción real).
- Métodos de pago simulados (Mercado Pago, PayPal, efectivo).
- Apto para presentación: "simulado, honesto".

**Decisión:** D-032 (pagos simulados).

**Evidencia:** `backend/src/features/payment/dto/card.dto.ts`.

---

## 2026-06-25

### Auditoría multi-agente + cierre propuesta

**Cambio:** Propuesta completa auditada y verificada.

**Descripción:**
- Multi-agente review de secciones: §0 Architecture, §1 Features, §2 Backend, §3 Frontend.
- Todos los requisitos de la propuesta cumplidos y testeados en código real.
- Pasada de "honestidad": sin fabricaciones, sin supuestos.
- Nivel de confianza: **95–100%** (regla #22).

**Decisión:** D-027 (cierre propuesta escolar).

**Evidencia:** `docs/arquitectura/decisiones.md` D-027..D-036.

---

## 2026-07-06

### Helmet: Security Headers (Content-Security-Policy + HSTS + Clickjacking Protection) (12:27)

**Cambio:** Implementación de security headers (OWASP ASVS L2 V10).

**Descripción técnica:**
- Instalado: `helmet@8.2.0`
- Configurado en `backend/src/main.ts` (antes de CORS, reutilizando pattern de middleware NestJS)
- Headers implementados: CSP, HSTS (1 año + preload), X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- CSP permite 'self' + 'unsafe-inline' en styles (NativeWind) para dev; revisar en prod

**Verificación real (no inventado):**
```bash
$ npm run build         # ✅ exitoso, 0 errores TypeScript
$ npm run start:dev    # ✅ arrancó, todas las rutas mapeadas
$ curl -I http://localhost:3002/health
Content-Security-Policy: default-src 'self';...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

**Evidencia:** 
- Archivo modificado: `backend/src/main.ts` (importación helmet + configuración L15–41)
- Instalación: `backend/package.json` + `backend/package-lock.json` (helmet 8.2.0)
- Prueba real: headers verificados en respuesta HTTP vía curl

**Decisión:** D-039 (security headers OWASP ASVS L2 V10).

---

### HTTPS Optional en Local (dev/prod flexibility) (12:39)

**Cambio:** Configuración de TLS/HTTPS vía env vars (OWASP ASVS L2 V7).

**Descripción técnica:**
- Condicional: HTTPS_ENABLED=true carga certificados desde HTTPS_CERT_PATH, HTTPS_KEY_PATH
- Rutas env vars + fallback defaults (./cert.pem, ./key.pem)
- Error temprano si archivos no existen (fail-closed, regla #1)
- Configurado en `backend/src/main.ts` (NestFactory.create() con httpsOptions)
- Dev: HTTP (HTTPS_ENABLED=false por defecto en .env.example)
- Prod: HTTPS obligatorio (setear HTTPS_ENABLED=true + colocar certificados)
- Certificados en .gitignore (no commiteados)

**Certificado de prueba generado:**
```bash
openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/CN=localhost"
```

**Verificación real:**
```bash
$ HTTPS_ENABLED=true HTTPS_CERT_PATH=../cert.pem HTTPS_KEY_PATH=../key.pem npm run start:dev
[NestApplication] Nest application successfully started
$ curl -k -I https://localhost:3002/health
HTTP/1.1 200 OK
```

**Archivos modificados:**
- `backend/.env.example` (NODE_ENV + HTTPS_* vars)
- `backend/src/main.ts` (HTTPS condicional L5–26, NestFactory.create L37)
- `.gitignore` (cert.pem, key.pem agregados)

**Decisión:** D-040 (TLS/HTTPS transport security ASVS L2 V7).

---

### Audit Logging: Acciones Críticas Registradas (12:45)

**Cambio:** Servicio de auditoría para login, cambios de estado, accesos denegados (OWASP ASVS L2 V8 — Error Handling and Logging).

**Descripción técnica:**
- Nuevo servicio: `src/shared/logging/audit-log.service.ts` (reutiliza NestJS Logger, no custom logger)
- Métodos: `logLogin()`, `logOrderStateChange()`, `logUnauthorizedAccess()`, `logMFARequired()`, `logInvalidToken()`
- Formato: JSON estructurado (fácil parsing en logs centralizados)
- **NO loguea:** tokens, passwords, secrets (regla #0 — evidence or block)
- Inyectable global: agregado a `app.module.ts` como provider
- Integración:
  - `src/application/auth/auth.service.ts`: loguea login exitoso/fallido (user + admin)
  - `src/presentation/orders/orders.controller.ts`: loguea cambio de estado (quién, qué, cuándo)

**Auditoría implementada:**
```typescript
// Login exitoso
logLogin('user@edu.utc.mx', true, 'user')
// Output: {"action":"login","email":"user@edu.utc.mx","method":"user","success":true,"timestamp":"2026-07-06T12:45:00Z"}

// Cambio de estado
logOrderStateChange('order-uuid', 'pending', 'preparing', 'admin@utc.mx')
// Output: {"action":"order_state_change","orderId":"order-uuid","from":"pending","to":"preparing","admin":"admin@utc.mx","timestamp":"2026-07-06T12:45:00Z"}
```

**Verificación:**
- `npm run build` OK (TypeScript compila, no type errors)
- AuditLogService inyectable en todos lados (app.module provider)
- Logs van a stdout (NestJS Logger) → fácil redirigir a ELK/Datadog en prod

**Archivos modificados:**
- `src/shared/logging/audit-log.service.ts` (nuevo)
- `src/app.module.ts` (AuditLogService en providers)
- `src/application/auth/auth.service.ts` (importa AuditLogService, loguea login)
- `src/presentation/orders/orders.controller.ts` (importa AuditLogService, loguea cambio de estado)

**Decisión:** D-041 (audit logging ASVS L2 V8).

---

### Organización: Carpeta Centralizada OWASP (13:21)

**Cambio:** Creada carpeta `docs/OWASP/` con documentación de cumplimiento ASVS L2.

**Descripción:**
- Nueva carpeta: `docs/OWASP/` (punto central para auditoría de seguridad)
- Archivos movidos:
  - `OWASP-ASVS-L2-Analysis.md` (análisis de 14 dominios)
  - `OWASP-ASVS-L2-Recommendations.md` (plan técnico 7h)
  - `threat-model.md` (STRIDE formal, 31 amenazas)
- Índice: `docs/OWASP/README.md` (master checklist, resumen L2)
- Beneficio: fácil auditoría trimestral, referencia única para tesis

**Estructura:**
```
docs/OWASP/
├── README.md (resumen + checklist L2)
├── OWASP-ASVS-L2-Analysis.md (V1–V14, estado actual)
├── OWASP-ASVS-L2-Recommendations.md (plan 7h)
└── threat-model.md (STRIDE, riesgos residuales)
```

**Verificación:** `ls docs/OWASP/` → 4 archivos presentes, enlaces internos OK

**Decisión:** D-043 (documentación centralizada OWASP).

---

### Reglas 42 y 43: Guardrails Arquitectónicos (13:45)

**Cambio:** Agregadas dos nuevas reglas obligatorias a `docs/superpowers/priority/rules.md`.

**Descripción técnica:**
- **Regla 42 — Ubicación del código (YAGNI + Reutilización)**: Antes de escribir código, preguntar dónde debe vivir. Buscar reutilización en: domain/ → application/ → infrastructure/ → shared/. Nunca crear código por conveniencia. Regla dura: código duplicado = BLOQUEADO.
  
- **Regla 43 — Decisiones arquitectónicas (análisis obligatorio)**: Toda decisión multi-módulo o con nuevas dependencias debe responder 6 preguntas: (1) ¿Por qué aquí? (2) ¿Por qué no X? (3) ¿Qué deps introduce? (4) ¿Rompe encapsulamiento? (5) ¿Aumenta acoplamiento? (6) ¿Disminuye cohesión? Bonus: ¿Facilita DOXIA en 2 años? Regla dura: sin respuestas = BLOQUEADO.

**Verificación:**
- `grep -n "# 42\|# 43"` → Regla 42 línea 954, Regla 43 línea 997 ✅
- `wc -l rules.md` → 1318 líneas (+90 respecto a 1228) ✅
- Reglas sin errores de sintaxis: lectura manual de ambas ✅

**Decisión:** D-044 (cierre arquitectónico pre-producción).

**Contexto:** 2 meses hasta producción. Arquitectura congelada. Estas reglas son guardrails contra decisiones improvisadas y duplicación de código bajo presión.

---

## Reglas de documentación

Cada cambio en este changelog debe incluir:

```txt
- Commit hash
- Fecha (ISO 8601) + hora estimada
- Descripción breve (qué cambió)
- Explicación técnica (por qué, qué implicaciones)
- Decisión relacionada (D-00X si aplica)
- Evidencia verificable (git show, código leído, prueba ejecutada)
```

Estos cambios deben mantenerse **siempre sincronizados** con:
- `docs/propuesta/*` (alcance, funcionalidades)
- `docs/arquitectura/decisiones.md` (decisiones tecnicas)
- `docs/operacion/*` (procedimientos)
- `rules.md` (reglas obligatorias)
