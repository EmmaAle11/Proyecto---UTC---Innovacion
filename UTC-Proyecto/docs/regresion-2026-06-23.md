# Regresión multi-agente — UTC Pick Sazón (2026-06-23)

> Workflow `regresion-utc-pick-sazon` (Run `wf_35d2a424-725`): 32 agentes · 5 dimensiones · verificación adversarial. Baseline de herramientas + 25 hallazgos brutos → 19 confirmados → **13 distintos** tras dedup. Conteo: **0 critical · 0 high (código propio) · 1 medium · 10 low · 2 info**.

## Estado — lote recomendado APLICADO (2026-06-23)

**Aplicado y verificado** (frontend `tsc` + backend `build`/`lint`/`test` verdes):
- **[MEDIUM]** JWT valida `azp` (`jwt.strategy.ts`)
- CORS exige `CORS_ORIGIN` cuando `NODE_ENV=production` (`main.ts`)
- `register`: auto-login **no fatal** (`auth.service.ts` devuelve "Cuenta creada" sin tokens; el frontend hace fallback a `/auth/login`)
- `deleteUser` deja traza (`Logger.warn`) ante `!res.ok`/sin red (`keycloak-admin.service.ts`)
- Home filtra `isAvailable` + `status !== 'no_disponible'` (`HomeScreen.tsx`)
- Docs: D-011 (ya validado), nota de enums materializados (§5.0), comentario `\dT+` real
- Triaje `multer`: **no** se hace el downgrade major (code path inalcanzable)

**Diferido al backlog de endurecimiento** (requiere editar el realm + recrear contenedor / re-seed): `redirectUris`/`webOrigins` = `*`, brute-force + `passwordPolicy` del realm. Otros menores: `loginAdmin` decodifica JWT sin verificar firma (anti-patrón sin explotabilidad en el flujo de confianza), `accessibilityLabel` en Pressables solo-icono, `JwtUser.email` opcional, Keycloak `depends_on postgres` cosmético, unificar defaults `.env.example` (`utc_food`) con el nombre real adoptado.

---

## Baseline de herramientas (objetivo) — VERDE
- `frontend tsc --noEmit` → **PASS** (0 errores de tipos)
- `backend npm run build` (nest build) → **PASS**
- `backend npm run lint` (eslint) → **PASS** (0 warnings)
- `backend npm test` (jest) → **PASS** (2 suites / 3 tests)
- `frontend npm audit` → 10 moderate (cadena Expo, dev-only)
- `backend npm audit` → 4 high (multer transitivo vía @nestjs/platform-express; **multer NO se usa** → inalcanzable)

---

## Hallazgos confirmados (13 distintos)

| Sev | Área | Hallazgo | Ubicación |
|---|---|---|---|
| **MEDIUM** | Seguridad | JWT no valida `audience`/`azp` (acepta cualquier token del realm) | `jwt.strategy.ts:30-40` |
| LOW | Seguridad | CORS fail-open si `CORS_ORIGIN` vacío | `main.ts:15-18` |
| LOW | Seguridad | Client `mobile-app` con `redirectUris`/`webOrigins` = `*` | `realm-...json:12-18` |
| LOW | Seguridad | `loginAdmin` decodifica JWT sin verificar firma para leer roles | `keycloak-admin.service.ts:260-270` |
| LOW | Seguridad | Realm sin brute-force ni `passwordPolicy` | `realm-...json` |
| LOW | Backend | `register`: auto-login sin compensación (ventana de fallo parcial) | `auth.service.ts:50-51` |
| LOW | Backend | `deleteUser` ignora HTTP no-OK → huérfanos silenciosos | `keycloak-admin.service.ts:191-200` |
| INFO | Backend | `JwtUser.email` opcional vs perfil `NOT NULL` (riesgo latente) | `jwt.strategy.ts:43-49` |
| LOW | Frontend | Home ignora `isAvailable`/`status` (bug latente al swap a BD) | `HomeScreen.tsx:33-34` |
| LOW | Frontend | Pressables solo-icono sin `accessibilityLabel`/`Role` | varios |
| LOW | Config | `multer` high = ruido (no se usa); NO hacer downgrade major | `backend/package.json:31` |
| INFO | Infra | Keycloak `depends_on postgres` innecesario (usa H2) | `docker-compose.yml:36-38` |
| LOW | Docs | `consultas-sql.md` DB/usuario vs defaults del código (`utc_food`) | `consultas-sql.md:3-5` |
| LOW | Docs | Enums en docs ≠ nombres `<tabla>_<col>_enum` de la migración | `architecture-propuesta.md:118-122` |
| LOW | Docs | D-011 dice "NO VERIFICADO" pero ya se valida `@utc.edu.mx` | `decisiones.md:62` |

## Top de acciones priorizadas
1. **[MEDIUM]** Validar `audience`/`azp` del JWT (`jwt.strategy.ts`) — único medium; control OIDC estándar ausente.
2. **[LOW]** Endurecer CORS para prod (exigir `CORS_ORIGIN` si `NODE_ENV=production`).
3. **[LOW]** Restringir `redirectUris`/`webOrigins` del client `mobile-app` antes de cualquier despliegue.
4. **[LOW]** Hacer no fatal el auto-login de `register` (try/catch → "Cuenta creada" sin tokens).
5. **[LOW]** Loguear `!res.ok` en `deleteUser` (trazar cuentas huérfanas).
6. **[LOW]** Filtrar por `isAvailable`/`status` en Home (swap delgado a `GET /products`).
7. **[LOW]** Documentar triaje de `multer` (no downgrade; `overrides` al salir el patch).
8. **[LOW]** Unificar nombres DB/enums entre docs, defaults del código y `.env.example`.

## Calibración (honesta)
**Cero critical, cero high de código propio.** El "high" de npm audit es transitivo e inalcanzable (no se usa multer). El proyecto está sano: build/lint/test/tipos verdes. Los hallazgos son mayoritariamente **hardening preventivo**, higiene de tipos y consistencia documental — coherente con un MVP UI-first temprano. La única acción a no postergar es la **validación de `audience` del JWT**.


