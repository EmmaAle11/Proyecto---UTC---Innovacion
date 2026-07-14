# Plan 01 — Cimientos: roles v2, sucursales y alcance por cooperativa

> **Sección 1 de 5.** Ejecuta `specs/2026-07-14-roles-insumos-efectivo-design.md`.
> **Nada de lo demás tiene dueño sin esto.** El efectivo lo cobra *mostrador*, los costos los lleva
> *inventario*, la producción la mueve *cocina*. Sin roles y sin alcance por sucursal, los planes
> 02–05 se construirían dos veces.
> Git lo ejecuta el usuario (§23). Rama: `feat/roles-e-insumos`.

**Goal:** Que exista la cooperativa como **entidad real** (no como texto que manda el cliente), que existan
las **5 personas** con sus permisos, y que el backend **jamás** vuelva a autorizar con un dato del cliente.

**Y cierra el único bug de seguridad REAL que encontramos.** Por eso esta fase se mergea a `main` **sola y
primero**: vale aunque los planes 02–05 nunca lleguen.

---

## Estado verificado (§0 — probado, no supuesto)

| Hecho | Evidencia |
|---|---|
| **El cliente decide a qué cooperativa va su pedido, y el backend le cree** | `create-order.dto.ts:49-58` → `branchId` y `branchName` son `@IsOptional() @IsString()` — **texto libre**. |
| **No existe tabla `branches`.** El catálogo vive **solo** en el frontend | `frontend/src/entities/branch/branches.ts` |
| **`GET /orders/all` autoriza con el query string** | `orders.controller.ts:53-58` → `@Query('branchId') branchId?: string` → `findAll(branchId)`. **Sin el parámetro devuelve los pedidos de TODAS las cooperativas.** |
| **`user_profile` no tiene `branch_id`** | `user-profile.entity.ts` — solo `role` (`admin\|user`). |
| **`app_settings` es fila única** | `@Check("id" = 1)` → los umbrales del semáforo son **globales**; el admin de Roma se los pisaría a Tlalpan. |
| Solo 2 roles | `domain/enums.ts` → `UserRole = admin \| user`. |

### Las dos consecuencias que hay que decir en voz alta

1. **BOLA / IDOR (OWASP A01).** Un `mostrador` de Roma borra `?branchId=` de la URL y lee, cobra y cierra
   los pedidos de **todas** las cooperativas. Hoy no duele porque solo hay un admin. Con un admin por zona,
   es el bug.
2. **Pedido pagado e invisible.** Un cliente manda `branchId: "xyz"`. El pedido se cobra, se guarda… y
   **ninguna cocina lo ve jamás**, porque la cola filtra por ese mismo string. Y `branchName` es texto del
   cliente que se **renderiza en el panel del admin** → inyección de contenido.

---

## Global Constraints

- **§5 / BR-015 — la regla dura de esta fase:** *el `branchId` de autorización sale del **JWT**, nunca del
  request.* El query string solo puede **filtrar dentro** de lo que el token ya permite.
- **§1 fail-closed:** un rol de cooperativa **sin** `branchId` en el token → **401**. No `null` silencioso.
- **§0:** se cierra con curls reales contra Postgres real, no con "compila".
- **§23:** el usuario ejecuta los commits.

---

### Task 1: BD — `branches` y el fin del texto libre
**Files:** Create `migrations/1782941000000-AddBranchesAndRoles.ts`, `entities/branch.entity.ts`;
Modify `entities/{user-profile,order,app-settings}.entity.ts`, `domain/enums.ts`

- [ ] **Step 1 — tabla `branches`:** `id` text PK · `name` · `address` · `lat` · `lng`.
      Sembrar los **3 ids reales** que hoy viven en el frontend: `cdmx-tlalpan`, `cdmx-coyoacan`, `cdmx-roma`.
      (Los datos fiscales del emisor —RFC, régimen, CP— los agrega el **Plan 05**; aquí no hacen falta.)
- [ ] **Step 2 — FK de `orders.branch_id` → `branches.id`.**
      **ANTES de crear la FK, validar** que no haya ningún `orders.branch_id` fuera del catálogo.
      Si hay huérfanos → **abortar la migración y reportarlos**. No los "arreglo" solo: son pedidos reales
      cuyo destino nadie sabe.
- [ ] **Step 3 — `orders.branch_name` DEJA DE ESCRIBIRSE desde el cliente.** El backend lo **deriva** del
      `branchId` contra `branches`. (Se conserva la columna: es un **snapshot** — si mañana renombran la
      sucursal, el pedido viejo no cambia. Mismo principio que el precio congelado, BR-015.)
- [ ] **Step 4 — roles:** `ALTER TYPE user_profile_role_enum ADD VALUE 'cocina' | 'inventario' | 'mostrador'`.
      ⚠️ Postgres **no permite** usar un valor de enum recién añadido en la misma transacción → va en su
      propia query, separada del resto de la migración.
- [ ] **Step 5 — `user_profile.branch_id`** text NULL + FK a `branches`.
      **`CHECK (role = 'user' OR branch_id IS NOT NULL)`** ← *un rol de cooperativa sin cooperativa es
      imposible, a nivel de base de datos.* No una validación que se pueda olvidar.
- [ ] **Step 6 — `app_settings` por sucursal:** hoy es **fila única** (`@Check("id" = 1)`). La PK pasa a
      `branch_id`. Migrar la fila `id=1` a las 3 cooperativas conservando sus valores actuales (5/10).
- [ ] **Step 7 — verificación:** `migration:run` **y `migration:revert`** contra Postgres real.
      `psql \d` para inspeccionar. **La semilla existente sobrevive** (10 productos, 1 pedido).

### Task 2: Keycloak — 3 roles + el claim `branch_id`
**Files:** Modify `infra/keycloak/seed-admin.sh`, `infra/keycloak/realm-utc-pick-sazon.json`

- [ ] **Step 1:** roles de realm `cocina`, `inventario`, `mostrador`.
- [ ] **Step 2 — el protocol mapper.** Un mapper *User Attribute* que meta `branch_id` como **claim del
      access token**. **Sin esto, el guard no tiene de dónde leer y toda la fase es decorativa.**
- [ ] **Step 3:** sembrar un usuario por rol (`cocina@edu.utc.mx`, `inventario@…`, `mostrador@…`), con
      `branch_id = cdmx-tlalpan`, y **uno extra de otra sucursal** (`mostrador.roma@…` → `cdmx-roma`)
      — ese es el que prueba el aislamiento en la Task 4.
      **Automatizado en el script**: la H2 de Keycloak es **efímera**, y a mano se pierde al recrear el contenedor.
- [ ] **Step 4 — verificación:** login por curl con cada rol → **decodificar el JWT** y comprobar que trae
      `realm_access.roles` **y** `branch_id`.

### Task 3: Backend — `BranchScopeGuard` (aquí se cierra el agujero)
**Files:** Modify `infrastructure/auth/jwt.strategy.ts`, `presentation/auth/guards/roles.guard.ts`;
Create `presentation/auth/guards/branch-scope.guard.ts`;
Modify `modules/orders/presentation/orders.controller.ts`, `.../persistence/order.repository.ts`

- [ ] **Step 1:** `JwtUser` gana `branchId: string | null`. Si el rol es de cooperativa y **no** hay
      `branchId` → **401** (§1). Nada de `undefined` que se cuele.
- [ ] **Step 2 — el cambio que importa:**
      ```ts
      // ANTES — el cliente decide
      @Get('all') @Roles('admin')
      findAll(@Query('branchId') branchId?: string) { return this.orders.findAll(branchId); }

      // DESPUÉS — el token decide
      @Get('all') @Roles('admin','cocina','mostrador') @UseGuards(BranchScopeGuard)
      findAll(@Req() { user }: { user: JwtUser }) { return this.orders.findAll(user.branchId!); }
      ```
- [ ] **Step 3 — que sea IMPOSIBLE de olvidar:** la firma del puerto pasa a
      **`findAll(branchId: string)`** — `string`, **no** `string | undefined`. El compilador se vuelve el
      guardia. (Hoy `where: branchId ? { branchId } : {}` es precisamente la línea que devuelve todo.)
- [ ] **Step 4:** si alguien manda `?branchId=` y **no** coincide con el suyo → **403**.
      No un 200 filtrado en silencio: queremos que **truene**, para que se note el intento.
- [ ] **Step 5 — el DTO deja de aceptar sucursal libre:** `branchId` pasa a `@IsIn(BRANCH_IDS)` contra el
      catálogo del servidor; **`branchName` se ELIMINA del DTO** (lo deriva el backend).
- [ ] **Step 6:** `GET /branches` 🆕 — el catálogo, servido por el backend. Es el **primer ladrillo del
      Plan 02 (SSOT)** y lo que le quita al frontend la potestad de inventar sucursales.

### Task 4: Verificación (§0 / §11 del spec)
- [ ] **Step 1 — aislamiento (el bug):** `mostrador.roma` pide `GET /orders/all?branchId=cdmx-tlalpan`
      → **403**. Sin parámetro → **solo ve Roma**. Un `user` → **403**.
- [ ] **Step 2 — integridad:** `POST /orders` con `branchId: "xyz"` → **400** (antes: 201 y pedido fantasma).
- [ ] **Step 3 — `branchName` inyectado** (`"<script>"`) → el DTO lo **rechaza** (ya no existe el campo).
- [ ] **Step 4:** backend arranca con **0 errores de DI** (los unit tests **no** construyen el grafo de Nest
      — ya nos mordió una vez con `LoggingModule`). `tsc` 0. Los **117 tests** siguen verdes.
- [ ] **Step 5:** agente de regresión sobre el diff (§22). **0 P0-P5.**
- [ ] **Step 6:** ADR **D-047** · **BR-003 modificada** + **BR-016 nueva** (*el alcance sale del JWT*) en
      `rules.md` · CHANGELOG (§39).

---

## Los 5 roles que esta fase crea

| Rol | Persona | Alcance | Qué hace |
|---|---|---|---|
| `user` | Cliente `@edu.utc.mx` | **Plataforma** | Pide, personaliza, paga, recoge. Solo **sus** pedidos (BR-014). |
| `cocina` | Cocinero/a | 1 cooperativa | **Acepta** (`pending→preparing`) y **termina** (`preparing→ready`). Ve qué cocinar. **Sin dinero, sin cliente.** |
| `inventario` | Admin de stock | 1 cooperativa | Materia prima, **costos**, recetas, **ganancia**. |
| `mostrador` | Administración | 1 cooperativa | **Cobra y da cambio**, **caja**, entrega, **reoferta**, **layout CFDI**, registra ganancia. |
| `admin` | Admin del plantel | 1 cooperativa | Superconjunto. Menú, precios, métricas, personal. **Nunca otra cooperativa.** |

**No hay super-admin.** Crear cooperativas y dar de alta administradores se queda en la consola de Keycloak,
fuera de la app. Un rol capaz de leer todas las cooperativas es superficie de ataque que no necesitamos (§46).

**Una persona = un rol.** Keycloak permite arreglos, pero no los usamos: le da **dueño inequívoco al
faltante de caja** (Plan 05).

---

## Fuera de alcance (va en otros planes)

Insumos, recetas y costos → **Plan 04**. Efectivo, caja y CFDI → **Plan 05**. Matar la duplicación de
tipos → **Plan 02**. RLS → **Plan 03** (y **depende de esta fase**: sin `branches` y sin el claim, RLS no
tiene contra qué filtrar).
