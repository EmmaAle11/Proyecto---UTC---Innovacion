# Seguridad de Auth (JWT guard + roles + admin real + MFA) · Implementation Plan

> Plan de seguridad de la capa de autenticación. Pasos con checkbox (`- [ ]`). Cierra con verificación real (rules §0) y gate de confianza 95–100% (rules §22). Git lo ejecuta el usuario (rules §23).

**Goal:** Blindar la autenticación: el backend **valida JWT y rol** (hoy no lo hace), el admin entra con **credenciales reales contra Keycloak + MFA** (hoy es un mock), y un `user` **nunca** puede entrar como admin. Cubre los puntos de seguridad que marcó el usuario (diferenciar admin/cliente, MFA) y rules §5/§6/§7.

**Architecture:** Clean (backend) — `JwtStrategy` (infrastructure) valida tokens de Keycloak vía JWKS; `JwtAuthGuard`+`RolesGuard` (presentation) protegen rutas; `@Public()`/`@Roles()` como decoradores. El admin se autentica por **password grant + `totp`** mediado por el backend, que **verifica el rol `admin`** antes de devolver tokens. MFA se refuerza con un **flujo condicional por rol** en Keycloak.

**Tech Stack:** NestJS 11 · passport-jwt + jwks-rsa (ya instalados) · Keycloak 26 (realm `utc-food`) · React Native (campo OTP en el login admin).

## Estado verificado (punto de partida, rules §0)
- Backend: **0** guards/roles/JWT (`grep` en `backend/src`). SQLi **mitigado** (todo repos TypeORM parametrizados; los `queryRunner.query` son DDL estático de la migración).
- Keycloak: `coop-admin` tiene `password`+`otp`; password grant **sin** `totp` → rechazado (MFA activa por "user configured"). `mobile-app` con directAccessGrants; roles `admin`/`user`.
- Admin en la app = **mock** (`setSession('mock-admin')`).

## Global Constraints
- **EVIDENCE OR BLOCK (§0) / FAIL-CLOSED (§1):** cerrar con `build`/`test`/`tsc` + `curl` reales (guard rechaza sin token / con rol equivocado; admin exige `totp`).
- **Clean (§4):** `domain`/`application` sin NestJS/TypeORM; validación de JWT en `infrastructure`; guards en `presentation`.
- **Backend = fuente de verdad (§5, BR-015):** el rol se valida **en el backend**, nunca confiando en el frontend.
- **Secretos (§17):** nada sensible a git; `KEYCLOAK_URL`/realm por env.
- **Git (§23):** no se commitea; se propone.

---

### Task 1: Validación de JWT (JwtStrategy + JwtAuthGuard)

**Files:**
- Create: `backend/src/infrastructure/auth/jwt.strategy.ts` (passport-jwt + jwks-rsa → valida firma con JWKS de Keycloak, issuer, y expone `sub`, `email`, `realm_access.roles`)
- Create: `backend/src/presentation/auth/guards/jwt-auth.guard.ts` (`AuthGuard('jwt')` + respeta `@Public()`)
- Create: `backend/src/presentation/auth/decorators/public.decorator.ts`
- Modify: `backend/src/app.module.ts` (registrar `JwtAuthGuard` como `APP_GUARD` global; `PassportModule`)
- Modify: `backend/.env.example` (`KEYCLOAK_URL`, `KEYCLOAK_REALM`)

- [ ] **Step 1:** `JwtStrategy` con `jwks-rsa` apuntando a `${KEYCLOAK_URL}/realms/${REALM}/protocol/openid-connect/certs`, `issuer=${KEYCLOAK_URL}/realms/${REALM}`, `algorithms:['RS256']`. `validate(payload)` devuelve `{ sub, email, roles: payload.realm_access?.roles ?? [] }`.
- [ ] **Step 2:** `@Public()` (SetMetadata) + `JwtAuthGuard` que lo respeta (Reflector).
- [ ] **Step 3:** registrar guard global en `app.module`; marcar `@Public()` en `register`, `login`, `health`.
- [ ] **Step 4 (verificación):** `npm run build` + `tsc`; `curl` a una ruta protegida sin token → **401**.

---

### Task 2: Autorización por rol (RolesGuard + @Roles)

**Files:**
- Create: `backend/src/presentation/auth/decorators/roles.decorator.ts`
- Create: `backend/src/presentation/auth/guards/roles.guard.ts`
- Create: `backend/src/presentation/auth/auth-me.controller.ts` (`GET /auth/me` → devuelve `sub/email/roles`; smoke-test del guard)

- [ ] **Step 1:** `@Roles('admin')` + `RolesGuard` que lee `request.user.roles` y exige intersección.
- [ ] **Step 2:** `GET /auth/me` (protegido, cualquier rol) y, p. ej., `GET /auth/admin-check` (`@Roles('admin')`) para probar.
- [ ] **Step 3 (verificación):** token de **cliente** (`user`) en `/auth/admin-check` → **403**; token de **admin** → **200**. Token de admin en `/auth/me` → 200 con `roles:['admin',...]`.

---

### Task 3: Login real del admin (backend, password grant + totp + check de rol)

**Files:**
- Create: `backend/src/application/auth/dto/admin-login.dto.ts` (`email`, `password`, `totp` 6 dígitos)
- Modify: `backend/src/infrastructure/keycloak/keycloak-admin.service.ts` (`loginAdmin(email,password,totp)` → password grant con `totp`; decodifica el token y **exige rol `admin`**, si no → 403)
- Modify: `backend/src/presentation/auth/auth.controller.ts` (`POST /auth/admin/login`, `@Public()`, rate-limited)

- [ ] **Step 1:** `loginAdmin`: password grant incluyendo `&totp=`; si Keycloak rechaza → 401 "Credenciales o código inválidos"; si el token no tiene rol `admin` → 403 "No autorizado como administrador".
- [ ] **Step 2 (verificación):** `curl` admin con `totp` correcto → tokens; sin `totp` o con uno malo → 401; con un usuario `user` (si tuviera OTP) → 403.

---

### Task 4: Frontend — login admin real con campo OTP

**Files:**
- Modify: `frontend/src/pages/auth/LoginAdminScreen.tsx` (quita el mock; agrega `BrandField` de **código (6 dígitos)**; llama a `POST /auth/admin/login`; `setSession` con tokens reales)
- Modify: `frontend/src/features/auth/api/auth.api.ts` (`loginAdmin(email,password,totp)`)

- [ ] **Step 1:** 3.º campo OTP (numérico, 6 díg.) en la hoja del admin (mantiene el hero azul ya armonizado).
- [ ] **Step 2:** on success `setSession`; on error mensaje del backend.
- [ ] **Step 3 (verificación):** `tsc` verde; bundle Metro 200; (visual en Expo Go: login admin real con código).

---

### Task 5: MFA robusta por rol (Keycloak) — refuerzo

**Files:**
- Modify: `infra/keycloak/realm-utc-pick-sazon.json` (documentar/parametrizar) + `infra/keycloak/seed-admin.sh` (o script aparte) para un **subflujo condicional**: en el flujo *direct grant*, `Condition - User Role = admin` → OTP **required**.

- [ ] **Step 1:** añadir el subflujo condicional por rol (vía kcadm en el seed, idempotente) para que **todo** admin requiera OTP aunque cambie el default; el `user` lo salta.
- [ ] **Step 2 (verificación):** admin sin `totp` → rechazado; `user` (sin OTP) → entra sin OTP. (Hoy ya pasa por "user configured"; esto lo hace explícito y robusto.)

---

### Task 6: Verificación integral + cierre (rules §0, §18, §22)

- [ ] `cd backend && npm run build && npm test && npx tsc --noEmit` → verdes.
- [ ] Matriz `curl`: sin token→401 · cliente en ruta admin→403 · admin sin totp→401 · admin con totp→200 · `/auth/me` refleja roles.
- [ ] Frontend `tsc` + bundle 200; (visual admin real en Expo Go).
- [ ] DoD (§19): Observaciones · Riesgos · Validaciones · Pendientes · Confianza (≥95%). No commit — proponer staging.

---

## Fuera de alcance / notas
- **SQL injection:** ya mitigado por TypeORM (parametrizado) + DTOs; no requiere cambio aquí. La disciplina (params + validación de negocio: precio>0, stock≥0, cantidad>0, estado∈enum) se aplica al construir productos/pedidos (Paso 3).
- **No** se construyen aún las pantallas internas ni el algoritmo de negocio (van después, como acordado).
- **Persistencia Keycloak:** corre en H2 sin volumen; los cambios de runtime (incl. OTP enrolado) se pierden al **recrear** el contenedor → en la escuela: `docker compose up` + re-`seed` + re-enrolar OTP. (Endurecimiento opcional: persistir Keycloak en Postgres.)
- **Admin "permanente":** el banner *"temporary admin"* de `kcadmin` es un endurecimiento aparte (crear admin de servidor permanente y borrar el temporal).
</content>
