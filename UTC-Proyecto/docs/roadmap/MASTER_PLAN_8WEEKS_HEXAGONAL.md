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

## Arquitectura (Hexagonal + DDD + CQRS)

```
backend/src/
├── domain/                           # CORE PURO
│   ├── order/
│   │   ├── Order.ts                 (agregado)
│   │   ├── OrderPolicy.ts           (reglas)
│   │   ├── DomainEvents/
│   │   ├── order.repository.ts      (PUERTO)
│   │   ├── order.email-sender.ts    (PUERTO: IEmailSender)
│   │   └── order-domain.service.ts
│   ├── product/
│   ├── user-profile/
│   ├── shared/
│   │   └── ports/
│   │       ├── IEmailSender.ts      (PUERTO)
│   │       ├── IUserAuthService.ts  (PUERTO)
│   │       └── IPaymentGateway.ts   (PUERTO)
│   └── README.md
│
├── application/                      # ORQUESTACIÓN (CQRS)
│   ├── orders/
│   │   ├── commands/
│   │   │   ├── CreateOrder/
│   │   │   │   ├── CreateOrderCommand.ts
│   │   │   │   ├── CreateOrderHandler.ts  (usa puerto IEmailSender)
│   │   │   │   └── CreateOrderResponse.ts
│   │   │   └── ...
│   │   ├── queries/
│   │   ├── event-handlers/
│   │   │   └── OrderReadyHandler.ts (usa IEmailSender para notif)
│   │   └── orders.module.ts
│   └── ...
│
├── infrastructure/                   # ADAPTERS (Intercambiables)
│   ├── database/
│   │   ├── repositories/
│   │   │   └── typeorm-order.repository.ts  (impl de IOrderRepository)
│   │   └── entities/
│   ├── email/                        # EMAIL ADAPTERS
│   │   ├── keycloak-email.adapter.ts       (impl actual: Keycloak)
│   │   ├── azure-email.adapter.ts          (impl futuro: AZURE)
│   │   ├── sendgrid-email.adapter.ts       (impl fallback)
│   │   └── email.module.ts                 (inyecta el correcto)
│   ├── auth/
│   │   ├── keycloak-auth.adapter.ts        (impl actual)
│   │   ├── azure-auth.adapter.ts           (impl futuro)
│   │   └── auth.module.ts
│   ├── payment/
│   │   ├── mock-payment.adapter.ts         (impl actual: simulado)
│   │   ├── stripe-payment.adapter.ts       (impl futuro)
│   │   └── payment.module.ts
│   └── ...
│
├── presentation/                     # HTTP / NestJS
│   ├── controllers/
│   ├── guards/
│   └── ...
│
└── shared/
    ├── event-bus/
    └── ...
```

**Clave:** Domain es puro, application orquesta, infrastructure es intercambiable.

---

## Timeline Realista: 160 Horas

```
8 semanas × 5 días × 4h/día = 160h
+ Fin de semana backup si no alcanza
```

### Distribución por Semana

| Semana | Fase | Horas | Qué | Natalia |
|--------|------|-------|-----|---------|
| **1-2** | ARQUITECTURA | 32h | Agregados (Order, Product) + Puertos (email, auth, payment) | Wireframes admin |
| **3-4** | ADAPTERS | 32h | Impl adapters (Keycloak, Mock Payment) + CQRS | Diseños admin |
| **5-6** | ADMIN PANEL | 40h | Dashboard + Reportes + Facturación | Assets finales |
| **7-8** | TESTS + CIERRE | 24h | E2E + Regresión + OWASP L2 + Docs | Support |
| **+ OWASP** | Paralelo | 20h (embedded) | Auditoría + remediación V6/V7/V9/V14 | - |

**Total:** 160h + 20h audit = 180h (realista para 1 dev + fin de semana buffer).

---

## Semana-by-Semana Detallado

### SEMANA 1 (2026-07-07 a 2026-07-13) — 4h/día = 20h

**Objetivo:** Agregados + Puertos.

**Backend (16h):**
- [ ] `domain/order/Order.ts` (agregado raíz)
- [ ] `domain/order/OrderItem.ts` (value object)
- [ ] `domain/order/OrderPolicy.ts` (reglas de transición)
- [ ] `domain/shared/ports/IEmailSender.ts` (PUERTO para email)
- [ ] `domain/shared/ports/IPaymentGateway.ts` (PUERTO para pagos)
- [ ] `domain/shared/ports/IUserAuthService.ts` (PUERTO para auth)
- [ ] Value Objects: `OrderNumber.ts`, `Money.ts`, `BranchId.ts`
- [ ] Tests unitarios: 50+ cobertura

**Docs (4h):**
- [ ] Actualizar `Architecture.md` con diagrama Hexagonal
- [ ] ADR D-048: Por qué Hexagonal (AZURE future-proof)
- [ ] README del domain/ explicando puertos

**Natalia (paralelo):**
- [ ] Wireframes admin dashboard (figma o papel)
- [ ] Paleta de colores + tipografía

---

### SEMANA 2 (2026-07-14 a 2026-07-20) — 4h/día = 20h

**Objetivo:** Product, UserProfile agregados.

**Backend (16h):**
- [ ] `domain/product/Product.ts` (agregado)
- [ ] `domain/product/Money.ts` (value object: precio)
- [ ] `domain/user-profile/UserProfile.ts` (agregado)
- [ ] Domain Services (si hay lógica que cruza agregados)
- [ ] Tests: 65%+ cobertura

**OWASP L2 (4h):**
- [ ] Leer V6/V7/V9/V14 gaps en ASVS
- [ ] Crear issue por cada gap

**Natalia:**
- [ ] Diseño detallado: Dashboard home
- [ ] Colores + componentes base

---

### SEMANA 3 (2026-07-21 a 2026-07-27) — 4h/día = 20h

**Objetivo:** Adapters + CQRS.

**Backend (12h):**
- [ ] `infrastructure/email/keycloak-email.adapter.ts` (impl actual)
- [ ] `infrastructure/email/azure-email.adapter.ts` (stub, comentado)
- [ ] `infrastructure/auth/keycloak-auth.adapter.ts` (impl)
- [ ] `infrastructure/payment/mock-payment.adapter.ts` (simulado)
- [ ] `application/orders/commands/CreateOrderHandler.ts` (inyecta IEmailSender)
- [ ] CommandBus + QueryBus setup

**OWASP L2 (4h):**
- [ ] Implementar V6 bcrypt para admin passwords
- [ ] Implementar V7 validación HTTPS

**Natalia:**
- [ ] Diseño reportes: ventas, productos top
- [ ] Diseño facturación

---

### SEMANA 4 (2026-07-28 a 2026-08-03) — 4h/día = 20h

**Objetivo:** TypeORM repositories + Event Bus.

**Backend (16h):**
- [ ] `infrastructure/database/repositories/typeorm-order.repository.ts` (mapper Order ↔ OrderEntity)
- [ ] TypeORM repositories para Product, UserProfile
- [ ] Event Bus service
- [ ] Event handlers (OrderReadyHandler usa IEmailSender)
- [ ] Tests: 75%+ cobertura

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
- [ ] D-048 + D-049 (OWASP L2 final)

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
- [ ] ADRs D-048, D-049
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
| Arquitectura | Clean + DDD | **Hexagonal + DDD + CQRS** |
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
Domain (Semanas 1-2):        40h  (agregados + puertos)
Adapters (Semanas 3-4):      40h  (impl. de interfaces)
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

- **Backend:** NestJS 11 + TypeORM + PostgreSQL 16 (Hexagonal, DDD, CQRS)
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
