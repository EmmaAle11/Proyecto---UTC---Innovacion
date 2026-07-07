# Master Plan 8 Semanas — UTC Pick Sazón MVP Tesis (HEXAGONAL)

**Arquitectura:** Hexagonal Architecture (Ports & Adapters) — preparado para AZURE cuando sea aprobado.

**Equipo:**
- **Emmanuel Alejandre** — 1 dev full-stack, 4h/día (Lun-Vie) + fin de semana si es necesario
- **Claude** — Asistente código
- **Natalia Santos** — Diseño paralelo (assets on-demand)

**Presupuesto:** 160 horas totales (8 semanas × 5 días × 4h)

**Deadline:** 2026-09-07

---

## Por qué Hexagonal (No solo Clean)

### Problema AZURE
```
"Vamos a conectar AZURE para cuentas y noreply@utc-pick-sazon.app"
"(Pero solo si la app es aprobada)"
```

### Solución Hexagonal
```
┌─────────────────────────────────────┐
│        DOMAIN CORE (PURO)           │
│  Order, Product, UserProfile        │
│  (SIN referencias a tech/infra)     │
└─────────────────────────────────────┘
         ↑ Puertos (interfaces)  ↑
         │                        │
    ┌────────────────────────────────┐
    │      ADAPTERS (Intercambiables)│
    ├────────────────────────────────┤
    │ ✅ EmailAdapter                │
    │   - Impl: Keycloak (HOY)       │
    │   - Impl: AZURE (cuando aprob.)│
    │   - Impl: SendGrid (fallback)  │
    │                                │
    │ ✅ UserRepositoryAdapter       │
    │   - Impl: Keycloak            │
    │   - Impl: AZURE AD (cuando..) │
    │                                │
    │ ✅ PaymentAdapter              │
    │   - Impl: Mock (HOY)           │
    │   - Impl: Stripe (producción)  │
    └────────────────────────────────┘
```

**Beneficio:** Si AZURE se aprueba, **cambias 1 adapter (1 archivo), core sin tocar.**

---

## Arquitectura (Hexagonal + DDD + Vertical Slice + CQRS ligero)

> Fuente de verdad: `docs/roadmap/PROMPT_CONTEXTO_ARQUITECTURA.md` (PARTE IV.A) +
> `docs/arquitectura/decisiones.md` (D-038). Layout **VERTICAL SLICE**: el código se
> organiza por **módulo de negocio** (`modules/orders/`), NO por capa técnica global.
> Cada módulo es un mini-sistema autónomo y copiable con TODO junto
> (contracts, domain, application, infrastructure, presentation, tests).

Así se ve un módulo **completamente crecido**. NO se crea así de golpe: las
sub-carpetas marcadas `⌁` **nacen por umbral** (regla 46). Hoy se arranca mínimo.

```
backend/src/
│
├── kernel/                                  # abstracciones de dominio PURAS (una sola vez)
│   └── domain/
│       ├── Entity.ts                         # identidad por id
│       ├── AggregateRoot.ts                  # raíz + acumula domain events
│       ├── ValueObject.ts                    # ⌁ nace con la 1ª VO (Money/Email)
│       ├── DomainEvent.ts                    # "algo pasó" (nombre en pasado)
│       ├── DomainError.ts                    # ÚNICA estrategia de error (D-039)
│       └── UseCase.ts                        # interfaz execute(input): output
│                                             #  ⚠ el kernel NO tiene ports
│
├── modules/                                 # VERTICAL SLICE: un módulo = un bounded context
│   │
│   ├── orders/                              # ← módulo autónomo (PILOTO — D-040)
│   │   ├── contracts/                        # DTOs públicos del módulo (request/response/dto)
│   │   │   ├── create-order.request.ts
│   │   │   ├── create-order.response.ts
│   │   │   └── order.dto.ts
│   │   ├── domain/                           # NÚCLEO puro (sin Nest, sin TypeORM)
│   │   │   ├── entities/
│   │   │   │   ├── Order.ts                   # AGREGADO raíz: mueve estados + reglas + stock D-037
│   │   │   │   └── OrderItem.ts               # entidad hija / value object
│   │   │   ├── value-objects/                 # ⌁ Money, OrderNumber, BranchId
│   │   │   ├── services/                      # ⌁ OrderDomainService (lógica que cruza agregados)
│   │   │   ├── events/
│   │   │   │   ├── OrderCancelled.ts
│   │   │   │   └── OrderReady.ts
│   │   │   └── ports/                         # PUERTOS (interfaces) — hablan tipos de DOMINIO
│   │   │       ├── order.repository.port.ts   #   (aquí viven los ports, NO en kernel/ ni shared/)
│   │   │       └── payment.gateway.port.ts
│   │   ├── application/                       # ORQUESTACIÓN — casos de uso PLANOS
│   │   │   ├── create-order.use-case.ts       #   (⌁ commands/ + queries/ solo a ~20 casos)
│   │   │   ├── cancel-order.use-case.ts       #    SIN Mediator/bus (CQRS ligero)
│   │   │   └── get-order.use-case.ts
│   │   ├── infrastructure/                    # ADAPTERS (implementan los puertos)
│   │   │   ├── persistence/
│   │   │   │   ├── order.repository.ts         # impl TypeORM del puerto
│   │   │   │   └── order.mapper.ts             # Order (dominio) ⇄ OrderEntity (TypeORM)
│   │   │   ├── external/                       # ⌁ stripe/keycloak/azure adapters del módulo
│   │   │   ├── messaging/                      # ⌁ nace con RabbitMQ/AZURE Queue real
│   │   │   └── cache/                          # ⌁ nace con Redis real
│   │   ├── presentation/                      # HTTP (NestJS) — PLANO al inicio
│   │   │   ├── orders.controller.ts            #   (⌁ controllers/ guards/ pipes/ filters/
│   │   │   ├── orders.module.ts                #    solo cuando haya VARIOS de un tipo)
│   │   │   └── order.guard.ts
│   │   └── tests/
│   │       ├── unit/                           # test del agregado, VOs, casos de uso
│   │       ├── integration/                    # e2e del módulo contra BD real
│   │       └── contract/                       # ⌁ cuando exista contrato público
│   │
│   ├── products/                             # mismo molde, MÁS CHATO (casi CRUD)
│   ├── users/                                # (user-profile)
│   ├── settings/                             # umbrales semáforo/sucursal/horario
│   ├── auth/                                 # Keycloak adapter, JWT, roles, MFA (external/)
│   └── notifications/                        # push local; escucha eventos de orders
│
└── shared/                                  # CASI INEXISTENTE (regla 44/46)
                                             #  lo de un módulo va al módulo; lo base va al kernel
```

> `⌁` = **NO existe hoy**; nace por umbral, nunca antes (regla 46).

**Clave:** el dominio de cada módulo es puro, `application/` orquesta con casos de uso
planos, `infrastructure/` es intercambiable (adapters detrás de puertos). Los adapters de
email/auth/pago del módulo viven en `modules/<x>/infrastructure/external/`, NO en un
`infrastructure/email/` global. Regla mental (Hexagonal): **si borro `infrastructure/` de
un módulo, su `domain/` debe seguir compilando.**

---

## Timeline Realista: 160 Horas

```
8 semanas × 5 días × 4h/día = 160h
+ Fin de semana backup si no alcanza
```

### Distribución por Semana

| Semana | Fase | Horas | Qué | Natalia |
|--------|------|-------|-----|---------|
| **1-2** | MIGRAR NÚCLEO | 32h | `orders` completo al molde (lógica+stock D-037 al agregado) + replicar a `products`/`users` | Wireframes admin |
| **3-4** | REPLICAR RESTO | 32h | `settings`/`auth`/`notifications` al molde (chatos, regla 46) + retirar `domain/` viejo | Diseños admin |
| **5-6** | ADMIN PANEL | 40h | Dashboard + Reportes + Facturación | Assets finales |
| **7-8** | TESTS + CIERRE | 24h | E2E + Regresión + OWASP L2 + Docs | Support |
| **+ OWASP** | Paralelo | 20h (embedded) | Auditoría + remediación V6/V7/V9/V14 | - |

**Total:** 160h + 20h audit = 180h (realista para 1 dev + fin de semana buffer).

> **Punto de partida (D-040):** el spike YA está hecho — `kernel/` + `modules/orders/`
> (Order + mapper + CancelOrder + test) compilan `tsc` 0, 2/2 verde. El molde está probado;
> Semanas 1-4 lo **replican**, no lo inventan. La migración es **INCREMENTAL**: el repo
> siempre compila y los tests quedan verdes (NO big-bang).

---

## Semana-by-Semana Detallado

### SEMANA 1 (2026-07-07 a 2026-07-13) — 4h/día = 20h

**Objetivo:** migrar el módulo **`orders` COMPLETO** al molde (PARTE V del PROMPT_CONTEXTO).
El spike (D-040) ya dejó el esqueleto verde; ahora se le mete TODA la lógica real.

**Backend (16h):**
- [ ] Mover la lógica de negocio del repo TypeORM (~499 líneas de `infrastructure/database/repositories/typeorm-order.repository.ts`) al **agregado `modules/orders/domain/entities/Order.ts`**: transiciones + **stock D-037** + concurrencia como métodos con invariantes (`accept()`, `deliver()`, `expire()`, `cancelByOwner()`, `extend()`) que emiten domain events.
- [ ] `modules/orders/domain/entities/OrderItem.ts` (entidad hija / VO).
- [ ] El **puerto** `modules/orders/domain/ports/order.repository.port.ts` habla `Order`, NO `OrderEntity` (con su `Symbol('OrderRepositoryPort')`).
- [ ] `modules/orders/infrastructure/persistence/order.mapper.ts`: traduce `Order` ⇄ `OrderEntity` (incluida la traducción de `OrderStatus` dominio ⇄ infra).
- [ ] `modules/orders/infrastructure/persistence/order.repository.ts`: impl TypeORM del puerto, **solo persistencia** (el repo deja de decidir; ya no tiene reglas).
- [ ] Casos de uso **PLANOS** en `modules/orders/application/` (`create-order.use-case.ts`, `cancel-order.use-case.ts`, `get-order.use-case.ts`…). SIN carpetas commands/queries, SIN Mediator/bus (CQRS ligero; regla 46: carpetas solo a ~20 casos).
- [ ] Cablear el adapter en `orders.module.ts` **por el símbolo del puerto**: provider `{ provide: ORDER_REPOSITORY_PORT, useClass: OrderRepository }`.
- [ ] Errores: subtipos de `DomainError` (D-039), la presentación los mapea a HTTP. NADA de Result/Either.
- [ ] **Gate (§22):** `tsc --noEmit` = 0 + **los 65 tests verdes** + `dependency-rules` respetadas (borra `infrastructure/` mentalmente → `domain/` compila).

**Docs (4h):**
- [ ] Actualizar `Architecture.md` con el layout Vertical Slice + flujo del molde.
- [ ] Registrar el cierre de la migración de `orders` en `decisiones.md` (referencia D-038/D-040).
- [ ] README de `modules/orders/` explicando el molde a replicar.

**Natalia (paralelo):**
- [ ] Wireframes admin dashboard (figma o papel)
- [ ] Paleta de colores + tipografía

---

### SEMANA 2 (2026-07-14 a 2026-07-20) — 4h/día = 20h

**Objetivo:** replicar el molde a **`products`** y **`users`** (más chatos que orders).

**Backend (16h):**
- [ ] `modules/products/` al molde: es **casi CRUD** → agregado ligero `Product.ts` (solo la regla real: `isAvailable` como candado, precio como `Money` cuando aparezca la VO), `application/` plano, infra solo `persistence/` (repo + mapper). NO clonar la estructura completa de orders si no la necesita (regla 46).
- [ ] `modules/users/` (user-profile) al molde: `UserProfile.ts` + puerto de repo + mapper + casos de uso planos.
- [ ] Retirar `domain/product/*.repository.ts` y `domain/user-profile/*.repository.ts` viejos cuando los nuevos los reemplacen (coexisten durante la migración, no antes).
- [ ] **Gate (§22):** `tsc` 0 + tests verdes; el `orders.service.spec.ts` viejo (~3 errores preexistentes) queda resuelto al cablear el módulo nuevo.

**OWASP L2 (4h):**
- [ ] Leer V6/V7/V9/V14 gaps en ASVS
- [ ] Crear issue por cada gap

**Natalia:**
- [ ] Diseño detallado: Dashboard home
- [ ] Colores + componentes base

---

### SEMANA 3 (2026-07-21 a 2026-07-27) — 4h/día = 20h

**Objetivo:** replicar el molde a **`settings`**, **`auth`** y **`notifications`**.

**Backend (12h):**
- [ ] `modules/settings/` al molde (chato): umbrales semáforo/sucursal/horario; puerto de repo + mapper + casos de uso planos.
- [ ] `modules/auth/`: el adapter de Keycloak (JWT/roles/MFA, AZURE-ready) vive en **`modules/auth/infrastructure/external/keycloak-auth.adapter.ts`** detrás del puerto del módulo — NO en un `infrastructure/auth/` global. Stub AZURE comentado como referencia del intercambio (D-038, AZURE-ready).
- [ ] `modules/notifications/`: escucha domain events de `orders` (`OrderReady`, `OrderCancelled`) vía event dispatcher; el adapter de push local va en `modules/notifications/infrastructure/external/`. `orders` NO llama a `notifications` (solo emite; rompe ciclos — bounded-contexts.md).
- [ ] El pago **simulado** sigue dentro de `orders` detrás de `payment.gateway.port.ts` con su adapter en `modules/orders/infrastructure/external/mock-payment.adapter.ts` (no es módulo `payments` hoy; se extrae solo con Stripe/AZURE real, regla 43).
- [ ] **Gate (§22):** `tsc` 0 + tests verdes.

**OWASP L2 (4h):**
- [ ] Implementar V6 bcrypt para admin passwords
- [ ] Implementar V7 validación HTTPS

**Natalia:**
- [ ] Diseño reportes: ventas, productos top
- [ ] Diseño facturación

---

### SEMANA 4 (2026-07-28 a 2026-08-03) — 4h/día = 20h

**Objetivo:** cerrar la migración — retirar el `domain/` viejo y consolidar.

**Backend (16h):**
- [ ] **Retirar** los `domain/order|product|settings|user-profile/*.repository.ts` VIEJOS (los que importaban `OrderEntity`/enums de infra y violaban `dependency-rules` §2) una vez que todos los módulos nuevos los reemplazan.
- [ ] Verificar que cada módulo respeta la dirección de dependencias: `domain/` sin imports de TypeORM/Nest/HTTP; adapters cableados por símbolo del puerto.
- [ ] Unificar (con cuidado) el `OrderStatus` duplicado dominio/infra si el ripple de imports lo permite; si no, dejar el puente `as unknown as` documentado del mapper.
- [ ] Consolidar el despacho de domain events (`pullEvents()` tras persistir) para `orders ▷ notifications`.
- [ ] **Gate (§22):** `tsc` 0 + **65 tests verdes** + 75%+ cobertura.

**OWASP L2 (4h):**
- [ ] Implementar V9 CORS whitelist
- [ ] Implementar V14 hardening producción

---

### SEMANA 5 (2026-08-04 a 2026-08-10) — 4h/día = 20h

**Objetivo:** Admin panel MVP.

**Frontend (16h):**
- [ ] Setup React Web (vite + recharts)
- [ ] Auth integration (usar JWT existente)
- [ ] Dashboard home (KPIs: ventas, cola, ingresos)
- [ ] Tabla de pedidos (estado, cliente, monto)
- [ ] Gráficas base (ventas/hora, productos top)

**Docs (4h):**
- [ ] Architecture.md: completar flujos
- [ ] Actualizar `decisiones.md` (D-038/D-039/D-040 vigentes) + registrar cierre OWASP L2

---

### SEMANA 6 (2026-08-11 a 2026-08-17) — 4h/día = 20h

**Objetivo:** Admin reportes + facturación.

**Frontend (16h):**
- [ ] Reportes: ventas por rango, productos top, ingresos
- [ ] Facturación: tabla de transacciones + detalles modal
- [ ] Exportar CSV/PDF
- [ ] Filtros (por método, por estado, por fecha)

**OWASP L2 (4h):**
- [ ] Auditoría final V6/V7/V9/V14
- [ ] Pentest interno básico

---

### SEMANA 7 (2026-08-18 a 2026-08-24) — 4h/día = 20h

**Objetivo:** Tests E2E + regresión.

**Backend (10h):**
- [ ] Integration tests: create order → accept → ready
- [ ] Regresión: 57+ tests verde
- [ ] Cobertura: 75%+

**Frontend (5h):**
- [ ] Tests: dashboard carga en < 2s
- [ ] Tests: reportes exportan correctamente
- [ ] Responsivo (mobile + tablet + desktop)

**Docs (5h):**
- [ ] Architecture.md: finalizar todas las secciones
- [ ] ADRs al día (D-038/D-039/D-040 + el ADR que cierre OWASP L2)
- [ ] Checklist pre-tesis

---

### SEMANA 8 (2026-08-25 a 2026-09-07) — 4h/día = 16h (última semana corta)

**Objetivo:** Cierre, 0 defectos, listo para defensa.

**Backend (6h):**
- [ ] Bugs finales
- [ ] Performance review (queries lentas)
- [ ] Docs finales

**Frontend (6h):**
- [ ] Polish UX
- [ ] Dark/light mode (si hay tiempo)
- [ ] Accesibilidad WCAG A

**Tesis (4h):**
- [ ] Propuesta de defensa
- [ ] Slides técnicas
- [ ] Demo runbook

---

## Cambios vs Plan Maestro Original

| Aspecto | Original | HEXAGONAL |
|---------|----------|-----------|
| Arquitectura | Clean + DDD (capas horizontales, dominio anémico) | **Hexagonal + DDD + Vertical Slice + CQRS ligero** |
| Adapters | Monolíticos (Keycloak, TypeORM) | **Intercambiables** (AZURE-ready) |
| Equipo | 3 devs × 40h | **1 dev × 4h/día + fin de semana** |
| Timeline | 3 frentes paralelos | **Secuencial + overlap (Natalia paralela)** |
| OWASP L2 | Frente separado | **Embedded (4h/semana Semanas 1-6)** |
| Admin Panel | Frente separado | **Centrado en Semanas 5-6** |
| Prueba de concepto | Sí, pero secundario | **Primario (puertos + adapters probados)** |

---

## Hitos de Confianza (Gate §22)

| Semana | Métrica | Objetivo |
|--------|---------|----------|
| 2 | Domain tests | 65%+ cobertura |
| 4 | Backend tests | 75%+ cobertura |
| 6 | Admin panel | MVP funcional |
| 7 | E2E tests | 0 regresiones |
| 8 | OWASP L2 | 100% conformidad |

---

## Presupuesto de Tiempo: Desglose

```
Migrar núcleo (Semanas 1-2): 40h  (orders al molde + products/users)
Replicar resto (Semanas 3-4):40h  (settings/auth/notifications + retirar domain/ viejo)
Admin Panel (Semanas 5-6):   40h  (dashboard + reportes)
Tests + Cierre (Semanas 7-8):20h  (E2E + regresión)
OWASP L2 (Embedded):         20h  (auditoría + remediar)
────────────────────────────────
TOTAL:                       160h ✅

Fin de semana buffer:        ~20-40h (si es necesario)
```

---

## Por qué Hexagonal Escala con 160h

**Sin Hexagonal:**
- Cambiar Keycloak → AZURE = refactorizar toda la auth (15h+ risk)
- Cambiar Mock → Stripe = refactorizar todo el pago (10h+ risk)
- Costo de cambio = prohibitivo

**Con Hexagonal:**
- Cambiar Keycloak → AZURE = implementar nuevo adapter (2-3h, cero riesgo)
- Cambiar Mock → Stripe = implementar nuevo adapter (2-3h, cero riesgo)
- **Costo de cambio = mínimo, core intacto**

**Inversión inicial (Semanas 1-2):**
- +4h por crear puertos explícitos
- -10h por eliminar acoplamiento later
- **ROI positivo si hay > 1 cambio de adapter**

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|---|---|---|
| 4h/día insuficiente | Media | Alto | Fin de semana buffer, priorizar críticos |
| Hexagonal "over-engineering" | Baja | Medio | AZURE justifica; es mínima complejidad |
| Admin panel toma más | Media | Medio | Reducir Natalia involvement, skip dark-mode |
| OWASP gaps inesperados | Baja | Crítico | Auditoría multi-agente, time buffer semana 8 |
| Natalia no puede iterar rápido | Baja | Bajo | Assets on-demand, fallback mocks |

---

## Stack Final

- **Backend:** NestJS 11 + TypeORM + PostgreSQL 16 (Hexagonal, DDD, Vertical Slice, CQRS ligero)
- **Frontend Admin:** React Web (vite + recharts)
- **Frontend Cliente:** React Native (Expo) — intacto
- **Auth:** Keycloak local (Hexagonal adapter, AZURE-ready)
- **Email:** Keycloak SMTP (Hexagonal adapter, AZURE-ready)
- **Payment:** Mock (Hexagonal adapter, Stripe-ready)
- **Diseño:** Natalia + tu criterio (paralelo)

---

## Próximos Pasos (HOY)

1. **Confirmar Hexagonal OK:** Sí/No
2. **Confirmar 4h/día realista + fin de semana:** Sí/No
3. **Confirmar Natalia on-demand paralelo:** Sí/No
4. Crear Semana 1 issues en GitHub
5. **START WEEK 1 — 2026-07-07**

---

**Nota:** Este plan es **ajustado pero alcanzable** para 1 dev motivado + fin de semana backup. La clave es Hexagonal: no hagas todo, haz lo modular desde el inicio.

🚀 ¿Confirmas todo? → START
