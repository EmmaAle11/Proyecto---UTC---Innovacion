# Arquitectura — UTC Pick Sazón

> **Pide fácil, recoge con sabor.** App de cooperativa / dark kitchen escolar UTC, modalidad **Pick Up** (sin envíos, BR-001).
>
> - Alcance y reglas de negocio: [`algoritmo-circulo-innovacion.md`](../propuesta/algoritmo-circulo-innovacion.md) (Ocurrencia → Idea → Propuesta) + [`Algoritmo-ejecucion.md`](../propuesta/Algoritmo-ejecucion.md).
> - Decisiones canónicas: [`decisiones.md`](decisiones.md) (D-001…D-021). Reglas operativas: `docs/superpowers/priority/rules.md`.
> - Este documento refleja la arquitectura **adoptada** (post-decisiones). El esquema de BD (§5) está **materializado** por **migración TypeORM** (`backend/src/infrastructure/database/migrations/1782168106072-Init.ts`, rules §11): 6 tablas + 5 enums creados en Postgres (`init.sql` solo crea la extensión `pgcrypto`).

---

## 1. Frontend — Expo (managed) + React Native

- **Tecnología:** Expo SDK 56 (runtime **Expo Go**, D-012), TypeScript, **NativeWind/Tailwind**, React Navigation, **Zustand**, `react-native-svg`, `expo-linear-gradient`, `expo-constants`, **`expo-font`** (identidad "Editorial Street-Food", D-020: Bricolage Grotesque / Plus Jakarta Sans / Space Mono).
- **Roles y navegación:** `RootNavigator` ramifica por rol de sesión — cliente → `MainStack` (tabs Inicio·Pedidos·Perfil); **admin → `AdminStack`** (tabs Dashboard·Cola·Menú + Detalle de pedido / Editar producto / Reoferta). Sistema de diseño en código: `shared/theme/tokens.ts` + primitivas `shared/ui/Type`. (El `design-system/` de referencia se retiró; másters del logo en `brand/`.)
- **Arquitectura FSD** (`frontend/src/`):

```txt
app/        configuración global y navegación (RootNavigator, MainTabs, types)
pages/      pantallas (welcome, auth, home, orders, profile)
widgets/    bloques visuales grandes (auth/AuthScaffold)
features/   acciones del usuario (auth: api + store de sesión)
entities/   modelos de negocio
shared/     ui (LogoLockup, LogoSymbol, BrandField, PrimaryButton), api client, theme/tokens, helpers
```

- **Restricción dura (D-012):** solo librerías compatibles con Expo Go. Auth del cliente por **HTTP al backend** (no `react-native-app-auth`).
- **Distribución de prueba (solo Android):** Expo Go SDK 53+ **removió las notificaciones del SO**, así que para verlas se hace un **development build** con EAS. Ese build es un **APK de Android** → la versión instalable de prueba es **solo Android** (iOS no instala APKs). Para iPhone se requeriría un **build iOS** por **TestFlight/ad-hoc**, que exige **cuenta de Apple Developer (~$99/año)**; alternativa: correr en iPhone por **Expo Go** (túnel) para ver el flujo, pero **sin notificaciones**. El **túnel** (cloudflared/Expo) funciona igual en ambas plataformas — la limitación es de **formato/distribución del instalable**, no del túnel. Ver runbook `docs/Read/levantar-proyecto.md §4`.
- **Pantallas:** Welcome (elige Cliente/Admin) · Login cliente (crear cuenta / iniciar sesión) · Login admin · Inicio · Detalle producto · Carrito/Pedido · Estado del pedido · Admin productos · Admin pedidos.

---

## 2. Backend — NestJS + Clean Architecture

**Tecnología**

- **NestJS 11** + TypeScript.
- **TypeORM** (`synchronize: false`; esquema por **migraciones**, rules §11) + driver `pg` → PostgreSQL.
- **@nestjs/config** (variables de entorno globales, `.env` gitignored).
- **@nestjs/throttler** → rate limiting (§8): default 60/min; **auth 5/min**.
- **passport-jwt + jwks-rsa** → validación de **JWT emitidos por Keycloak** (firma RS256 + issuer). **Guards globales** `JwtAuthGuard` + `RolesGuard` (`@Public()`/`@Roles()`) protegen las rutas (D-017).
- **class-validator / class-transformer** → validación de DTOs (`ValidationPipe` global con `whitelist + forbidNonWhitelisted`).
- **CORS** habilitado (la app Expo consume el backend desde otro origen).

**Estructura real (capas Clean Architecture, `backend/src/`)**

```txt
domain/          tipos y contratos de negocio (puros)
application/     casos de uso / services + DTOs   → auth/ (auth.service, dto/)
infrastructure/  detalles externos                → database/ (TypeORM: entities/, migrations/, data-source), keycloak/ (Admin API), auth/ (JwtStrategy)
presentation/    controllers + módulos Nest       → health/, auth/ (auth.controller, auth-me.controller, auth.module, guards/, decorators/)
```

**Flujo de petición**

```txt
Controller → ValidationPipe (DTO) → Service (application)
   → infrastructure: KeycloakAdminService (Admin API)  |  TypeORM Repository
   → Keycloak  |  PostgreSQL
```

**Módulos implementados**

| Ruta | Método | Función |
| --- | --- | --- |
| `/health` | GET | estado del servicio + conexión a BD (`{status, db}`) |
| `/auth/register` | POST | crea cuenta de cliente en Keycloak (valida `@edu.utc.mx`, rol `user`) y devuelve tokens |
| `/auth/login` | POST | login del cliente (password grant) → tokens |
| `/auth/admin/login` | POST | login del **admin**: password grant + **`totp`** (MFA) + verifica rol `admin` (403 si no) |
| `/auth/me` | GET | (protegido) identidad del JWT (`sub`, `email`, `roles`) |
| `/auth/admin-check` | GET | (protegido, `@Roles('admin')`) smoke-test de autorización |

**Puertos** (este equipo remapea por conflicto con otro proyecto; defaults documentados):

| Servicio | Default | Este equipo |
| --- | --- | --- |
| Backend (NestJS) | 3000 | **3001** |
| PostgreSQL | 5432 | **5433** |
| Keycloak | 8080 | **8082** |
| Expo web (Metro) | 8081 | 8081 |

---

## 3. Autenticación — Keycloak local (D-010, D-013, D-014)

- **Keycloak 26** en Docker. Realm **`utc-food`** (archivo de import: `infra/keycloak/realm-utc-pick-sazon.json`). Roles realm: **`admin`**, **`user`**.
- **Clients:**
  - `mobile-app` — **público**, `directAccessGrants` (login por password grant del cliente).
  - `backend-svc` — **confidential**, **service account** (lo usa el backend para crear usuarios por la Admin API). Roles de `realm-management`: **`manage-users`** + **`view-realm`**.
- **Modelo por rol (sin Microsoft — el equipo nunca tendrá app registration + admin consent del tenant UTC):**
  - **Admin** (`coop-admin`, D-015) → credenciales **locales**, **sembradas** (no se auto-registra). Correo `admin@picksazon.app`. **MFA activa** (TOTP de Keycloak, D-016): `POST /auth/admin/login` exige el código `totp` + rol `admin`.
  - **Cliente (`user`)** → **auto-registro restringido a `@edu.utc.mx`** vía backend; credenciales locales. Sin Microsoft/Outlook.
- **Keycloak es el único emisor de tokens.** El backend valida firma + rol del JWT (implementado, D-017). Federar Microsoft a futuro sería "solo config" (no requiere reescritura).

---

## 4. Seed de Keycloak — `infra/keycloak/seed-admin.sh`

Script **idempotente** (re-ejecutable) que prepara la instancia viva (editar el realm JSON no re-importa en caliente). Lee secretos de `infra/.env` (**gitignored**, §17); nada de secretos en git.

1. **Admin:** crea/asegura el usuario `coop-admin` (`admin@picksazon.app`) — `enabled`, `emailVerified`, `firstName`/`lastName` (requeridos por el *User Profile* de Keycloak, si no el login falla con *"Account is not fully set up"*), contraseña **permanente** desde `ADMIN_SEED_PASSWORD`, y rol realm **`admin`**.
2. **Client `backend-svc`:** lo crea si falta, fija su **secreto** desde `BACKEND_CLIENT_SECRET`, y asigna a su service-account los roles **`manage-users` + `view-realm`** de `realm-management`.

**Variables** (`infra/.env`): `KEYCLOAK_ADMIN`, `KEYCLOAK_ADMIN_PASSWORD`, `ADMIN_SEED_USERNAME`, `ADMIN_SEED_EMAIL`, `ADMIN_SEED_PASSWORD`, `BACKEND_CLIENT_SECRET`.
El backend usa `KEYCLOAK_BACKEND_CLIENT_ID=backend-svc` + `KEYCLOAK_BACKEND_CLIENT_SECRET` (mismo valor) desde `backend/.env`.

**Verificación (§0):** token `client_credentials` de `backend-svc` → Admin API HTTP 200; registro `@edu.utc.mx` → token con `realm_access.roles` incluyendo `user`. El **cliente no se siembra**: se auto-registra por `POST /auth/register`.

---

## 5. Base de datos — PostgreSQL (esquema materializado, vía migración TypeORM)

> **Estado:** aplicado en Postgres (`UTC_PROJECT_DB`) por la migración `1782168106072-Init.ts` — verificado: 6 tablas (`user_profile`, `products`, `orders`, `order_items`, `payments`, `preparation_times`) + 5 enums + tabla `migrations`. Reproducible con `npm run migration:run` (idempotente). `synchronize: false`.

> Convenciones: PK `uuid` (`gen_random_uuid()` de `pgcrypto`); timestamps `timestamptz`; dinero `numeric(10,2)`; tiempos de preparación en **segundos** (`int`). Todos los tiempos oficiales = **hora del servidor** (BR-005). PK/FK explícitas (Idea del círculo de innovación, punto 2).

### 5.0 Tipos enumerados

| Enum | Valores |
| --- | --- |
| `user_role` | `admin`, `user` |
| `order_status` | `pending`, `preparing`, `ready`, `picked_up`, `not_picked_up`, `cancelled`, `ready_later` |
| `product_status` | `por_preparar`, `preparado`, `sin_tiempo_espera`, `calentando`, `no_disponible` |
| `payment_method` | `mercado_pago`, `paypal`, `tdc`, `tdd`, `efectivo` |
| `payment_status` | `pending`, `paid`, `failed`, `refunded` |

> **Nota (materialización):** los nombres `user_role`/`order_status`/… son **lógicos**. La migración TypeORM crea los tipos en Postgres como `<tabla>_<columna>_enum`: `user_profile_role_enum`, `orders_status_enum`, `products_status_enum`, `payments_method_enum`, `payments_status_enum`. Los **valores** coinciden exactamente; un `\dT+` mostrará esos nombres.

### 5.1 `user_profile` — perfil local enlazado a Keycloak (BR-002, BR-014)

| Campo | Tipo | Restricciones | Nota |
| --- | --- | --- | --- |
| `id` | uuid | PK, default `gen_random_uuid()` | |
| `keycloak_id` | uuid | UNIQUE, NOT NULL | `sub` del JWT de Keycloak |
| `email` | text | UNIQUE, NOT NULL | cliente: `@edu.utc.mx` |
| `first_name` | text | NOT NULL | |
| `last_name` | text | NOT NULL | |
| `role` | `user_role` | NOT NULL, default `user` | **autoridad real = JWT**; copia de conveniencia |
| `created_at` | timestamptz | NOT NULL, default `now()` | |
| `updated_at` | timestamptz | NOT NULL, default `now()` | |

### 5.2 `products` — catálogo (BR-006, BR-007, BR-011)

| Campo | Tipo | Restricciones | Nota |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `name` | text | NOT NULL | |
| `description` | text | | |
| `price` | numeric(10,2) | NOT NULL, CHECK `> 0` | §7: precio > 0 |
| `category` | text | NOT NULL | p. ej. `Preparados` (BR-006/011) |
| `image_url` | text | | |
| `base_prep_time_seconds` | int | NOT NULL, CHECK `> 0` | `tiempo_base` (BR-007) |
| `stock` | int | NOT NULL, default 0, CHECK `>= 0` | sin negativos (BR-011) |
| `min_stock` | int | NOT NULL, default 0, CHECK `>= 0` | mínimo "Preparados" (BR-011) |
| `max_stock` | int | CHECK `>= min_stock` | máximo "Preparados" (BR-011) |
| `status` | `product_status` | NOT NULL, default `no_disponible` | estados del producto (círculo §3.6) |
| `is_available` | boolean | NOT NULL, default true | |
| `reoffer_price` | numeric(10,2) | CHECK `> 0` | reoferta / "Pon tu precio" (círculo §3.11) |
| `created_at` / `updated_at` | timestamptz | NOT NULL, default `now()` | |

### 5.3 `orders` — pedidos (BR-004, BR-005, BR-008, D-005)

| Campo | Tipo | Restricciones | Nota |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `user_profile_id` | uuid | FK → `user_profile(id)` ON DELETE RESTRICT, NOT NULL | dueño (BR-014) |
| `status` | `order_status` | NOT NULL, default `pending` | transiciones BR-004 |
| `total_amount` | numeric(10,2) | NOT NULL, CHECK `>= 0` | suma de ítems |
| `accepted_at` | timestamptz | | admin acepta → `preparing` (BR-008) |
| `estimated_ready_at` | timestamptz | | estimado 10–15 min (círculo §3.8) |
| `ready_at` | timestamptz | | **fuente de verdad** (BR-005), hora del servidor |
| `pickup_deadline` | timestamptz | | `ready_at` + 20 min (D-005) |
| `picked_up_at` | timestamptz | | |
| `created_at` | timestamptz | NOT NULL, default `now()` | |
| `updated_at` | timestamptz | NOT NULL, default `now()` | |

**Transiciones válidas (BR-004 + círculo):** `pending→preparing→ready→{picked_up | not_picked_up}`, `ready→ready_later` (extender), `pending→cancelled`. Prohibido: `picked_up→*`, `cancelled→preparing|ready`.

### 5.4 `order_items` — líneas del pedido

| Campo | Tipo | Restricciones | Nota |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `order_id` | uuid | FK → `orders(id)` ON DELETE CASCADE, NOT NULL | |
| `product_id` | uuid | FK → `products(id)` ON DELETE RESTRICT, NOT NULL | |
| `quantity` | int | NOT NULL, CHECK `> 0` | §7: cantidad > 0 |
| `unit_price` | numeric(10,2) | NOT NULL, CHECK `> 0` | **snapshot** del precio al ordenar |
| `subtotal` | numeric(10,2) | NOT NULL, CHECK `>= 0` | `quantity * unit_price` |
| `prep_time_seconds` | int | CHECK `> 0` | estimado para la línea |

### 5.5 `payments` — pagos 1:1 con el pedido (BR-009, BR-010)

| Campo | Tipo | Restricciones | Nota |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `order_id` | uuid | FK → `orders(id)` ON DELETE CASCADE, **UNIQUE**, NOT NULL | 1 pago por pedido |
| `method` | `payment_method` | NOT NULL | BR-009 (`efectivo` sin pasarela) |
| `status` | `payment_status` | NOT NULL, default `pending` | |
| `amount` | numeric(10,2) | NOT NULL, CHECK `> 0` | |
| `provider_reference` | text | | id de transacción de la pasarela |
| `created_at` / `updated_at` | timestamptz | NOT NULL, default `now()` | |

### 5.6 `preparation_times` — histórico de preparación (BR-007)

| Campo | Tipo | Restricciones | Nota |
| --- | --- | --- | --- |
| `id` | uuid | PK | |
| `product_id` | uuid | FK → `products(id)` ON DELETE CASCADE, NOT NULL | |
| `order_item_id` | uuid | FK → `order_items(id)` ON DELETE SET NULL | muestra de origen |
| `duration_seconds` | int | NOT NULL, CHECK `> 0` | tiempo **real** medido |
| `recorded_at` | timestamptz | NOT NULL, default `now()` | hora del servidor |

**Cálculo de promedio (BR-007):** media de las **últimas 20** muestras del producto; con **< 3** registros se usa `products.base_prep_time_seconds`. Nunca se confía en tiempos enviados por el frontend.

### 5.7 Relaciones (resumen)

```txt
user_profile 1───∞ orders 1───∞ order_items ∞───1 products
                    └──1:1── payments
products 1───∞ preparation_times ∞───0..1 order_items
```

Índices sugeridos: `orders(user_profile_id)`, `orders(status)`, `order_items(order_id)`, `preparation_times(product_id, recorded_at)`.

---

## 6. Seguridad (rules §5–§10, §16–§17)

- **JWT** de Keycloak validado por el backend: **guards globales** `JwtAuthGuard` (firma RS256 vía JWKS + issuer) + `RolesGuard` (`@Roles`), con `@Public()` para auth/health (D-017). El frontend puede ocultar UI, pero **el backend siempre valida permisos** (rules §5).
- **DTO validation** en todo input (`ValidationPipe` `whitelist`+`forbidNonWhitelisted`). **SQLi** mitigado por repos TypeORM **parametrizados** (sin SQL concatenado con input de usuario).
- **Rate limiting** (§8): auth 5/min, default 60/min → HTTP 429.
- **MFA admin** (§6): **activa** — TOTP integrado de Keycloak; el login admin exige `totp` (D-016).
- **Circuit breaker de pagos** (BR-010): si la pasarela falla repetidamente → estado `OPEN`, error controlado, método alternativo.
- **Secretos** solo en `.env` (gitignored); nunca en git (§17). Git lo ejecuta el usuario a mano (§23).

---

## 7. Reglas de negocio clave (del círculo de innovación)

- **Estados del pedido:** Pendiente · En preparación · Listo para recoger · Recogido · No recogido · Cancelado · **Listo para recoger después**.
- **Estados del producto:** Por preparar (con tiempo estimado) · Preparado, listo para recoger · **Preparado | Sin tiempo de espera** · **Calentando tu alimento** · No disponible.
- **Ventana de recogida (D-005):** listo en ~10–15 min; margen de recogida ~10–20 min. Vencido → confirmación al alumno: *cancelar* o *extender para después*.
- **Reoferta (BR-006):** si no se recoge / se cancela sin tocar el alimento → vuelve a ofertarse como *Preparado | Sin tiempo de espera*; la UI muestra *"Listo hace X min"* (desde `ready_at`). Si lleva mucho tiempo → *Calentando tu alimento*.
- **Extender:** queda `ready_later`; recogible el mismo día. Si no se recoge al cierre, el cobro se mantiene y el alimento pasa a manejo interno.
- **Precio dinámico (círculo §3.11):** el admin puede activar reoferta con descuento controlado o *"Pon tu precio"* (`products.reoffer_price`).
- **Semáforo de congestión (D-019, círculo §3.14):** indicador de carga calculado por el **backend** como el **número de pedidos en cola** = `orders` en estado `pending` + `preparing` + `ready` (excluye `ready_later`/`picked_up`/`not_picked_up`/`cancelled`). Umbrales **parametrizables**: 🟢 **Verde** `n < 5` · 🟡 **Amarillo** `5 ≤ n ≤ 10` · 🔴 **Rojo** `n > 10` (`UMBRAL_AMARILLO=5`, `UMBRAL_ROJO=10`). **Lo ven ambos roles:** el **admin** con el conteo exacto (para empujar pedidos programados) y el **cliente** con el color + etiqueta ("tranquila / concurrida / llena"), sin el número crudo. Expuesto por endpoint legible por ambos; hora del servidor (BR-005).

---

## 8. Flujos

**Sistema**

```txt
Cliente → App Expo Go → Backend NestJS → (Keycloak | PostgreSQL)
Admin   → Panel Admin  → Backend NestJS (rol admin del JWT) → PostgreSQL
```

**Pedido**

```txt
Cliente inicia sesión → elige producto (Preparado o con tiempo de espera) → revisa tiempo estimado
→ confirma → paga → backend registra el pedido → dark kitchen prepara
→ admin marca "Listo para recoger" (set ready_at) → push al cliente → recoge
   (si no recoge en la ventana → not_picked_up / ready_later / reoferta)
```
