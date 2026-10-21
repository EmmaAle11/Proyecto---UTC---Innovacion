# .agents.md — Contexto legítimo para UTC Pick Sazón

> Este fichero es contexto vinculante para cualquier agente que trabaje bajo
> `/home/emmanuel/project - personal/UTC/`. Léelo al iniciar. No sustituye las reglas
> del proyecto (`rules.md` de notes); las resume y añade permisos/operación acordados.
> Última actualización: 2026-10-21.

## 0. Alcance y naturaleza

- Proyecto **UTC Pick Sazón**: app móvil (Expo SDK 56) + backend (NestJS) para pedidos pick-up en cooperativas UTC.
- Es **tesis, un desarrollador, SIN destino de producción**. Se excluyen: producción, staging, CD/deploy, smoke productivo, AWS, release/rollback, ramas de release, permisos de consola. **No son brechas ni pendientes.** CI local/dev y controles de seguridad del entorno actual SÍ aplican.
- Idioma de trabajo: español (usuario en México, CST).

## 1. Estructura de carpetas y repositorios

```
/home/emmanuel/project - personal/UTC/
├── .agents.md                         (este fichero)
├── HRR-*.md                           (reportes de fase; la raíz UTC NO es repo git)
├── PLANTILLA GESTION Y EMPRENDIMIENTO.xlsx  (plan de negocio; define QUÉ debe cumplir la app)
├── UTC - BRAIN/utc-pick-sazon-notes/  (repo notes → github.com/EmmaAle11/utc-pick-sazon-notes)
│   └── superpowers/{priority,plans,specs,audits}/   (reglas, planes, specs, auditorías+evidence)
├── UTC - CODE/Proyecto---UTC---Innovacion/          (repo código → github.com/EmmaAle11/Proyecto---UTC---Innovacion)
│   ├── .github/workflows/ci.yml       (CI; vive en la RAÍZ del repo, no en el subdir)
│   └── UTC-Proyecto/{backend,frontend,infra}/       (el proyecto real)
└── UTC - ASIENTO CONTABLE/asientos-contables/       (app contable Tkinter independiente; sin API)
```

- **GOTCHA CRÍTICO:** la raíz del repo de código es `Proyecto---UTC---Innovacion/`, el código vive en el subdir `UTC-Proyecto/`. GitHub Actions solo lee `.github/workflows/` en la raíz; por eso las rutas del CI van prefijadas con `UTC-Proyecto/`. No mover el workflow al subdir.
- Autor git en ambos repos: `Emmanuel <soporte@iabgp.app>`.

## 2. Permisos

- **Commits, push y deploy los ejecuta EL USUARIO** (regla #16), **salvo orden explícita** del usuario para que el agente los haga. Sin esa orden: dejar los cambios sin commitear y reportar.
- Operaciones irreversibles (borrar, desplegar, escribir en infra) requieren «Go» explícito del usuario.
- No tocar los **artefactos preexistentes** del árbol que no son de la tarea (p. ej. en frontend: `App.tsx`, `src/shared/theme/tokens.ts`, `src/shared/ui/BrandField.tsx`, `src/shared/ui/Chip.tsx`, `tailwind.config.js`). No atribuírselos ni commitearlos sin orden.
- Secretos/tokens: nunca imprimir, loguear ni commitear. `.env*` fuera del repo.
- Preferir construir skills/código propios antes que arriesgar seguridad con terceros.

## 3. Comandos (puertas de calidad — CUMPLIMIENTOS EXIGIDOS I)

Desde `UTC-Proyecto/`:
- Backend (`cd backend`): `npm run lint` · `npm run build` · `npm test -- --runInBand` · `npm run test:cov`
- Frontend (`cd frontend`): `npx tsc --noEmit` · `npx jest --ci` (preset jest-expo; **NO Vitest**, por rules.md)
- Seguridad: `semgrep scan --config p/typescript --error --metrics=off <dirs>` (SAST) · `npm audit --audit-level=high` (SCA) · `npm sbom --sbom-format cyclonedx` (SBOM CycloneDX)
- CI remoto: `.github/workflows/ci.yml` (jobs: backend, frontend, dependencies-and-sbom, sast). Verificar con `gh run list`/`gh run view`.
- Migraciones: `npm run migration:run|revert`. **Una migración aplicada NO se edita: se añade otra.** El lint ignora `src/**/database/migrations/**`.

Estado de puertas (al 2026-10-21): lint 0, build 0, test 151/151, SAST 0, SBOM ok, SCA-backend 0 high/crit. **Único rojo conocido: SCA-frontend** (devDeps de jest-expo, 62 high/1 crit) = **riesgo aceptado** por el usuario (no entra al bundle, sin producción).

## 4. Roles (BR-003)

`user` (cliente) · `cocina` (acepta/termina pedidos) · `inventario` (insumos, costos, recetas, merma) · `mostrador` (cobro, caja, entrega, reoferta) · `admin` (las 3 funciones en su cooperativa).
- El **backend autoriza** (`@Roles` + `RolesGuard`); el frontend solo oculta UI.
- Enum `UserRole` en `backend/src/domain/enums.ts` (los 5 valores ya existen). Columna enum en Postgres.
- `branch_id` llega del **JWT** (claim `branch_id` → `JwtUser.branchId`), **nunca del request**. Un endpoint admin deriva su cooperativa del token, no de `?branchId=`.

## 5. Etiquetas y convenciones de entrega

- **Flujo:** declarar `ReAct` (trabajo corto iterativo: observar→actuar→verificar) o `ReWOO` (auditoría/complejo: plan→ejecución→verificación→reporte).
- **Commits por fase arquitectónica, en orden FSD → Hexagonal → DDD** (frontend capas; backend shared/application/infrastructure/presentation; luego bounded contexts de `modules/`).
- Trailer de commit: `Asistido-por: Hermes (Claude)`. Sin co-autor. Mensajes citan la regla/hallazgo (p. ej. `UTC-M-001, I 0.3`).
- **HRR por fase** en la raíz UTC: `HRR-<fecha>-Fase<N>-<slug>.md`. Plantilla de 9 secciones en el plan maestro.
- Hallazgos con id estable: `UTC-M-NNN` (medición), `UTC-F<N>-NNN` (por fase), `UTC-R-NNN` (reglas). Severidad P0–P5; P0/P1 abierto = BLOQUEADO.

## 6. Arquitectura (vigente, NO se cambia)

- **Backend:** Hexagonal + DDD + Vertical Slice. Contexto = `backend/src/modules/<ctx>/{contracts,domain,application,infrastructure,presentation,tests}`. Dominio puro; application usa puertos; infrastructure/presentation son adaptadores. Keycloak/S3/IA = puertos. Hoy existen `orders`, `products`, `notifications`.
- **Frontend:** FSD. `app → pages → widgets → features → entities → shared` (una capa solo importa de las de abajo). `shared` no importa de `features`; una feature no importa otra.
- **Auth:** Keycloak única autenticación; JWT RS256/JWKS; MFA TOTP admin. Login hoy = ROPC/password grant; migración a PKCE = **PD-10 planificada** (`specs/2026-10-21-PD10-pkce-login-design`), no implementada.

## 7. Rules (prioridad máxima)

- **Evidencia o bloqueo:** declarar un resultado solo con evidencia real (comando+salida, diff, test). Si no se ejecutó: «No ejecutado; no verificado». Nunca fabricar salidas/logs/cifras. Ante error: `BLOQUEADO`, corregir antes de cerrar.
- **Truth states (0.11):** VERIFIED / OBSERVED / INFERRED / UNKNOWN. Una inferencia no se presenta como hecho.
- Un fix/hallazgo no se cierra «por declarado»: necesita test que **caiga al revertir** (mutante). Verificar mutante en cambios de comportamiento/seguridad.
- Entender antes de cambiar: leer archivos afectados y llamadores; corregir la causa compartida, no fixes aislados. YAGNI, DRY (una autoridad por hecho), Zero Trust, validación en servidor, fail-closed, pruebas negativas.
- **4×9 / tablero de votos: NOT_CONFIGURED** en UTC (1 dev, sin revisores independientes). No se simula; las puertas automáticas + revisión del usuario son el control vigente.
- Conflicto de reglas: ADR → regla de negocio (BR) → reglas operativas; manda la más restrictiva. Las reglas DoxIA se adaptan, no se copian (identidades/ramas/agentes/AWS de DoxIA NO aplican a UTC).

## 8. Decisiones del propietario firmadas (F0, 2026-10-21)

- **Comisión escalonada 8/6/4%** acumulada/mes, por tramo como impuestos (1–500=8%, 501–1000=6%, >1000=4%). `specs/2026-10-21-BR-COM-001`.
- **Organización:** `Grupo 1:N Cooperativa`. **Cooperativa = sucursal independiente**; pedidos aislados por cooperativa (estilo McDonald's). El grupo (Grupo UTC, Grupo Lotus) agrupa pero no comparte pedidos.
- **Costeo (F2): FIFO.** **Facturación (F4): solo ticket NO-fiscal + exportación; SIN CFDI/PAC** salvo aprobación.
- **Planes B2B:** Básico ($0) / Almacén ($499) / Gestión Total ($899), por cooperativa. `specs/2026-10-21-BR-PLANES-001`.

## 9. Estado y siguiente paso (al 2026-10-21, fin de jornada)

- Plan maestro: `notes/superpowers/plans/2026-10-21-plan-maestro-cumplimiento-xlsx.md` (fases F0–F7 con HRR por fase).
- **F0 cerrada.** **F1 avanzada:** roles operativos + migración, aislamiento `/orders/all` desde JWT, `@Roles` cocina/mostrador, auditoría con rol y de accesos denegados, prueba negativa de aislamiento, entidad `Cooperativa` (aditiva).
- Código en `origin/main` SHA `c52fab4`; notes en `a477738`. CI verde salvo deps-frontend (riesgo aceptado).
- **Siguiente (próxima sesión):** cablear FK `orders.branch_id → cooperativa.id` con mapa de migración de datos legacy (contar huérfanos/nulos; dual-write; requiere BD real) → luego F2 inventario FIFO. Pendiente infra: verificar claim `branch_id` en Keycloak (UTC-F1-001).
