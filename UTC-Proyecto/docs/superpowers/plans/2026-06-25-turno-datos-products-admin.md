# Turno de datos — Paso 2: Products (escritura admin) · Implementation Plan

> Segundo slice del "turno de datos": cablear el **Menú del admin** (alta/edición, disponibilidad, reoferta) a la BD real. Continúa [`2026-06-25-turno-datos-products.md`](2026-06-25-turno-datos-products.md) (Paso 1, lectura). Cierra con verificación real (§0/§18) + gate de confianza 95–100% con agente de regresión (§22). Git lo ejecuta el usuario (§23).

**Goal:** Que el admin **cree, edite, active/desactive y reoferte** productos contra `UTC_PROJECT_DB` vía `POST /products` y `PATCH /products/:id`, en vez del store mock en memoria. El cliente ya lee `GET /products` (Paso 1); al recargar Inicio verá los cambios del admin.

**Architecture:** Clean (backend) — `CreateProductDto`/`UpdateProductDto` (application, class-validator) → `ProductsService.create/update` (repo TypeORM) → `ProductsController` `@Post`/`@Patch` con **`@Roles('admin')`** (el `RolesGuard` global ya exige el rol; un `user` → 403). FSD (frontend) — `shared/api` (`postJson(token)`+`patchJson`) → `entities/product/admin-api` (fetch/create/update + mapper) → `features/admin/model/catalog.store` (async) → pantallas admin.

**Tech Stack:** NestJS 11 · class-validator (ya instalado; **sin** `@nestjs/mapped-types` → UpdateDto manual) · TypeORM · React Native/Expo · Zustand. Sin libs nuevas (D-012).

## Estado verificado (punto de partida, §0)
- Backend: `ProductsModule` con `GET /products` (Paso 1). `ValidationPipe` global = `whitelist`+`forbidNonWhitelisted`+`transform` (`main.ts`) → **campos extra → 400** (el front debe mandar SOLO los del DTO, sin `id`/`icon`). `RolesGuard` global + `@Roles` ya operan (`auth-me.controller` los usa). Entidad `ProductEntity`: `price`/`reofferPrice` son `numeric` (string en la entidad).
- Frontend admin (mock): `features/admin/model/catalog.store` (`useCatalogStore` admin) con `products: AdminProduct[]` + `toggleAvailable`/`upsert`/`applyReoffer` **en memoria**. Pantallas `pages/admin/menu/{MenuScreen,ProductEditScreen,ReofferScreen}`. `AdminProduct` (admin-mock.ts) tiene todos los campos del esquema + `icon`.
- Token admin: `LoginAdmin` deja `session` con `role:'admin'` + tokens en `useSessionStore` (mismo store que el cliente).

## Global Constraints
- **§0 / §1:** cerrar con `build`/`lint`/`test`/`tsc` + `curl` reales (401 sin token · 403 con token cliente · 201 al crear con admin · 400 en validación). Si no se puede mintar token admin, **reportar ese tramo como NO VERIFICADO** (no inventar).
- **§5/§7/BR-015:** el rol y las validaciones (precio>0, prep>0, stock≥0, `max≥min`, estado∈enum) se exigen **en el backend**, no en el front.
- **FSD/Clean:** `shared` no importa de `features`; el token se pasa por parámetro desde las pantallas (pages).
- **§22:** agente de regresión sobre el diff antes de cerrar (≥95%).
- **§23:** no se commitea; staged + propuesta.

---

### Task 1: Backend — DTOs Create/Update (application)
**Files:**
- Create: `backend/src/application/products/dto/create-product.dto.ts`
- Create: `backend/src/application/products/dto/update-product.dto.ts`

- [ ] **Step 1:** `CreateProductDto` (class-validator, mensajes en español): `name` (1–80), `description?` (≤400), `price` (`@IsNumber {maxDecimalPlaces:2}` + `@Min 0.01`), `category` (1–40), `basePrepTimeSeconds` (`@IsInt @Min 1`), `stock?`/`minStock?` (`@IsInt @Min 0`), `maxStock?` (`@IsInt @Min 0`, admite null por `@IsOptional`), `status` (`@IsEnum ProductStatus`), `isAvailable?` (`@IsBoolean`), `reofferPrice?` (`@IsNumber @Min 0.01`), `imageUrl?` (≤200).
- [ ] **Step 2:** `UpdateProductDto` = los mismos campos **todos `@IsOptional()`** (manual, sin mapped-types).

### Task 2: Backend — `ProductsService.create/update`
**Files:** Modify `backend/src/application/products/products.service.ts`

- [ ] **Step 1:** `create(dto)` → `repo.create({...})` con `price: dto.price.toFixed(2)`, `reofferPrice` `toFixed(2)|null`, `description/imageUrl/maxStock ?? null`, `stock/minStock ?? 0`, `isAvailable ?? true`; `save`. Devuelve la entidad.
- [ ] **Step 2:** `update(id, dto)` → `findOne({where:{id}})`; si no, `NotFoundException`. Asigna solo campos `!== undefined` (price/reofferPrice → string). Tras mezclar, si `maxStock != null && maxStock < minStock` → `BadRequestException`. `save`.

### Task 3: Backend — endpoints en el controller
**Files:** Modify `backend/src/presentation/products/products.controller.ts`

- [ ] **Step 1:** `@Post() @Roles('admin') create(@Body() dto: CreateProductDto)` → `toProductResponse(await service.create(dto))` (201).
- [ ] **Step 2:** `@Patch(':id') @Roles('admin') update(@Param('id') id, @Body() dto: UpdateProductDto)` → `toProductResponse(await service.update(id, dto))`. `GET` sigue igual (ambos roles).
- [ ] **Step 3 (verificación):** `build`+`tsc`+`lint`+`test` verdes.

### Task 4: Frontend — `shared/api` + `entities/product/admin-api`
**Files:**
- Modify: `frontend/src/shared/api/client.ts` (token en `postJson`; nuevo `patchJson`)
- Modify: `frontend/src/entities/product/api.ts` (`export interface ApiProduct` para reusar)
- Create: `frontend/src/entities/product/admin-api.ts`

- [ ] **Step 1:** `postJson<T>(path, body, token?)` adjunta `Authorization: Bearer` si hay token (compatible con auth público). `patchJson<T>(path, body, token?)` análogo.
- [ ] **Step 2:** `admin-api`: `ApiProduct → AdminProduct` (todos los campos + `icon` derivado); `fetchAdminProducts(token)` (`GET /products`), `createProduct(payload, token)` (`POST`), `updateProduct(id, patch, token)` (`PATCH`). `ProductWritePayload` = solo campos del DTO (sin `id`/`icon`).

### Task 5: Frontend — `catalog.store` admin async
**Files:** Modify `frontend/src/features/admin/model/catalog.store.ts`

- [ ] **Step 1:** estado `products`/`loading`/`loaded`; `load(token)` (fetchAdminProducts → fallback `ADMIN_PRODUCTS` + warn). `create(payload, token)` (append el devuelto), `update(id, patch, token)` (reemplaza el devuelto).
- [ ] **Step 2:** `toggleAvailable(id, token)` **optimista**: voltea local, llama `updateProduct(id,{isAvailable})`, revierte en error. `applyReoffer(id, price, status, token)` → `update`.

### Task 6: Frontend — pantallas admin async
**Files:** Modify `MenuScreen.tsx`, `ProductEditScreen.tsx`, `ReofferScreen.tsx`

- [ ] **Step 1 (Menu):** `useEffect` carga `load(token)` al montar; spinner si `loading`; `toggleAvailable(id, token)`. Token de `useSessionStore`.
- [ ] **Step 2 (Edit):** `onSave` async: arma `ProductWritePayload` (sin id/icon); editar → `update(id, payload, token)`, alta → `create(payload, token)`; estado "Guardando…" + alerta en error; `goBack` en éxito.
- [ ] **Step 3 (Reoffer):** `onApply` async → `applyReoffer(id, newPrice, status, token)`; "Aplicando…" + error; `goBack`.
- [ ] **Step 4 (verificación):** `tsc` + `expo export` android OK.

### Task 7: Verificación integral + cierre (§0/§18/§22)
- [ ] Backend `build`/`lint`/`test`/`tsc`; frontend `tsc` + bundle.
- [ ] **Matriz curl:** `POST /products` sin token→401 · con token **cliente**→403 · `POST` con token **admin**→201 (GET lo refleja) · `POST` con `price:0`/estado inválido/campo extra→400 · `PATCH` admin cambia precio→GET refleja. *(Token admin: si MFA/asignación de rol lo impiden, marcar 201/400 como NO VERIFICADO y dejar 401/403 + estático + regresión.)*
- [ ] **Agente de regresión** sobre el diff (bugs/contrato/FSD/Clean/seguridad). Confianza ≥95%.
- [ ] DoD (§19): Observaciones · Riesgos · Validaciones · Pendientes · Supuestos · Confianza.

---

## Fuera de alcance / notas
- **Sin borrado:** no hay `DELETE /products` (el admin desactiva con `isAvailable`/`no_disponible`); se difiere.
- **Imágenes:** el alta no sube imagen (`imageUrl` queda null → ícono derivado); subir/servir assets es posterior.
- **Sincronización entre stores:** admin y cliente son stores separados; el cliente refleja cambios del admin al **recargar Inicio** (re-fetch en mount). La sync en vivo entre dispositivos es del Paso 4 (orders, D-021).
- **Concurrencia/optimistic:** `toggleAvailable` revierte en error; el resto recarga/reemplaza con la respuesta del backend (fuente de verdad).
