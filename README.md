# UTC Pick Sazón

> **Pide fácil, recoge con sabor.**
> Aplicación de cooperativa universitaria / *dark kitchen* escolar (UTC), modalidad **Pick Up** (sin envíos).

Repositorio: `EmmaAle11/Proyecto---UTC---Innovacion` (privado). Proyecto de tesis desarrollado
sobre un framework que genera una aplicación, para resolver un problema real de la cooperativa
de la universidad.

---

## 1. El problema y la solución

El proyecto nace de un **círculo de innovación** con dos vueltas (ver
`UTC-Proyecto/docs/propuesta/algoritmo-circulo-innovacion.md`):

### Primera vuelta (2026-06) — "hay que matar la fila"
El problema original: **congestión en la ventanilla** de la cooperativa a la hora pico
(~1000 pedidos/día concentrados en 10–15 min). La solución:

- App móvil para **pedir desde el celular** y recoger en tienda (Pick Up, sin repartidores).
- **Número de pedido secuencial** (`U-00001`) que sirve de código de recogida: no te acercas
  a la ventanilla antes de tiempo.
- **Semáforo de congestión** en vivo (verde <5, amarillo 5–10, rojo >10 pedidos en cola).
- **Pedido programado** a hora fija.
- **Tiempos de espera** por producto y notificaciones locales de cambio de estado.
- **Multi-sucursal por geolocalización** (evita "pedir en la cooperativa A y que responda la B").

### Segunda vuelta (2026-07) — "¿y la cooperativa gana o no gana?"
Al ver la operación real surgió la pregunta incómoda: la fila ya está ordenada, **pero
¿la cooperativa gana dinero y quién responde por cada peso?** De ahí un alcance ampliado
(mayormente en diseño, ver fase abajo):

- **Roles de cooperativa** (la operan tres personas, no una): `cocina`, `inventario`, `mostrador`
  además de `user` y `admin` — cada quien ve solo lo suyo.
- **Motor de costeo**: inventario con costo real de insumos → cuánto cuesta cada platillo y
  **cuánto se gana** (vender ≠ ganar).
- **Producto terminado, reoferta y merma**: la comida ya hecha es un objeto con caducidad, no
  un contador; lo no recogido se reoferta con precio propio y lo vencido se da de baja (merma).
- **Efectivo, caja y CFDI**: el cliente anticipa con cuánto paga (cambio listo), la caja cuadra
  al final del día y se puede facturar.
- **Disponibilidad automática**: si se acaba un insumo, el platillo desaparece solo del menú.

---

## 2. Estado / fase actual del proyecto

**El repositorio combina documentación de gobierno/arquitectura extensa con código funcional.**
La distribución de esfuerzo, siendo honestos con los commits reales:

| Frente | Estado |
|---|---|
| **Documentación de gobierno / arquitectura / planes** | Muy madura y detallada (el grueso del repo). |
| **MVP primera vuelta (código)** | Implementado y funcional: pedidos, estados, stock, semáforo, pedido programado, geolocalización, auth Keycloak + refresh, pagos simulados, notificaciones outbox. |
| **Arquitectura backend (Hexagonal + DDD + Vertical Slice)** | Migración **cerrada** (D-038…D-046). |
| **Segunda vuelta (roles, costeo, caja, CFDI, RLS)** | Mayormente **diseño/planeación** (Planes 01–06); `0` líneas de código en varios frentes. |
| **Producto terminado / reoferta / merma (Planes 07–08)** | Parcialmente implementado (ver detalle abajo). |

Tamaño del código a hoy: backend ~**5 600 líneas** (96 archivos `.ts` + 13 de test, 13 migraciones
TypeORM); frontend ~**6 900 líneas** (74 archivos). Backend con **~127 tests** verdes según el
CHANGELOG.

**Frentes en curso (Planes 07–08, sobre reoferta e inventario):**
- **Plan 07** — CERRADO: se reserva stock *antes* de cobrar (revierte el bug de "cobrar sin reservar").
- **Plan 08 F1–F3** — CERRADO: se rompió el "bucle infinito de reoferta" con las tablas
  `finished_goods` (unidad hecha, con `expires_at`) y `stock_movements` (merma).
- **Pendiente**: Plan 08 F2b (compra de rescate por unidad + retirar `product.reofferPrice`),
  F4/F5 (disponibilidad + frontend).

**Brechas conocidas y documentadas honestamente** (no ocultas):
- En código solo existen los roles `user` y `admin`; `cocina`/`inventario`/`mostrador` están
  **diseñados pero sin implementar** (Plan 01). Hasta entonces la autorización por sucursal
  (`branch_id`) toma el dato del request, no del token (brecha BR-016 abierta).
- **No existe tabla `branches`**: las sucursales son un array *hardcoded* en el frontend
  (`frontend/src/entities/branch/branches.ts`) y `orders.branch_id` es texto suelto sin FK.
- `app_settings` es una fila **única global**, no por sucursal (se vuelve por-cooperativa en el Plan 01).

> Los pagos son **simulados** (formato de tarjeta, sin Luhn ni pasarela real) — a propósito y
> declarado, por ser proyecto de tesis. La distribución de prueba es un **APK Android** (Expo/EAS);
> Expo Go corre el flujo en iOS pero sin notificaciones del SO.

---

## 3. Stack tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Expo SDK **56** · React Native 0.85 · React 19 · TypeScript · NativeWind (Tailwind) · Zustand · React Navigation · arquitectura **FSD** (Feature-Sliced Design) |
| **Backend** | NestJS **11** · TypeORM · arquitectura **Hexagonal + DDD + Vertical Slice** |
| **Base de datos** | PostgreSQL **16** (migraciones explícitas, `synchronize: false`, CHECK constraints) |
| **Autenticación** | Keycloak **26** local · JWT RS256 (JWKS) · MFA TOTP para admin |
| **Infraestructura** | Docker Compose (Postgres + Keycloak) |
| **Seguridad** | Helmet, throttling, audit log — alineado a **OWASP ASVS L2** |

---

## 4. Estructura del repositorio

```
.
├── PROYECTO UTC Pick Sazón .pdf     # Propuesta formal (documento de tesis)
├── .gitignore                       # Regla de oro: nunca commitear secretos ni node_modules
└── UTC-Proyecto/
    ├── backend/                     # API NestJS (Hexagonal + DDD + Vertical Slice)
    │   └── src/
    │       ├── kernel/domain/       # Abstracciones puras (Entity, AggregateRoot, ValueObject…)
    │       ├── modules/             # Vertical slices: orders (DDD completo), notifications, products
    │       ├── application/         # Capas clásicas: auth, settings, payments (deliberado, regla 46)
    │       ├── infrastructure/      # Entidades TypeORM, migraciones, adapters Keycloak
    │       ├── presentation/        # Controllers/módulos clásicos
    │       └── shared/              # Cross-cutting: events, logging, resilience
    ├── frontend/                    # App Expo / React Native (FSD)
    │   └── src/                     # app · pages · widgets · features · entities · shared
    ├── infra/                       # Docker Compose, Postgres init/seed, realm Keycloak
    ├── brand/                       # Identidad visual (logos)
    ├── .claude/
    │   ├── Architecture.md          # ★ Manual de arquitectura (índice maestro)
    │   └── REFACTORING_PLAN_DDD.md
    └── docs/                        # ★ Gobierno, arquitectura, propuesta, planes
        ├── propuesta/               # El problema y el alcance (círculo de innovación, SCAMPER)
        ├── arquitectura/           # ADRs, bounded contexts, reglas de dependencia, code-map
        ├── roadmap/                 # Plan maestro de 8 semanas
        ├── superpowers/            # Specs y planes de ejecución (incluye Planes 01–08)
        ├── OWASP/                   # Análisis ASVS L2 + threat model (STRIDE)
        ├── datos/                   # SQL, datos demo, recetas e insumos
        ├── Read/                    # Runbooks: levantar el proyecto, demo dos teléfonos
        └── historico/              # Regresiones y revisiones pasadas
```

---

## 5. Cómo navegar la documentación

El repo tiene una jerarquía de "verdad viva": ante conflicto gana **ADR → regla de negocio (BR) → regla operativa**.
Rutas relativas a `UTC-Proyecto/`:

1. **Empieza por el problema y el alcance:**
   `docs/propuesta/algoritmo-circulo-innovacion.md` (las dos vueltas de innovación) y
   `docs/propuesta/Algoritmo-ejecucion.md` (cómo se ejecuta).
2. **Reglas del proyecto (gobierno):** `docs/superpowers/priority/rules.md` — reglas operativas,
   de negocio (BR-001…BR-016) y de arquitectura, muy compactas.
3. **Arquitectura:** `.claude/Architecture.md` es el **índice maestro** (visión, capas, flujos,
   modelo de datos, invariantes, diagramas Mermaid). Los mapas de detalle viven en
   `docs/arquitectura/`: `decisiones.md` (ADRs D-0xx), `bounded-contexts.md`,
   `dependency-rules.md`, `decision-matrix.md`, `code-map.md`.
4. **Historial de cambios:** `docs/superpowers/priority/CHANGELOG.md` (con evidencia por cambio).
5. **Planes de ejecución:** `docs/superpowers/plans/` y `docs/superpowers/specs/` — un plan por
   frente, numerados 01–08 en la segunda vuelta.
6. **Seguridad:** `docs/OWASP/` (análisis ASVS L2, recomendaciones, threat model STRIDE).

Términos recurrentes en la documentación:
- **"Ciclo de 2 relojes"** — el ciclo de vida de un `finished_good` (producto terminado) se rige por
  dos relojes vía `FinishedGoodLifecyclePort`: (1) el **cierre de la cooperativa** de ese día (deja de
  venderse) y (2) un **tope duro** (`producedAt` + N horas → merma automática). El humano decide; el
  reloj es la red de seguridad. Ver `docs/superpowers/plans/2026-07-15-08-finished-goods-reoferta-y-merma.md`.
- **"SCAMPER"** — técnica de ideación aplicada al alcance (`docs/propuesta/SCAMPER.md`).
- **"Producto terminado §2.5" / D-052** — la decisión de tratar la comida hecha como objeto con
  caducidad (`.claude/Architecture.md` §2.5).

---

## 6. Arquitectura backend (resumen)

Un solo stack coherente donde cada dimensión la resuelve una arquitectura distinta:

- **Vertical Slice** → *cómo organizo el código*: por módulo de negocio (`modules/orders/`), no por
  capa técnica global. Cada módulo lleva junto `contracts/`, `domain/`, `application/`,
  `infrastructure/`, `presentation/` y `tests/`.
- **DDD** → *dónde vive la lógica*: en agregados ricos (`Order`), value objects, domain events.
- **Hexagonal (Ports & Adapters)** → *cómo aíslo la tecnología*: el dominio define puertos, la
  infraestructura los implementa. Cambiar Keycloak → AZURE = un adapter nuevo, dominio intacto.

Regla mental que lo une todo: **si borro `infrastructure/` de un módulo, su `domain/` debe seguir compilando.**

Hoy `orders` es un slice DDD táctico completo, `notifications` es un slice fino (outbox de eventos) y
`products` es un slice pragmático; `auth`/`settings`/`payments` se conservan en capas clásicas a
propósito (regla 46: CRUD/cross-cutting que no amerita el molde completo).

---

## 7. Cómo levantar el proyecto

Requisitos: **Docker** corriendo + **Node 20**. Puertos de este equipo: Postgres `5433`,
Keycloak `8082`, backend `3002`. Guía completa: `UTC-Proyecto/docs/Read/levantar-proyecto.md`.

```bash
# 1) INFRA — Postgres + Keycloak
cd UTC-Proyecto/infra
docker compose up -d          # levanta Postgres + Keycloak
docker compose ps             # esperar a que ambos estén "healthy"

# 2) BACKEND — NestJS (:3002)   [primera vez: instalar deps + migrar + sembrar]
cd ../backend
npm install
npm run migration:run
docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB < ../infra/postgres/seed-demo.sql
npm run start:dev

# 3) FRONTEND — Expo
cd ../frontend
npm install
npx expo start                # "w" = navegador · QR = Expo Go (mismo WiFi)
```

Los `.env` **no** viajan en git (solo los `*.env.example`); créalos a partir del ejemplo. Para teléfono
en otra red y para el APK con notificaciones, ver la guía de túnel (cloudflared / EAS) en el runbook.

---

## 8. Equipo

Según `docs/arquitectura/code-map.md` (prefijos obligatorios en commits/PR):

| Área | Integrante | Prefijo | Zona |
|---|---|---|---|
| DEV | Emmanuel Alejandre Valeriano | `[DEV-EMMA]` | Arquitectura, integración, backend transversal, docs |
| DEV | Miguel Angel Pineda Salazar | `[DEV-MIGUEL]` | Backend de dominio, persistencia, pruebas, migraciones |
| DEV | Uriel Dario | `[DEV-URIEL]` | Frontend FSD, integración API, pruebas de interfaz |
| DEV | Juan | `[DEV-JUAN]` | Infraestructura, Keycloak, Docker, seguridad |
| DESIGN | Natalia Santos Trejo | `[DES-NATALIA]` | Identidad visual, UX/UI, accesibilidad, assets |

Los commits, merges y pushes los ejecuta el usuario a mano (regla de git); nunca se commiten secretos.

---

## 9. Próximos pasos (según los planes)

Del roadmap (`docs/roadmap/MASTER_PLAN_8WEEKS_HEXAGONAL.md`, deadline 2026-09-07) y de los planes de la
segunda vuelta:

1. **Cerrar Plan 08** — bug 2 (reoferta por unidad, retirar `product.reofferPrice`) + disponibilidad + frontend.
2. **Plan 01** — roles de cooperativa (`cocina`/`inventario`/`mostrador`) con `branch_id` desde el JWT;
   crear tabla `branches` (cierra la brecha BR-016) y `app_settings` por sucursal.
3. **Planes 02–06** — SSOT, RLS (aislamiento por cooperativa), motor de costeo, efectivo/caja/CFDI,
   panel de receta por alimento.
4. **Admin panel web** (React + Vite + Recharts): dashboard, reportes, facturación.
5. **Cierre**: tests E2E + regresión, auditoría OWASP ASVS L2, documentación y runbook de defensa.

---

## Notas del repositorio

- **Ramas:** `main` y `integration/emmaale11-main` apuntan actualmente al **mismo commit** (`b51bfcc`);
  no hay divergencia entre ellas. Existe un único *worktree* (la raíz del repo).
- El directorio de trabajo está limpio; el árbol vive bajo `UTC-Proyecto/`.
- Este README describe el estado a **2026-08-16**.
</content>
</invoke>
