# Mapa de módulos — backend UTC Pick Sazón

> **Para qué sirve este archivo:** es el ÍNDICE del backend. Si buscas dónde vive
> algo o cómo fluye un request, empieza aquí. La regla de oro de la arquitectura es
> *"una carpeta = un bounded context"* — abrir `modules/<x>/` te muestra TODO ese
> contexto. Ver contexto completo en `docs/roadmap/PROMPT_CONTEXTO_ARQUITECTURA.md`.

Arquitectura: **Hexagonal + DDD + Vertical Slice** (backend) — decisiones D-038…D-040.

---

## Dónde vive cada bounded context

| Contexto | Estado | Dónde | Lógica de dominio |
|----------|--------|-------|-------------------|
| **orders** | ✅ vertical slice completo (DDD táctico) | `modules/orders/` | Agregado `Order` + Value Objects (`Money`/`Quantity`/ids) + Domain Events (BR-012), adapter con lock/tx |
| **notifications** | ✅ vertical slice (fino) | `modules/notifications/` | Outbox de avisos desde Domain Events de orders; sin aggregate (append-only), D-045 |
| **products** | ✅ vertical slice (pragmático) | `modules/products/` | Policy `product.policy.ts`; CRUD entity-as-model (sin aggregate, regla 46), D-046 |
| **settings** | ⬜ CRUD (layered) | `application/settings/` | Ninguna propia (1 guarda `red>yellow` en el service) |
| **users** | ⬜ sin módulo propio | perfil dentro de `orders` (`ensureProfile`) + `application/auth/user-profile.repository.port.ts` | Ninguna propia |
| **auth** | ⬜ cross-cutting (layered) | `application/auth/` + `presentation/auth/` + `infrastructure/auth/` | JWT/roles/MFA vía Keycloak |
| **payments** | ⬜ servicio (layered) | `application/payments/` | Pasarela simulada + circuit breaker (usada por orders) |

Leyenda: ✅ molde completo · 🟡 dominio en su módulo, plomería aún layered · ⬜ CRUD/cross-cutting genuino, **no** amerita el molde (regla 44/46: no se crea ceremonia sin invariante que proteger).

> **Honestidad (rule #24):** `settings`/`users`/`auth`/`payments` NO están en `modules/`
> a propósito — son CRUD o cross-cutting sin ciclo de vida de dominio. Se listan aquí
> para que sean **encontrables**; encontrabilidad > reubicación.

---

## Anatomía de un módulo completo (`modules/orders/`)

```
modules/orders/
├── contracts/          # DTOs públicos (request/response) — lo que entra/sale por HTTP
├── domain/             # NÚCLEO puro (sin Nest, sin TypeORM)
│   ├── entities/       #   Order.ts — el agregado: DECIDE las reglas
│   └── ports/          #   contrato del repositorio (interfaz)
├── application/        # casos de uso / servicio — ORQUESTA (carga, decide, guarda)
├── infrastructure/
│   └── persistence/    #   adapter TypeORM (lock/tx/stock) + mapper (Order ⇄ OrderEntity)
├── presentation/       # controller + module Nest — HTTP
└── tests/unit/         # tests del agregado (rápidos, sin BD)
```

---

## Cómo se traza un request (ejemplo: cancelar un pedido)

```
DELETE /orders/:id
   │
   ▼
presentation/orders.controller.ts     ← recibe HTTP, saca id + userId del JWT
   │
   ▼
application/orders.service.ts         ← ORQUESTA: llama al puerto
   │
   ▼
infrastructure/persistence/           ← adapter: abre tx, LOCK pesimista, carga fila fresca
  order.repository.ts                 ←   traduce con el mapper y le pide DECIDIR al agregado
   │
   ▼
domain/entities/Order.ts              ← DECIDE: ¿cancelable? aplica regla, grita StockEffect
   │  (grita 'release' → adapter mueve stock de Product)
   ▼
PostgreSQL
```

Mnemotecnia: **el controller recibe · el servicio orquesta · el agregado decide · el adapter ejecuta · el mapper traduce.**

---

## Reglas de dependencia (resumen — detalle en `docs/arquitectura/dependency-rules.md`)

```
presentation → application → domain ← (adapters de infrastructure)
```
Prueba mental: *borra `infrastructure/` y el `domain/` sigue compilando.* Todo apunta
al dominio; el dominio no apunta a nadie.

Direcciones entre contextos (`docs/arquitectura/bounded-contexts.md`):
`orders → products/users/settings` (lectura), `orders ▷ notifications` (evento). Nunca al revés.

---

## Docs relacionados
- `docs/roadmap/PROMPT_CONTEXTO_ARQUITECTURA.md` — contexto maestro (punto de entrada #1).
- `docs/arquitectura/{bounded-contexts,dependency-rules,decision-matrix,decisiones}.md`.
- `docs/superpowers/priority/rules.md` — reglas del proyecto (42–46).
