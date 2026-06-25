# Revisión verificada del reporte LLM (ChatGPT) — UTC Pick Sazón (2026-06-25)

> Un modelo LLM (ChatGPT) levantó un reporte de seguridad/auditoría sobre el proyecto. Este documento es la **verificación** de ese reporte contra el código real (§0 *Evidence or Block*), no una copia de sus afirmaciones. Cada hallazgo se contrastó con `Read`/`grep`/`npm audit` reales y con la regresión previa [`regresion-2026-06-23.md`](regresion-2026-06-23.md).
>
> **Veredicto global:** el reporte es **honesto y exacto**. 0 critical. Los 5 "high" son **un solo frente** (multer transitivo, hoy **inalcanzable**). Todo lo "moderate" es **tooling de desarrollo** (Jest/Expo), sin riesgo de runtime productivo. El grueso es **endurecimiento pre-producción** ya diferido por decisiones. Coincide casi punto por punto con la regresión 2026-06-23.

## Baseline de herramientas (corrido en vivo 2026-06-25)
- `backend npm audit` → **23 vulnerabilidades (18 moderate · 5 high)** — coincide con el reporte.
- `frontend npm audit` → **11 moderate** — coincide con el reporte.
- Los 5 high del backend = `multer` + `@nestjs/platform-express` + `@nestjs/core` + `@nestjs/testing` + `@nestjs/typeorm` → **todos heredan el mismo multer** (no son 5 bugs distintos).
- El `npm audit fix --force` propondría `@nestjs/core@7.5.5` → **downgrade mayor v11→v7** (rompe el proyecto). **NO** ejecutar.

## Triaje verificado (hallazgos del reporte)

| # | Hallazgo (ChatGPT) | Veredicto tras verificar | Estado | Evidencia |
|---|---|---|---|---|
| 1 | multer high vía Nest/Express | **Real pero inalcanzable**: 0 endpoints de upload / `FileInterceptor` en `backend/src`. multer entra solo por `@nestjs/platform-express`; sin `multipart` no se ejecuta. | Ya triado (regresión) | `grep FileInterceptor\|multer backend/src` → 0 |
| 2 | Nest core/platform-express/testing/typeorm high | Cierto, **no son 4 bugs**: heredan el frente de multer. | Ya triado | `npm audit` (árbol) |
| 3 | Keycloak `redirectUris`/`webOrigins` = `["*"]` | Confirmado. Demasiado permisivo para prod. | Backlog prod | `realm-utc-pick-sazon.json:17-18` |
| 4 | Keycloak `start-dev` + sin split dev/prod | Confirmado. Correcto para local; inseguro como base productiva. **Solo existe un compose.** | Backlog prod | `docker-compose.yml:26`; `ls infra/` |
| 5 | Cliente móvil HTTP por defecto | Confirmado **con matiz**: `client.ts` ya soporta https vía `EXPO_PUBLIC_API_URL`/`extra.apiUrl`; el http es el default LAN de desarrollo. Falta **forzar** https en builds no-dev. | Backlog prod | `client.ts:11-20` |
| 6 | js-yaml + cadena Jest/ts-jest (moderate) | Confirmado (parte de los 18 moderate). **Tooling de test, no runtime.** | Dev-only (nuevo) | `npm audit` backend |
| 7 | Expo tooling + uuid vía ngrok (moderate) | Confirmado (11 moderate, todo `@expo/*`). Build/dev. Subir Expo SDK por guía oficial. | Dev-only | `npm audit` frontend |
| 8 | `rolesFromToken` decodifica JWT sin verificar firma | Confirmado **con matiz clave**: el token viene **directo del endpoint de Keycloak** que el backend acaba de pedir (canal de confianza), no de un cliente; las rutas de usuarios sí se validan con firma (JWKS RS256 en `JwtAuthGuard`). **No explotable hoy.** | Ya notado | `keycloak-admin.service.ts:271-281` |
| 9 | `.env` reales locales | Estado **correcto** (gitignored + hook anti-secretos). No es hallazgo. | OK | §17 |
| 10 | `/auth/me` y `/auth/admin-check` | Confirmado: autenticados, no públicos (`admin-check` con `@Roles('admin')`). Decidir si se quedan como diagnóstico. | Menor | `auth-me.controller.ts` |
| 11 | Eliminar `ADMIN_CATEGORIES` | **Código muerto confirmado**: exportado en `admin-mock.ts:57`, **0 importaciones** en todo el front. Limpieza trivial. | Pendiente trivial (nuevo) | `grep ADMIN_CATEGORIES frontend/src` |

## Verificación extra (que el reporte NO incluyó)
- **`typeorm` en `^1.0.0`** (`backend/package.json:42`) llamó la atención frente al conocimiento previo (TypeORM iba en 0.3.x). **Verificado: es el TypeORM legítimo** — `https://registry.npmjs.org/typeorm/-/typeorm-1.0.0.tgz` + integrity sha512 + metadata oficial (typeorm.io, repo `typeorm/typeorm`). TypeORM efectivamente publicó 1.0.0. **No es problema.** (Ejemplo de §0: revisar en vez de asumir.)

## Calibración
**Nada urgente para la demo local.** Lo accionable hoy sin tocar prod es mínimo: el código muerto `ADMIN_CATEGORIES` y documentar el triaje de multer (usar `overrides` cuando salga un patch de Nest 11 compatible). Todo lo demás (wildcards de Keycloak, `start-dev`→`start`+TLS, forzar HTTPS, JWKS en `rolesFromToken`, upgrades controlados de Jest/Expo) es **endurecimiento pre-producción**, coherente con el diferimiento ya registrado en decisiones y en la regresión 2026-06-23.

## Cierre (§19)
- **Validaciones realizadas:** Read de los 6 archivos citados + `package.json`/lockfile; `npm audit` real (backend 23 · frontend 11); grep de `FileInterceptor`/multer (0), `ADMIN_CATEGORIES` (0 usos), compose prod (no existe).
- **Validaciones pendientes:** ninguna para el diagnóstico.
- **Riesgos:** ninguno introducido (revisión read-only, sin cambios de código).
- **Nivel de confianza:** **Alto** — todo con evidencia ejecutada (Read/grep/audit).

> **Decisión de alcance (2026-06-25):** se deja este review **documentado** (sin aplicar cambios) y se continúa con el **turno de datos** (cablear la app a `UTC_PROJECT_DB`). Los ítems de endurecimiento quedan en el backlog pre-prod.
