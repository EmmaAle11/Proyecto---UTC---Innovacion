# Prompt de continuidad — UTC Pick Sazón (post-compactación)

> Pega esto como primer mensaje a una sesión nueva de Claude Code para retomar el
> proyecto sin perder contexto tras compactar memoria.

---

Retomas el proyecto **UTC Pick Sazón** (app de cooperativa/dark-kitchen para tesis; NestJS+TypeORM backend, React Native/Expo frontend, Keycloak, pagos simulados). Trabajas con Emmanuel (dev que aprende; commitea a mano).

## 1. LEE ESTO PRIMERO (obligatorio, en este orden)

1. **`/home/emmanuel/.claude/projects/-home-emmanuel-projects-UTC/memory/MEMORY.md`** — índice de toda la memoria del proyecto (una línea por tema). Es tu mapa; abre los archivos que cite según lo que vayas a tocar.
2. **`/home/emmanuel/projects/UTC/UTC-Proyecto/docs/superpowers/priority/rules.md`** — TODAS las reglas del proyecto (1…46). Foco: §0/§22 (gate de verdad), §23 (commits/push los hace el usuario a mano), §24 (docs vivos), §38 (explicaciones en doble frente: técnico + alegórico), 42–46 (arquitectura: ubicación, análisis, no-carpetas-sin-justificar, no-patrones-por-autoridad, YAGNI de estructura).
3. **`/home/emmanuel/.claude/projects/-home-emmanuel-projects-UTC/memory/hardening-ledger-p0p5.md`** — el estado del loop de auditoría a cero defectos: qué se arregló, qué residuales quedan documentados (D-041/D-042), y que **convergió** (P0–P3 = 0).

Además, para arquitectura: `docs/roadmap/PROMPT_CONTEXTO_ARQUITECTURA.md` (guía Hexagonal+DDD+Vertical Slice+FSD) y `backend/src/modules/README.md` (mapa del backend); ADRs en `docs/arquitectura/decisiones.md`.

## 2. Dónde está el proyecto (2026-07-10)

- **Arquitectura de `orders`:** vertical slice completo, hexagonal-puro (dominio 0 imports de infra). `products` = módulo fino (policy). `auth/settings/payments` = capas clásicas (CRUD/cross-cutting, no ameritan el molde). Ver ADRs D-038…D-040.
- **Hardening a cero defectos: CONVERGIÓ (ronda 4).** P0=P1=P2=P3=0. Solo residuales documentados-diferidos (D-041 denormalizaciones deliberadas; D-042 diferidos-a-prod: multer inalcanzable, aud, email-verify, brute-force, enumeración de registro).
- **Gate actual:** backend `tsc` 0 + **94/94 tests** + migraciones aplicadas en Postgres real; frontend `tsc` 0.
- **Sin commitear:** los cambios de las rondas 3–4 del hardening (el usuario commitea a mano). Confírmalo con `git status` al arrancar.

## 3. Reglas de juego (no las rompas)

- **NO commitees ni pushees** — preparas y propones los comandos; el usuario ejecuta (§23).
- **Gate obligatorio** antes de dar algo por hecho: `tsc` 0 + tests verdes + (si toca BD) verificación real contra Postgres. Nada de maquillar; si falla, se reporta con la salida cruda (§0/§22).
- **Docs vivos** (§24): todo cambio de arquitectura/reglas/decisiones actualiza su doc canónico (decisiones.md estilo ADR, los mapas de `docs/arquitectura/`).
- **Ponytail** (activo): código mínimo que funciona; no reintroducir la deuda que se limpió.
- **Doble frente** (§38): si piden explicar, técnico (código real) + alegórico (analogía que mapea pieza por pieza).
- **Reglas 44/45/46:** no crear carpetas sin justificar las 4 preguntas; no aceptar patrones por autoridad; estructura por umbral (YAGNI).

## 4. Datos operativos

- **Puertos (este equipo):** Postgres **5433**, Keycloak **8082**, backend **3002**.
- **BD:** `docker exec utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB`. Migraciones: `cd backend && npm run migration:run`.
- **Gate:** `cd backend && npx tsc --noEmit && npx jest --silent`; `cd frontend && npx tsc --noEmit`.
- **Frontend:** `frontend/AGENTS.md` exige leer docs de Expo v56 antes de escribir código que use APIs de Expo (no aplica a TS/lógica puro).
- **Re-audit:** los workflows de auditoría multi-lente están en `.claude/.../workflows/scripts/reaudit-*`. Relanza un re-audit SOLO tras introducir cambios nuevos (el baseline está en cero).

## 5. Qué sigue (elige con el usuario)

1. **Commitear** las rondas 3–4 del hardening (comando pendiente en el chat previo).
2. **Frente hacia adelante** del `MASTER_PLAN_8WEEKS_HEXAGONAL.md`: **OWASP L2** (V6/V7/V9/V14) o **panel admin**.
3. **Second brain de Obsidian** (pendiente): requiere que el usuario reconfigure la bóveda UTC en otro puerto + reconecte el MCP `obsidian`.

Arranca leyendo los 3 archivos de la sección 1, confirma el estado con `git status` + un gate rápido, y pregunta al usuario cuál de los frentes tomar. NO asumas trabajo: el hardening ya está en cero.
