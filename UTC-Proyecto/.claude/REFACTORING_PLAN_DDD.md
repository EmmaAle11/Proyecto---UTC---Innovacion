# Migración Clean anémico → Hexagonal + DDD + Vertical Slice — ✅ COMPLETADA

> **Estado: CERRADA (2026-07-10).** Este documento era el *plan* de migración; la migración
> ya está **hecha, commiteada y pusheada** a `origin/main` (`c7d5d63`). Se conserva como
> **registro histórico** (qué se planeó vs. qué se construyó). La verdad viva está en los
> ADRs: `docs/arquitectura/decisiones.md` (D-038…D-046) + `bounded-contexts.md` +
> `dependency-rules.md`. El molde en código: `backend/src/kernel/` + `backend/src/modules/`.

**Objetivo original:** migrar el backend de Clean Architecture anémica (capas horizontales,
lógica en services/repos, `domain/` con fuga a TypeORM) a **Hexagonal + DDD + Vertical Slice**
(`modules/<contexto>/`), de forma **incremental** (D-040), con `orders` como piloto.

---

## Resultado por fase

| Fase del plan | Estado | Cómo se cerró (ADR) |
|---------------|--------|---------------------|
| **1. `orders` completo al molde** | ✅ | Agregado `Order` con todas las transiciones + stock D-037 + factory `Order.place()` + Value Objects (`Money`/`Quantity`/`OrderId`/`ProductId`) + Domain Events. D-037→D-044. |
| **2. Retirar el `domain/order` viejo (fuga)** | ✅ | `src/domain/` disuelto: los puertos de repositorio se movieron a `application/<ctx>/*.repository.port.ts`; `src/domain/` quedó **solo con vocabulario puro** (`enums.ts`). Los enums salieron de `infrastructure/` a `domain/enums.ts` (infra re-exporta). **D-043.** |
| **3. Replicar a los demás módulos** | ✅ (con matices) | `notifications` = 2º slice real (outbox + Domain Events, **D-045**). `products` = slice pragmático (entity-as-model, **D-046**). **`auth`/`settings`/`payments` se quedaron en capas clásicas a propósito** (regla 46 — son CRUD/cross-cutting, no ameritan el molde). `users` no tiene módulo (perfil dentro de orders + puerto en `application/auth`). |
| **4. Testing + docs vivos** | ✅ | **117 tests** verdes (no 65 — creció con VOs, notifications, place). Docs vivos actualizados en cada ADR. |

**Gate final (§0/§22):** backend `tsc` 0 + build 0 + **117 tests** + app arranca + migraciones
en Postgres real; frontend `tsc` 0. Auditoría multi-lente + regresión: **0 P0-P5**.

---

## Dónde el resultado DIVERGIÓ del plan (honestidad, §40)

El plan proponía un diseño; lo construido eligió variantes más simples/pragmáticas. Las diferencias importan para quien lea el plan viejo:

1. **Stock cruza agregados — NO se usó `ProductStockPort` ni un event-handler.** El agregado
   `Order` devuelve un `StockEffect` (`'reserve' | 'release' | 'none'`) desde sus transiciones;
   el **adapter** aplica el SQL atómico (`GREATEST(0, stock−qty)` / `stock+qty`, orden global por
   `productId`, bump de `version`) dentro de la **misma tx**. Más simple que un puerto de stock
   dedicado, misma invariante D-037. (ponytail / regla 46.)
2. **Eventos reales:** `OrderAccepted`, `OrderReadied`, `OrderCancelled`, `OrderNotPickedUp`
   (BR-012) — no `OrderCreated`/`OrderReady` como decía el plan. Se acumulan con `record()` y se
   despachan tras aplicar, **dentro de la tx**, vía `DomainEventDispatcher` (`shared/events/`) al
   handler de `notifications` que escribe el **outbox** (de-dup por `UNIQUE(order_id, event_type)`).
3. **`kernel` sin `UseCase`.** El kernel quedó en `Entity`, `AggregateRoot`, `ValueObject`,
   `DomainEvent`, `DomainError`. `UseCase.ts` se borró (dead code — los casos de uso son el
   `service` del slice, no una interfaz genérica). Los casos de uso NO se partieron en archivos
   `*.use-case.ts` planos: `orders` los tiene como métodos de `orders.service.ts` (regla 46 — no
   ameritaba un archivo por caso).
4. **Puertos: dos ubicaciones legítimas.** En `orders` el puerto vive en `domain/ports/` y habla
   tipos de dominio/contratos (`Order`/`OrderResponse`). En los módulos **pragmáticos** (`products`)
   y clásicos (`settings`/`auth`) el puerto vive en `application/` y habla la **entidad TypeORM**
   como modelo compartido (excepción entity-as-model documentada, D-043/D-046).
5. **`notifications` sin bus con Mediator** (como pedía el plan), pero **sí** con un dispatcher
   in-process síncrono + **outbox transaccional** + endpoint `GET /notifications/mine` (el cliente
   puede leer la verdad del server en vez de re-derivar por polling).

---

## Qué NO cambió (se cumplió tal cual)

- **Incremental, nunca big-bang.** El repo compiló y los tests quedaron verdes en cada paso.
- **Estrategia de error única:** `DomainError` (D-039). Sin `Result`/`Either`.
- **CQRS ligero:** sin `CommandBus`/`QueryBus`. Sin `commands/`/`queries/` (regla 46).
- **Vertical Slice** para lo que lo amerita; capas clásicas para lo que no (regla 45/46).
- **`shared/` mínimo** pero real: `events/` (dispatcher), `logging/` (audit), `resilience/`
  (circuit breaker) — cross-cutting genuino, no un cajón de sastre.
- **Commit/push manual** del usuario (§23).

---

## Estado final del backend (mapa de un vistazo)

```
kernel/domain/        Entity · AggregateRoot · ValueObject · DomainEvent · DomainError  (puro)
modules/orders/       slice completo — DDD táctico (agregado + VOs + eventos + puerto + adapter)
modules/notifications/ slice fino — outbox desde eventos de orders (sin agregado)
modules/products/     slice pragmático — CRUD entity-as-model (policy + service + adapter)
application/          capas clásicas: auth/ · settings/ · payments/  (+ sus *.repository.port.ts)
domain/               solo enums.ts (vocabulario puro compartido de los contextos clásicos)
infrastructure/       entities TypeORM · migraciones · adapters clásicos (settings/user-profile/keycloak/jwt)
presentation/         controllers/módulos clásicos: auth/ · settings/ · health/
shared/               events/ (dispatcher) · logging/ (audit) · resilience/ (circuit breaker)
```

Siguiente frente (fuera de esta migración, ya cerrada): revisión del **panel admin** (frontend
FSD) y, opcional, OWASP L2 (V6/V7/V9/V14) del `MASTER_PLAN`.
