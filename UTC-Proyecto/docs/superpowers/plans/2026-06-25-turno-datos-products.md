# Turno de datos — Paso 1: Products (lectura) · Implementation Plan

> Primer slice del "turno de datos": cablear el **catálogo** del mock a la BD real. Pasos con checkbox (`- [ ]`). Cierra con verificación real (rules §0/§18) y gate de confianza 95–100% validado con un agente de regresión (rules §22). Git lo ejecuta el usuario (rules §23).

**Goal:** Que el catálogo del cliente (Home) deje de leer el mock y lea **`GET /products` real** contra `UTC_PROJECT_DB` (los 10 productos sembrados). Establece el **patrón** (entity → service → controller → api client → pantalla) que reusarán pedidos/transiciones (pasos 3–4). El admin (Menú) se cablea en el Paso 2.

**Architecture:** Clean (backend) — `ProductEntity` (infrastructure, ya existe) → `ProductsService` (application, repo TypeORM) → `ProductsController` (presentation, `GET /products`). FSD (frontend) — `shared/api` (`getJson`) → `entities/product/api` (`fetchProducts` + mapper) → `pages/home` (consume con loading/fallback). El backend es la fuente de verdad (BR-015): devuelve los campos persistidos; el `icon`/`readySinceMin` son **display** y los deriva el front.

**Tech Stack:** NestJS 11 · TypeORM (`@nestjs/typeorm` `forFeature`) · React Native / Expo · Zustand (sesión). Sin libs nuevas (D-012).

## Estado verificado (punto de partida, rules §0)
- Backend: existen las **6 entidades** + migración aplicada; **solo** hay módulos `auth` + `health` (no hay `products`). Guards globales `JwtAuthGuard`+`RolesGuard` → todo endpoint nace protegido salvo `@Public()` (verificado en `app.module.ts`).
- `ProductEntity` mapea columnas snake_case → props camelCase; `price`/`reofferPrice` son `string` (numeric), `status` enum `ProductStatus`.
- Frontend: Home lee `PRODUCTS` del mock (`entities/product/mock.ts`) y filtra `isAvailable && status !== 'no_disponible'` (`HomeScreen.tsx:37`). El tipo `Product` (`entities/product/model/types.ts`) **ya está modelado con los nombres del esquema** para un swap delgado.
- `shared/api/client.ts` solo tiene `postJson` (sin header de auth). La sesión (`features/auth/model/session.store.ts`) guarda `accessToken`.
- **Mismatch detectado:** las categorías del mock (`Quesadillas`, `Hamburguesas`, `Aguas frescas`…) **no** coinciden con las de la BD demo (`Antojitos`, `Combos`, `Bebidas`, `Snacks`, `Postres`). → Las chips de categoría se **derivan de los datos**, no de una lista fija.

## Global Constraints
- **EVIDENCE OR BLOCK (§0) / FAIL-CLOSED (§1):** cerrar con `build`/`lint`/`test`/`tsc` reales + `curl GET /products` con JWT real devolviendo los 10 productos. Si la pila no se puede levantar, reportar el curl como **NO VERIFICADO** (no inventar).
- **Clean (§4) / FSD (§3):** `application` sin detalles de transporte; `shared` no importa de `features` (el token lo pasa la página).
- **Backend = fuente de verdad (§5, §15, BR-015):** el front no decide disponibilidad; muestra lo que el endpoint da.
- **Confianza ≥95% (§22):** agente de regresión sobre el área antes de cerrar.
- **Git (§23):** no se commitea; se deja staged y se propone.

---

### Task 1: Backend — `ProductsService` (application)

**Files:**
- Create: `backend/src/application/products/products.service.ts`

- [ ] **Step 1:** `@Injectable ProductsService` con `@InjectRepository(ProductEntity)`. Método `findAll(): Promise<ProductEntity[]>` → `find({ order: { category: 'ASC', name: 'ASC' } })`.
- [ ] **Step 2 (verificación):** compila con el módulo (Task 3).

### Task 2: Backend — contrato de respuesta + mapper

**Files:**
- Create: `backend/src/application/products/dto/product-response.ts` (interface `ProductResponse` + `toProductResponse(entity)`).

- [ ] **Step 1:** `ProductResponse` = `{ id, name, description, price:number, category, imageUrl, basePrepTimeSeconds, stock, minStock, maxStock, status, isAvailable, reofferPrice:number|null }`. El mapper convierte `price`/`reofferPrice` `string→number` (`Number(...)`), `description`/`imageUrl` `null→null`.
- [ ] **Step 2:** decisión de contrato: se devuelven números para precio (el front `Product.price` es `number`).

### Task 3: Backend — `ProductsController` + `ProductsModule` + registro

**Files:**
- Create: `backend/src/presentation/products/products.controller.ts` (`@Controller('products')`, `GET /` → `findAll` mapeado). **Autenticado** (guard global; ambos roles, sin `@Roles`).
- Create: `backend/src/presentation/products/products.module.ts` (`TypeOrmModule.forFeature([ProductEntity])`, provider `ProductsService`, controller).
- Modify: `backend/src/app.module.ts` (importar `ProductsModule`).

- [ ] **Step 1:** controller `GET /products` → `(await service.findAll()).map(toProductResponse)`.
- [ ] **Step 2:** módulo con `forFeature([ProductEntity])`; registrar en `app.module`.
- [ ] **Step 3 (verificación):** `npm run build` + `npx tsc --noEmit` + `npm run lint` + `npm test` → verdes.
- [ ] **Step 4 (verificación runtime §0):** levantar pila (docker + migración + seed + `start:dev`), obtener JWT (`/auth/register` o `/auth/login`), `curl -H "Authorization: Bearer <t>" :3001/products` → **10 productos**; sin token → **401**.

### Task 4: Frontend — `getJson` con auth (shared)

**Files:**
- Modify: `frontend/src/shared/api/client.ts`

- [ ] **Step 1:** `getJson<T>(path, token?)` — `fetch` GET con `Authorization: Bearer ${token}` si hay token, mismo manejo de timeout/errores que `postJson` (reusa `ApiError`).
- [ ] **Step 2:** sin importar `features` (FSD): el token entra por parámetro.

### Task 5: Frontend — `fetchProducts` + mapper (entities)

**Files:**
- Create: `frontend/src/entities/product/api.ts` (`fetchProducts(token?): Promise<Product[]>`)
- Modify (si hace falta): `frontend/src/entities/product/icons.ts` (helper `iconForProduct(name, category)` → `ProductIconName` por palabra clave).

- [ ] **Step 1:** `fetchProducts` llama `getJson<ApiProduct[]>('/products', token)` y mapea `ApiProduct → Product`: copia campos del esquema; deriva `icon` (por nombre/categoría), `readySinceMin: null`, `popular` omitido. `price` ya viene number.
- [ ] **Step 2:** tipo `ApiProduct` que refleja `ProductResponse` del backend.

### Task 6: Frontend — Home consume el API (pages)

**Files:**
- Modify: `frontend/src/pages/home/HomeScreen.tsx`

- [ ] **Step 1:** estado `products`/`loading`; `useEffect` carga `fetchProducts(useSessionStore.getState().session?.accessToken)`. Spinner mientras carga (ya importa `ActivityIndicator`).
- [ ] **Step 2:** derivar las chips de categoría de los datos (`['Todo', ...unique(categorías)]`) en vez de la lista fija del mock (resuelve el mismatch).
- [ ] **Step 3 (red de seguridad, no rompe demo):** on error → fallback al mock `PRODUCTS` + `console.warn` (temporal; se retira al estabilizar). Documentado como supuesto.
- [ ] **Step 4 (verificación):** `npx tsc --noEmit` + `expo export`/bundle Metro OK. (Visual en Expo Go: el rail y el feed muestran datos reales — pendiente de dispositivo, ver memoria de "correr en este equipo".)

### Task 7: Verificación integral + cierre (§0, §18, §22)

- [ ] Backend `build`+`lint`+`test`+`tsc` verdes; `curl` matriz (con/sin token).
- [ ] Frontend `tsc` + bundle.
- [ ] **Agente de regresión** sobre el diff (§22): bugs/contrato/FSD/Clean; calcular confianza real.
- [ ] DoD (§19): Observaciones · Riesgos · Validaciones realizadas · Pendientes · Supuestos · Confianza (≥95%). **No commit** — dejar staged y proponer.

---

## Fuera de alcance / notas
- **Admin Menú (Paso 2):** `MenuScreen`/`catalog.store` siguen en mock; usan `AdminProduct` (otro shape) y además escriben (CRUD) → va en el Paso 2 junto con `POST/PATCH /products`.
- **`readySinceMin` / "Listos ahora":** hoy se deriva display-only (`null`); el cálculo real (desde `ready_at` de pedidos) llega con el módulo de orders (Paso 3–4).
- **Imágenes:** el front sigue usando `productImage(id)` (assets locales); `image_url` del backend se cablea cuando haya assets servidos.
- **Token plumbing:** se establece `getJson(token)`; el refresh con `expires_in` y `expo-secure-store` siguen diferidos (backlog).
- **Fallback a mock:** red de seguridad para la demo; **no** enmascara el contrato (se loguea). Quitar al estabilizar.
