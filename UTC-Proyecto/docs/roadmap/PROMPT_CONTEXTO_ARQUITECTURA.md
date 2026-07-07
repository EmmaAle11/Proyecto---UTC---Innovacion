# CONTEXTO MAESTRO DE ARQUITECTURA — UTC Pick Sazón
### Prompt de onboarding COMPLETO para una instancia nueva de Claude Code

> **Cómo usar este archivo:** pégalo COMPLETO como primer mensaje a un Claude Code
> nuevo que vaya a trabajar en este repo, o dile: *"lee
> `UTC-Proyecto/docs/roadmap/PROMPT_CONTEXTO_ARQUITECTURA.md` completo antes de nada"*.
>
> Este documento es AUTOSUFICIENTE para entender **qué arquitectura tenemos, por qué,
> y cómo replicarla**. No deja detalles a la suposición. Donde algo es la verdad
> canónica viva, se cita el archivo fuente (que gana si hay contradicción).
>
> Objetivo: **distancia euclidiana = 0** entre la intención del equipo y lo que el
> nuevo Claude entiende. Si terminas de leer esto y aún tienes que suponer algo
> estructural, este documento falló — repórtalo.

---

# ÍNDICE

- **PARTE I — Contexto del proyecto** (qué es, quién, deadline, stack, puertos)
- **PARTE II — Cómo llegamos a esta arquitectura** (la historia, las 3 rondas de crítica)
- **PARTE III — Las 3 arquitecturas y cómo se componen** (DDD + Hexagonal + Vertical Slice + FSD)
- **PARTE IV — Árbol de arquitectura COMPLETO** (backend + frontend, dentado)
- **PARTE V — El molde en CÓDIGO REAL** (kernel + módulo orders, con ejemplos)
- **PARTE VI — Reglas de dependencia** (por capa y por módulo, con diagramas)
- **PARTE VII — Bounded Context Map + Context Map**
- **PARTE VIII — Decision Matrix** (cuándo crear cada pieza)
- **PARTE IX — Reglas del proyecto** (42–46 textuales + las de proceso)
- **PARTE X — YAGNI de estructura** (umbrales con ejemplos antes/después)
- **PARTE XI — Decisiones congeladas** (ADRs D-037…D-040)
- **PARTE XII — Estado actual honesto** (qué existe, qué está roto, qué falta)
- **PARTE XIII — Qué sigue** (plan de migración, orden, gates)
- **PARTE XIV — Qué NO hacer** (errores caros ya descartados)
- **PARTE XV — Lectura obligatoria** (fuentes canónicas) + Primera acción

---

# PARTE I — CONTEXTO DEL PROYECTO

**UTC Pick Sazón** es la app de una **cooperativa escolar tipo *dark kitchen*** (cocina
que produce bajo demanda, sin comedor): el estudiante pide desde el teléfono, la
cooperativa cocina y avisa cuando está listo para recoger. Incluye **app cliente**
(React Native) y **panel de administración** (dentro de la misma app, por rol).

- **Naturaleza:** proyecto de **tesis**. Debe estar operativo para defensa el **2026-09-07**.
- **Equipo:** **1 desarrollador** (Emmanuel Alejandre, full-stack, ~4h/día L–V + fines de semana de respaldo) + **Claude** (asistente) + **Natalia Santos** (diseño UI en paralelo, entrega assets on-demand).
- **Presupuesto:** ~160 horas efectivas en 8 semanas.
- **Raíz REAL del repo:** `/home/emmanuel/projects/UTC` — la carpeta **PADRE**, NO `UTC-Proyecto/`. Los comandos git se corren desde ahí.

### Stack confirmado
- **Backend:** NestJS 11 + TypeORM + PostgreSQL 16.
- **App (cliente + admin):** React Native + Expo (SDK 53+). Dev build APK = **solo Android** (Expo Go SDK53 removió notificaciones).
- **Auth:** Keycloak local (JWT + roles + MFA TOTP para admin). **AZURE-ready** (si la app se aprueba, se conecta AZURE para cuentas y `noreply@utc-pick-sazon.app`).
- **Pagos:** **SIMULADOS** (mock). Stripe/pasarela real = futuro.
- **Notificaciones:** push local (Opción A).

### Puertos en ESTE equipo (remapeados — otro proyecto "doxia" ocupa los default)
- PostgreSQL UTC: **5433** (no 5432)
- Keycloak: **8082** (no 8080)
- Backend Nest: **3002** (no 3000/3001)

### Regla de operación crítica
**Los `git commit` y `git push` los hace el USUARIO a mano** (está aprendiendo git).
Claude **prepara y propone** los comandos; **no commitea ni pushea** salvo petición
explícita. (Regla del proyecto §23.)

---

# PARTE II — CÓMO LLEGAMOS A ESTA ARQUITECTURA

Esto importa: la arquitectura NO es un capricho ni "lo que se ve limpio". Es el
resultado de **tres rondas de crítica cruzada** entre Claude y ChatGPT, cada uno
retando al otro, aterrizado al contexto real (1 dev, 160h, tesis, AZURE futuro).

**Punto de partida:** el backend era **Clean Architecture anémica** — capas
horizontales (`application/`, `domain/`, `infrastructure/`, `presentation/`) con
servicios que orquestaban y un `domain/` que solo tenía interfaces de repositorio.
La lógica de negocio vivía en los services y en los repos TypeORM (dominio anémico).

**Problema que disparó el rediseño:** "vamos a conectar AZURE para cuentas y correo,
pero solo si la app se aprueba". Eso exige poder **cambiar el proveedor de infra sin
reescribir el dominio** → **Hexagonal**.

**Ronda 1 (Clean → DDD híbrido):** se decidió enriquecer el dominio (agregados,
value objects, eventos) y abstraer repos como puertos.

**Ronda 2 (capas horizontales → Vertical Slice + kernel + CQRS ligero):** ChatGPT
argumentó — y se aceptó — que para 1 dev es mejor **Vertical Slice** (`modules/orders/`
con todo junto) que capas globales; **contracts dentro del módulo** (encapsulamiento);
**CQRS ligero** (carpetas commands/queries, SIN Mediator/bus); **kernel minimalista**;
y que los **puertos viven en el dominio de cada módulo**, no en el kernel ni en un
`shared/` global.

**Ronda 3 (afinado YAGNI):** se rechazó la sobre-subdivisión que el propio Claude
había propuesto (infra en 4 carpetas, presentation en 5, tests en 5 desde el día 1).
Se congeló que **las carpetas nacen cuando el volumen las pide** (umbrales concretos),
se añadieron los mapas de gobierno (**Bounded Context Map**, **Dependency Rules**,
**Decision Matrix**) y las reglas 44/45/46.

**Lección transversal (regla 45):** ni la propuesta de Claude ni la de ChatGPT ni la
de Fowler se aceptan por autoridad. Se aceptan si **aportan valor a ESTE proyecto**.
La crítica cruzada es el método. Este documento captura el resultado congelado.

---

# PARTE III — LAS 3 ARQUITECTURAS Y CÓMO SE COMPONEN

No son tres cosas separadas. Son **un solo stack coherente**, cada una resolviendo
una dimensión distinta:

```
┌──────────────────────────────────────────────────────────────────────┐
│  BACKEND                                                               │
│                                                                        │
│   VERTICAL SLICE  →  ¿CÓMO organizo el código?                         │
│      Por módulo de negocio (modules/orders/), no por capa técnica.     │
│      Cada módulo es un mini-sistema autónomo y copiable.               │
│                                                                        │
│   DDD             →  ¿DÓNDE vive la lógica de negocio?                 │
│      En agregados ricos (Order), value objects (Money), eventos.       │
│      NO en services anémicos ni en repos.                             │
│                                                                        │
│   HEXAGONAL       →  ¿CÓMO aíslo la tecnología externa?                │
│      El dominio define PUERTOS (interfaces); la infra los IMPLEMENTA   │
│      (adapters). Cambiar Keycloak→AZURE = nuevo adapter, dominio       │
│      intacto.                                                          │
└──────────────────────────────────────────────────────────────────────┘
┌──────────────────────────────────────────────────────────────────────┐
│  FRONTEND                                                              │
│                                                                        │
│   FSD v2 (Feature-Sliced Design)  →  ¿CÓMO organizo la app RN?        │
│      Capas: app, pages, widgets, features, entities, shared.           │
│      processes/ SOLO para flujos largos reales. SIN flows/.           │
└──────────────────────────────────────────────────────────────────────┘
```

### La regla mental que lo une todo (Hexagonal)
> **Si borro toda la carpeta `infrastructure/` de un módulo, su `domain/` debe seguir
> compilando.** Si no compila, hay una dependencia prohibida (dominio→infra).

Dirección única de dependencias: **todo apunta al dominio; el dominio no apunta a
nadie.**

```
Presentation ──→ Application ──→ Domain ──→ (Ports)
                                              ▲
Infrastructure ───────────────────────────────┘
   (los Adapters implementan los Ports; apuntan HACIA el dominio, nunca al revés)
```

### Checklist de lo congelado
```
✅ Hexagonal (Ports & Adapters, AZURE-ready)
✅ Vertical Slice (modules/<contexto>/ autónomos)
✅ DDD (agregados ricos, value objects, domain events, domain services)
✅ Módulos autónomos (copiables a otro proyecto sin arrastrar dependencias)
✅ FSD v2 en el frontend (sin flows/)
✅ ADR (decisiones.md — registro D-00X vivo)
✅ Dependency Rules (documento propio, el más consultado)
✅ Bounded Context Map + Context Map (quién habla con quién)
✅ Decision Matrix (cuándo crear cada pieza)
✅ CQRS ligero (commands/queries como carpetas, SIN Mediator/bus)
✅ kernel minimalista (solo abstracciones de dominio, SIN ports)
✅ Estrategia de error única: excepciones de dominio (SIN Result/Either)
✅ YAGNI aplicado: las carpetas nacen cuando se necesitan (umbrales concretos)
```

---

# PARTE IV — ÁRBOL DE ARQUITECTURA COMPLETO

## IV.A — Backend objetivo (Vertical Slice)

Así se ve un módulo **completamente crecido**. NO se crea así de golpe: las
sub-carpetas marcadas `⌁` **nacen por umbral** (ver PARTE X). Hoy se arranca mínimo.

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
│
├── modules/                                 # VERTICAL SLICE: un módulo = un bounded context
│   │
│   ├── orders/                              # ← módulo autónomo (PILOTO)
│   │   ├── contracts/                        # DTOs públicos del módulo (request/response/dto)
│   │   │   ├── create-order.request.ts
│   │   │   ├── create-order.response.ts
│   │   │   └── order.dto.ts
│   │   ├── domain/                           # NÚCLEO puro (sin Nest, sin TypeORM)
│   │   │   ├── entities/
│   │   │   │   ├── Order.ts                   # AGREGADO raíz: mueve estados + reglas
│   │   │   │   └── OrderItem.ts               # entidad hija / value object
│   │   │   ├── value-objects/                 # ⌁ Money, OrderNumber, BranchId
│   │   │   ├── services/                      # ⌁ OrderDomainService (lógica que cruza agregados)
│   │   │   ├── events/
│   │   │   │   ├── OrderCancelled.ts
│   │   │   │   └── OrderReady.ts
│   │   │   └── ports/                         # PUERTOS (interfaces) — hablan tipos de DOMINIO
│   │   │       ├── order.repository.port.ts
│   │   │       └── payment.gateway.port.ts
│   │   ├── application/                       # ORQUESTACIÓN — casos de uso PLANOS
│   │   │   ├── create-order.use-case.ts       #   (⌁ commands/ + queries/ solo a ~20 casos)
│   │   │   ├── cancel-order.use-case.ts
│   │   │   └── get-order.use-case.ts
│   │   ├── infrastructure/                    # ADAPTERS (implementan los puertos)
│   │   │   ├── persistence/
│   │   │   │   ├── order.repository.ts         # impl TypeORM del puerto
│   │   │   │   └── order.mapper.ts             # Order (dominio) ⇄ OrderEntity (TypeORM)
│   │   │   ├── external/                       # ⌁ stripe/keycloak/azure adapters
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
│   ├── auth/                                 # Keycloak adapter, JWT, roles, MFA
│   └── notifications/                        # push local; escucha eventos de orders
│
└── shared/                                  # CASI INEXISTENTE (ver regla 44/46)
                                             #  lo de un módulo va al módulo; lo base va al kernel
```

> `⌁` = **NO existe hoy**; nace por umbral, nunca antes (PARTE X).

## IV.B — Frontend objetivo (FSD v2) — YA EXISTE, se mantiene

```
frontend/src/
├── app/                                     # arranque + navegación
│   └── navigation/                           # RootNavigator, MainStack, AdminStack, Tabs…
├── pages/                                   # pantallas completas
│   ├── admin/{dashboard,queue,menu,order-detail,account}/
│   ├── auth/{LoginUsuario,LoginAdmin}
│   ├── {home,product,cart,tracking,orders,profile,wallet,welcome}/
├── widgets/                                 # bloques compuestos reutilizables
│   ├── auth/AuthScaffold.tsx
│   └── branch/BranchPicker.tsx
├── features/                                # CAPACIDADES con lógica (store por feature)
│   ├── auth/{api,model}          → session.store.ts
│   ├── cart/model               → cart.store.ts
│   ├── catalog/model            → catalog.store.ts
│   ├── admin/model              → catalog.store.ts, settings.store.ts
│   ├── branch/{lib,model}       → useBranchLocation, branch.store.ts
│   ├── notifications/model      → useOrderNotifications, useScheduledAlerts
│   ├── orders/model             → orders.store.ts
│   ├── profile/model            → settings.store.ts
│   └── wallet/{model,ui}        → wallet.store.ts, CardForm.tsx
├── entities/                                # el "sustantivo": tipo + UI atómica + api/mock
│   ├── order/{model,api,admin-mock,schedule}
│   ├── product/{model,api,admin-api,admin-mock,icons,images,mock}
│   └── branch/{model,mock}
└── shared/                                  # cross-app SIN lógica de negocio
    ├── api/client.ts                         # cliente HTTP + setTokenRefresher (401→refresh→retry)
    ├── ui/{Type,PrimaryButton,Badge,Chip,CoffeeLoader,OrderTracker,...}
    ├── theme/{index,tokens}
    ├── lib/{card,catalog-loader,geo}
    ├── notifications/notify.ts
    └── a11y/a11y.store.ts

# ⌁ processes/  → SOLO si aparece un flujo largo real (Checkout multi-paso, Onboarding).
#                 NO se añade flows/ además — duplica responsabilidades.
```

## IV.C — Docs de gobierno (fuentes canónicas)

```
UTC-Proyecto/docs/
├── arquitectura/
│   ├── decisiones.md              # ADRs D-001…D-040 (registro vivo)
│   ├── bounded-contexts.md        # Bounded Context Map + Context Map
│   ├── dependency-rules.md        # reglas de dependencia por capa (el más consultado)
│   ├── decision-matrix.md         # cuándo crear Aggregate/VO/Service/Módulo/Event/Adapter
│   └── architecture-propuesta.md
├── roadmap/
│   ├── MASTER_PLAN_8WEEKS_HEXAGONAL.md   # el plan de 8 semanas / 160h
│   ├── MASTER_PLAN_8WEEKS.md
│   ├── PROMPT_CONTEXTO_ARQUITECTURA.md   # ← ESTE archivo
│   └── README.md
├── superpowers/priority/
│   ├── rules.md                   # TODAS las reglas del proyecto (1…46)
│   └── CHANGELOG.md
├── OWASP/                         # ASVS L2: análisis, recomendaciones, threat-model
├── propuesta/                     # círculo de innovación, ejecución, SCAMPER
├── datos/                         # SQL, datos demo, cheatsheet psql
└── Read/                          # runbooks (levantar proyecto, demo dos teléfonos)

UTC-Proyecto/.claude/
├── Architecture.md                # manual de arquitectura (visión, capas, flujos, invariantes)
├── REFACTORING_PLAN_DDD.md        # plan de refactor Clean → DDD por fases
└── settings.local.json
```

---

# PARTE V — EL MOLDE EN CÓDIGO REAL

Esto **ya existe y compila** (spike D-040): `backend/src/kernel/domain/` +
`backend/src/modules/orders/`. `tsc` 0, tests verdes. **Este es el patrón que TODOS
los módulos replican.** Estudia estos archivos reales.

### V.1 — kernel: `Entity.ts`
```ts
/**
 * kernel — abstracción de dominio PURA. Sin NestJS, sin TypeORM.
 * Identidad por id; dos entidades son iguales si comparten id.
 */
export abstract class Entity<TId> {
  protected constructor(public readonly id: TId) {}

  equals(other?: Entity<TId>): boolean {
    return !!other && this.id === other.id;
  }
}
```

### V.2 — kernel: `AggregateRoot.ts`
```ts
import { DomainEvent } from './DomainEvent';
import { Entity } from './Entity';

/**
 * Raíz de agregado: entidad que protege invariantes y acumula eventos de dominio.
 * El emisor `record()`; la capa de aplicación/infra hace `pullEvents()` tras persistir.
 */
export abstract class AggregateRoot<TId> extends Entity<TId> {
  private _events: DomainEvent[] = [];

  protected record(event: DomainEvent): void {
    this._events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = this._events;
    this._events = [];
    return events;
  }
}
```

### V.3 — kernel: `DomainError.ts` (LA estrategia de error — D-039)
```ts
/**
 * Estrategia de error ÚNICA del proyecto (D-039): el dominio lanza DomainError.
 * NO se usa Result/Either (evita mezclar estilos con las excepciones de NestJS).
 * La presentación mapea cada subtipo a su HTTP (ver adaptador Nest del módulo).
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}
```

### V.4 — kernel: `DomainEvent.ts` y `UseCase.ts`
```ts
/** Algo que ya pasó en el dominio. Nombre en pasado (OrderCancelled). */
export abstract class DomainEvent {
  readonly occurredOn: Date;
  protected constructor(occurredOn: Date = new Date()) {
    this.occurredOn = occurredOn;
  }
}
```
```ts
/** Un caso de uso de aplicación: una entrada, una salida, una responsabilidad. */
export interface UseCase<TInput, TOutput> {
  execute(input: TInput): Promise<TOutput>;
}
```

### V.5 — módulo: el AGREGADO `Order.ts` (aquí vive la regla de negocio)
```ts
import { AggregateRoot } from '../../../../kernel/domain/AggregateRoot';
import { DomainError } from '../../../../kernel/domain/DomainError';
import { OrderCancelled } from '../events/OrderCancelled';

/**
 * Estados del pedido — concepto de DOMINIO (el infra `enums.ts` comparte los
 * mismos valores string; el mapper traduce).
 */
export enum OrderStatus {
  PENDING = 'pending',
  PREPARING = 'preparing',
  READY = 'ready',
  PICKED_UP = 'picked_up',
  NOT_PICKED_UP = 'not_picked_up',
  CANCELLED = 'cancelled',
  READY_LATER = 'ready_later',
}

export interface OrderSnapshot {
  id: string;
  orderNumber: number;
  status: OrderStatus;
}

export class Order extends AggregateRoot<string> {
  private constructor(
    id: string,
    public readonly orderNumber: number,
    private _status: OrderStatus,
  ) {
    super(id);
  }

  /** Reconstruye desde persistencia (sin disparar eventos de creación). */
  static rehydrate(snapshot: OrderSnapshot): Order {
    return new Order(snapshot.id, snapshot.orderNumber, snapshot.status);
  }

  get status(): OrderStatus {
    return this._status;
  }

  /** REGLA DE NEGOCIO: el dueño sólo puede cancelar un pedido PENDING. */
  cancelByOwner(): void {
    if (this._status !== OrderStatus.PENDING) {
      throw new DomainError('Solo puedes cancelar pedidos pendientes');
    }
    this._status = OrderStatus.CANCELLED;
    this.record(new OrderCancelled(this.id));
  }
}
```

### V.6 — módulo: el PUERTO `order.repository.port.ts` (habla `Order`, NO `OrderEntity`)
```ts
import { Order } from '../entities/Order';

/**
 * PUERTO. Habla en tipos de DOMINIO (Order), nunca en OrderEntity (TypeORM).
 * Ésta es la diferencia con el domain/order/order.repository.ts VIEJO, que
 * importaba OrderEntity y por eso violaba dependency-rules §2.
 */
export interface OrderRepositoryPort {
  findOwned(orderId: string, ownerUserId: string): Promise<Order | null>;
  save(order: Order): Promise<void>;
}

export const ORDER_REPOSITORY_PORT = Symbol('OrderRepositoryPort');
```

### V.7 — módulo: el MAPPER `order.mapper.ts` (único punto que conoce ambos mundos)
```ts
import { OrderEntity } from '../../../../infrastructure/database/entities/order.entity';
import { OrderStatus as PersistedStatus } from '../../../../infrastructure/database/entities/enums';
import { Order, OrderStatus } from '../../domain/entities/Order';

export class OrderMapper {
  static toDomain(entity: OrderEntity): Order {
    return Order.rehydrate({
      id: entity.id,
      orderNumber: entity.orderNumber,
      status: entity.status as unknown as OrderStatus, // mismos valores string
    });
  }

  static applyToEntity(order: Order, entity: OrderEntity): OrderEntity {
    entity.status = order.status as unknown as PersistedStatus;
    return entity;
  }
}
```

### V.8 — módulo: el CASO DE USO `cancel-order.use-case.ts` (orquesta, no decide)
```ts
import { DomainError } from '../../../kernel/domain/DomainError';
import { UseCase } from '../../../kernel/domain/UseCase';
import { OrderRepositoryPort } from '../domain/ports/order.repository.port';

export interface CancelOrderInput {
  orderId: string;
  ownerUserId: string;
}

/** No encontrado / no es tuyo. Subtipo de DomainError → la presentación lo mapea a 404. */
export class OrderNotFoundError extends DomainError {}

/**
 * Caso de uso PLANO (regla 46: sin commands/queries hasta ~20 casos).
 * Carga por el puerto (que filtra por dueño), aplica la regla del agregado, persiste.
 * La invariante vive en Order, NO aquí.
 */
export class CancelOrder implements UseCase<CancelOrderInput, void> {
  constructor(private readonly orders: OrderRepositoryPort) {}

  async execute({ orderId, ownerUserId }: CancelOrderInput): Promise<void> {
    const order = await this.orders.findOwned(orderId, ownerUserId);
    if (!order) {
      throw new OrderNotFoundError('Pedido no encontrado');
    }
    order.cancelByOwner();
    await this.orders.save(order);
  }
}
```

### V.9 — módulo: el TEST `order.spec.ts` (la verificación mínima que deja el molde)
```ts
import { DomainError } from '../../../../kernel/domain/DomainError';
import { Order, OrderStatus } from '../../domain/entities/Order';
import { OrderCancelled } from '../../domain/events/OrderCancelled';

describe('Order.cancelByOwner (spike vertical slice)', () => {
  const make = (status: OrderStatus) =>
    Order.rehydrate({ id: 'o1', orderNumber: 42, status });

  it('cancela un pedido PENDING y registra OrderCancelled', () => {
    const order = make(OrderStatus.PENDING);
    order.cancelByOwner();
    expect(order.status).toBe(OrderStatus.CANCELLED);
    const events = order.pullEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(OrderCancelled);
  });

  it('rechaza cancelar si NO está PENDING y no muta el estado', () => {
    const order = make(OrderStatus.READY);
    expect(() => order.cancelByOwner()).toThrow(DomainError);
    expect(order.status).toBe(OrderStatus.READY);
    expect(order.pullEvents()).toHaveLength(0);
  });
});
```

### El flujo completo, leído de arriba a abajo
```
HTTP DELETE /orders/:id
   │
   ▼
presentation/orders.controller.ts        (Nest: extrae id + userId del JWT)
   │  new CancelOrder(orderRepoAdapter).execute({ orderId, ownerUserId })
   ▼
application/cancel-order.use-case.ts      (orquesta: carga, delega regla, guarda)
   │  order.cancelByOwner()
   ▼
domain/entities/Order.ts                  (DECIDE: solo PENDING; emite OrderCancelled)
   │  orders.save(order)
   ▼
infrastructure/persistence/order.repository.ts + order.mapper.ts
   │  (traduce Order → OrderEntity, persiste con TypeORM)
   ▼
PostgreSQL
```

---

# PARTE VI — REGLAS DE DEPENDENCIA (fuente: `dependency-rules.md`)

## VI.A — Nivel de CAPA (dentro de un módulo)

```
Presentation  ──→  Application  ──→  Domain  ──→  (Ports)
                                                     ▲
Infrastructure ─────────────────────────────────────┘
   (Adapters IMPLEMENTAN los Ports; apuntan HACIA el dominio, nunca al revés)
```

**Permitido ✅ / Prohibido ✗:**
```
✅ Presentation   → Application            (controller invoca caso de uso)
✅ Application    → Domain / Domain Ports  (orquesta; depende de la INTERFAZ)
✅ Infrastructure → Domain Ports           (adapter IMPLEMENTA la interfaz)
✅ Infrastructure → Domain (tipos)         (el mapper conoce el agregado)
✅ Cualquier capa → kernel/domain          (Entity, DomainError, ValueObject… base)

✗ Domain          → Infrastructure         (el dominio NO conoce TypeORM/Keycloak/HTTP)
✗ Domain          → Application / Presentation
✗ Application      → Presentation
✗ Application      → Infrastructure (concreto)   (depende del PORT, no del adapter)
✗ kernel           → cualquier módulo / Infrastructure
```

Prueba mnemónica: **borra `infrastructure/` → `domain/` sigue compilando.**

## VI.B — Nivel de MÓDULO (resumen; detalle en bounded-contexts.md)
```
✅ orders → products / users / settings   (lectura, vía contracts/ del destino)
✅ orders ▷ notifications                  (por Domain Event, NO llamada directa)
✅ (todos) ← auth                           (cross-cutting: JWT/guard, no import de módulo)

✗ products/users/settings/notifications → orders   (nunca de vuelta → evita ciclos)
✗ import directo del domain/ interno de otro módulo
✗ imports circulares entre módulos          (BLOQUEADO)
```

## VI.C — Cómo se rompe un ciclo
Si B debe reaccionar a A pero A→B ya existe: **el que SABE publica un evento; el que
REACCIONA se suscribe.** Ej.: `orders` emite `OrderReady`; `notifications` lo escucha.
El emisor no conoce al receptor. Cero acoplamiento, cero ciclo.

---

# PARTE VII — BOUNDED CONTEXT MAP + CONTEXT MAP (fuente: `bounded-contexts.md`)

### Bounded Contexts (módulos reales)
| Contexto | Responsabilidad única |
|----------|----------------------|
| **auth** | Identidad, JWT, roles, MFA (Keycloak adapter, AZURE-ready) |
| **users** | Perfil del estudiante, sucursal preferida (`user-profile`) |
| **products** | Catálogo, categorías, disponibilidad, precio, stock |
| **orders** | Pedido, estados, transiciones, pago **simulado**, stock D-037 |
| **settings** | Umbrales semáforo, sucursal, horario de cooperativa |
| **notifications** | Push local ante eventos de pedido |

> `payments` NO es módulo hoy: pago **simulado dentro de orders**. Se extrae a
> `modules/payments/` solo con Stripe/AZURE real (regla 43).

### Context Map — direcciones permitidas (`──→` llamada · `──▷` por evento)
```
auth        → (cross-cutting: valida JWT de TODOS vía guards; no es dependencia de módulo)

orders  ──→ products      (lee precio / disponibilidad / stock al crear pedido)
orders  ──→ users         (lee quién pide; o vía JWT sub)
orders  ──→ settings      (lee umbrales de semáforo / horario)
orders  ──▷ notifications  (EMITE eventos; notifications se suscribe)

products    → nadie
users       → nadie
settings    → nadie
notifications → (solo escucha eventos; no llama de vuelta)
```

### Prohibiciones duras (evitan ciclos)
```
products / users / settings / notifications  ✗ NUNCA llaman orders
cualquier módulo  ✗ NUNCA importa auth como módulo (auth entra por guard/JWT)
kernel            ✗ NUNCA depende de un módulo
```

### ¿Cuándo nace un módulo nuevo? (los 3 requisitos)
1. Lenguaje ubicuo propio (términos con significado distinto a otros módulos).
2. Su propia razón de cambiar.
3. Extraíble a servicio sin arrastrar otro módulo.
Si falla alguno → es un **feature dentro** de un módulo, no un módulo. (+ reglas 43/44.)

---

# PARTE VIII — DECISION MATRIX (fuente: `decision-matrix.md`)

**Cuándo crear qué.** Si no cumples el "CREA si", NO lo creas (regla 44).

| Pieza | CREA si… | NO si… | Ejemplo UTC |
|-------|----------|--------|-------------|
| **Aggregate** | tiene identidad + ciclo de vida y protege invariantes que van SIEMPRE juntas | es solo datos sin reglas → VO o fila de query | `Order`, `Product`, `UserProfile` |
| **Value Object** | se define por su VALOR, inmutable, encapsula una regla de formato | necesita identidad o cambia en el tiempo → Entity | `Money`, `OrderNumber`, `Email @edu.utc.mx` |
| **Domain Service** | lógica que NO pertenece a UN agregado (cruza dos) | cabe dentro del agregado → ponla ahí; o es IO → caso de uso | cálculo Order+Settings (semáforo) |
| **Módulo** | cumple los 3 requisitos (PARTE VII) | falla alguno → feature dentro de un módulo | auth, orders, products… |
| **Process (front)** | flujo LARGO multi-pantalla con estado propio | cabe en una feature/page → no crees la carpeta | Checkout, Onboarding, Order Tracking |
| **Domain Event** | "algo pasó" que a OTRO le importa, o para romper un ciclo | nadie reacciona todavía → YAGNI | `OrderReady`, `OrderCancelled` |
| **Adapter** | hablar con algo EXTERNO detrás de un Port ya definido | no hay Port aún → define la interfaz primero | TypeORM repo, mock-payment, keycloak-auth |

Regla del agregado: **una transacción = un agregado.** Cambios cruzados → Domain
Event, no un mega-agregado. Evita el "service anémico" que se traga toda la lógica.

---

# PARTE IX — REGLAS DEL PROYECTO (fuente: `rules.md` — cita textual de las clave)

> El archivo `rules.md` tiene TODAS (1…46). Aquí van las estructurales completas.

### Regla 42 — Ubicación del código (YAGNI + reutilización)
Antes de escribir, ubica dónde vive el código (qué capa) y **busca si ya existe**.
**Código duplicado = BLOQUEADO** hasta encontrar la ubicación real.

### Regla 43 — Decisiones arquitectónicas: análisis obligatorio (6 preguntas)
Antes de un cambio que toca >1 módulo o mete deps nuevas, responde:
```
1. ¿Por qué aquí? (ubicación específica)
2. ¿Por qué no en otro módulo? (alternativas X/Y/Z)
3. ¿Qué dependencia nueva introduce?
4. ¿Rompe encapsulamiento?
5. ¿Aumenta el acoplamiento?
6. ¿Disminuye la cohesión?
(+7 futuro: ¿facilita mantener en 2 años? D=Durabilidad, O=Observabilidad,
 X=eXtensibilidad, I=Independencia, A=Autotestabilidad)
```
Si no puedes responderlas → **BLOQUEADO**.

### Regla 44 — No crear carpetas sin justificación (4 preguntas)
Antes de crear una carpeta nueva:
```
1. ¿Qué responsabilidad encapsula?
2. ¿Qué problema evita?
3. ¿Qué principio SOLID mejora?
4. ¿Qué ocurrirá dentro de un año si NO existe?
```
Si no puedes responder las 4 → **NO la crees.** Carpeta con un solo archivo = colapsa a plano.

### Regla 45 — No aceptar patrones por autoridad
Aunque venga de Microsoft/AWS/Google/ThoughtWorks/Fowler, **verifica primero si
aporta valor a UTC en su contexto real** (1 dev, 160h, tesis, AZURE futuro). **Critica
TODAS las decisiones antes de aceptarlas** — la de Claude, la de ChatGPT, la de cualquier libro.

### Regla 46 — Umbrales YAGNI de estructura (ver PARTE X completa)
Las sub-carpetas nacen por volumen, no por adelantado.

### Reglas de PROCESO (imprescindibles para trabajar aquí)
- **§23 — Commits/push manuales del usuario.** Claude propone; el usuario ejecuta.
- **§0 / §22 — Gate de verdad.** Nada se da por hecho sin `tsc` 0 + tests verdes + (si toca BD) verificación real contra Postgres. Si algo falla, se reporta con la salida cruda; no se maquilla.
- **§24 — Docs vivos.** Todo cambio de alcance/arquitectura/reglas actualiza el doc canónico correspondiente EN SU TONO (decisiones.md estilo ADR: Contexto·Decisión·Verificación). La doc es parte de la entrega, no opcional.
- **§17 — Regla de oro.** Nunca commitear secretos ni artefactos de build; en git solo viven los `*.env.example`.
- **§38 — Explicaciones en doble frente.** Si piden explicar: frente técnico (código real) + frente alegórico (analogía que mapea pieza por pieza). Falta uno = incompleta.

---

# PARTE X — YAGNI DE ESTRUCTURA (regla 46, con ejemplos)

**Principio:** la estructura sigue al código, no lo precede. NO se crean sub-carpetas
"para después". Umbrales concretos:

### `application/` — plano hasta ~5 casos de uso
```
# ✅ HOY (pocos casos)                    # ✅ DESPUÉS (~20 casos)
application/                              application/
├── create-order.use-case.ts             ├── commands/
├── cancel-order.use-case.ts             │   ├── create-order.use-case.ts
└── get-order.use-case.ts                │   └── cancel-order.use-case.ts
                                          └── queries/
                                              └── get-order.use-case.ts
```

### `infrastructure/` — solo `persistence/` + `external/` al inicio
```
# ✅ HOY                                   # ✅ CUANDO aparezca RabbitMQ/Redis/AZURE Queue
infrastructure/                           infrastructure/
├── persistence/                          ├── persistence/
└── external/                             ├── external/
                                          ├── messaging/   ← nace con el 1er broker real
                                          └── cache/       ← nace con el 1er Redis real
```

### `presentation/` — plano hasta tener VARIOS de un tipo
```
# ✅ HOY (un controller, un guard)         # ✅ CUANDO haya varios
presentation/                             presentation/
├── orders.controller.ts                  ├── controllers/
├── orders.module.ts                      ├── guards/
└── order.guard.ts                        ├── pipes/
                                          └── filters/
```

### `tests/` — solo `unit/` + `integration/`; `contracts/` local salvo API pública
`contract/`, `builders/`, `fixtures/` nacen cuando realmente aparezcan.
`contracts/` del módulo se promueve a `backend/contracts/` SOLO si se genera
SDK / OpenAPI client / frontend automático (deja de ser de un módulo → API pública).

### Frontend
FSD v2: `app, pages, widgets, features, entities, shared`. `processes/` SOLO para
flujos largos reales. **NO usar `flows/` además de `processes/`** (duplica).

### Regla dura
```
Carpeta con un solo archivo dentro = huele a prematura → colapsar a archivo plano.
```

---

# PARTE XI — DECISIONES CONGELADAS (fuente: `decisiones.md`)

Estas ya se debatieron. **No se re-discuten; se ejecutan.** Si crees que una está mal,
lo dices UNA vez con argumento (regla 45), no la reabres solo.

- **D-037 — Inventario "dark kitchen" (stock).** El ciclo del pedido mueve el stock. El `0` NO bloquea vender (se cocina al momento); el candado es `isAvailable`. Aceptar aparta stock; no-recogido / cancelar-listo lo devuelve (reofertable). Transiciones serializadas con **lock pesimista** + re-validación fresca; `expireOverdue` con `UPDATE…RETURNING` atómico; anti-deadlock por orden global de `productId`. **Esta lógica hoy vive en el repo TypeORM y debe migrar al agregado `Order`.**
- **D-038 — Arquitectura objetivo congelada.** Hexagonal + DDD + Vertical Slice + kernel minimalista (sin ports) + puertos en el dominio de cada módulo + CQRS ligero + contracts en el módulo. YAGNI de estructura (regla 46). Gobierno: reglas 44/45/46 + los 3 mapas.
- **D-039 — Estrategia de error ÚNICA: excepciones de dominio.** `DomainError extends Error`. **`Result`/`Either` ELIMINADOS del kernel.** VOs validan en constructor y lanzan `DomainError`; Nest mapea a HTTP. (Razón: no mezclar dos estilos de error con las excepciones que Nest ya usa; sin producción aún, se fija UNO definitivo sin costo.)
- **D-040 — Migración INCREMENTAL + spike piloto.** `modules/orders/` coexiste con el layout viejo. **NO big-bang.** El spike (kernel + Order + mapper + CancelOrder + test) ya probó el molde: `tsc` 0, 2/2 verde. Estimación de migrar `orders` completo ≈ Semana 1 (16h).

**kernel definitivo:** `Entity, AggregateRoot, ValueObject (cuando aparezca la 1ª VO),
DomainEvent, DomainError, UseCase`. Nada más. Ports NO van aquí.

---

# PARTE XII — ESTADO ACTUAL HONESTO (no asumas de más)

- ✅ **Commiteado y funcional:** auth+MFA, catálogo (GET/POST/PATCH products con @Roles), pedidos con estados + stock (D-037), panel admin (dashboard/cola/menú/detalle/reoferta/cuenta por rol), sincronización cliente↔admin, personalización (semáforo/sucursal/horario), push local, refresco de sesión (D-036), geolocalización + ruteo por cooperativa, pagos simulados. **65 tests** en el backend.
- ⚠️ **DEUDA — el `domain/` VIEJO tiene FUGA.** `backend/src/domain/order/order.repository.ts` (y sus hermanos product/settings/user-profile) **importan `OrderEntity` (TypeORM)**, `enums` de infra, DTOs de `application/` y `JwtUser`. Eso **viola `dependency-rules` §2** (domain→infra prohibido). Es una **abstracción con fugas**: interfaz colocada en `domain/` pero hablando tipos de infraestructura. **NO es DDD todavía** — es Clean anémico. El trabajo es **cerrar esa brecha** con el molde nuevo (PARTE V), no apilar sobre ella.
- ⚠️ **DEUDA `tsc` preexistente:** `application/orders/orders.service.spec.ts` tiene ~3 errores (`DataSource` pasado donde va `IOrderRepository`), del refactor a medias. Se arregla al cablear el módulo nuevo, no antes.
- ✅ **Molde probado (spike D-040):** `kernel/` + `modules/orders/` compilan limpio, 2/2 tests verdes. Es el patrón a replicar.
- 🔎 **Diferencia clave que debes internalizar:** la lógica de negocio de orders (transiciones + stock D-037) hoy está **en el repo TypeORM** (`infrastructure/database/repositories/typeorm-order.repository.ts`, ~499 líneas) y el service es un wrapper delgado (~71 líneas). Migrar = **mover esa lógica al agregado `Order`**, dejando el repo solo para persistencia.

---

# PARTE XIII — QUÉ SIGUE (plan de migración)

**Módulo piloto = `orders`** (el más rico → si aguanta, aguanta todo).

1. **Migrar `orders` completo** al molde de la PARTE V:
   - Mover TODA la lógica de negocio (transiciones + stock D-037 + concurrencia) del repo TypeORM al **agregado `Order`** (métodos `accept()`, `deliver()`, `expire()`, `cancelByOwner()`, `extend()`, con sus invariantes y eventos).
   - El **puerto** habla `Order`, no `OrderEntity`.
   - El **mapper** traduce en `infrastructure/persistence/` (incluida la traducción de `OrderStatus` dominio ⇄ infra).
   - Casos de uso **planos** en `application/`.
   - El **controller Nest** cablea el adapter TypeORM por el **símbolo del puerto** (`ORDER_REPOSITORY_PORT`) vía provider `{ provide, useClass }`.
   - **Gate:** `tsc` 0 + **los 65 tests verdes** + `dependency-rules` respetadas (borra infra mentalmente → domain compila).
2. **Retirar** el `domain/order/*.repository.ts` viejo y su impl cuando el nuevo lo reemplace (coexisten durante la migración; no antes).
3. **Replicar a los 5 restantes** — pero **más chatos** (regla 46): `products`/`settings` son casi CRUD → sin agregado rico, `application/` plano, infra solo `persistence/`. NO clones la estructura completa de orders si el módulo no la necesita.
4. Recién entonces: **OWASP L2** embebido (V6/V7/V9/V14) + **panel admin** (ver `MASTER_PLAN_8WEEKS_HEXAGONAL.md`).

**Friction ya medida (te la ahorro):** `OrderStatus` queda duplicado (enum de dominio
en `Order.ts` vs el de `infrastructure/database/entities/enums.ts`). Como comparten
valores string idénticos, el mapper puentea con `as unknown as`. Unificar (que infra
importe el enum de dominio) es un ripple aparte — hazlo con cuidado por los muchos imports.

---

# PARTE XIV — QUÉ NO HACER (errores caros ya descartados)

```
❌ Big-bang. La migración es INCREMENTAL; el repo siempre compila y los tests verdes.
❌ Meter Result/Either. Solo excepciones de dominio (D-039).
❌ Poner ports en kernel/. Van en modules/<x>/domain/ports/.
❌ Engordar shared/. helpers/utils/constants → van a su módulo o al kernel.
❌ Crear commands/queries con <5 casos, o subdividir infra/presentation/tests "por si acaso".
❌ Añadir flows/ en el frontend además de processes/.
❌ Dejar lógica de negocio en el service o el repo TypeORM. Va al AGREGADO.
❌ Sacar contracts/ a backend/contracts/ sin SDK/OpenAPI público real.
❌ El dominio importando TypeORM/Nest/HTTP (el error que tiene el domain/ viejo).
❌ Commitear/pushear por tu cuenta. Lo hace el usuario (§23).
❌ Aceptar un patrón "porque lo usa una empresa grande" sin evaluar valor real (regla 45).
❌ Crear una carpeta sin responder las 4 preguntas (regla 44).
```

---

# PARTE XV — LECTURA OBLIGATORIA + PRIMERA ACCIÓN

### Fuentes canónicas (léelas; ESTE prompt es el índice, ellas son la verdad viva)
1. `UTC-Proyecto/docs/superpowers/priority/rules.md` — reglas 1…46 (foco 42–46 + §0/§22/§23/§24).
2. `UTC-Proyecto/docs/arquitectura/bounded-contexts.md`
3. `UTC-Proyecto/docs/arquitectura/dependency-rules.md`
4. `UTC-Proyecto/docs/arquitectura/decision-matrix.md`
5. `UTC-Proyecto/docs/arquitectura/decisiones.md` — ADRs (D-037…D-040 completos).
6. `UTC-Proyecto/.claude/Architecture.md` y `UTC-Proyecto/.claude/REFACTORING_PLAN_DDD.md`
7. `UTC-Proyecto/docs/roadmap/MASTER_PLAN_8WEEKS_HEXAGONAL.md`
8. **El molde en código:** `backend/src/kernel/` + `backend/src/modules/orders/`.

### Tu primera acción (en este orden, sin saltarte pasos)
1. Lee las fuentes canónicas de arriba.
2. Estudia el molde real en código (kernel + modules/orders).
3. Corre el gate para confirmar el punto de partida:
   ```bash
   cd /home/emmanuel/projects/UTC/UTC-Proyecto/backend
   npx jest src/modules/orders --silent      # debe dar 2 passed
   npx tsc --noEmit                           # verás los ~3 errores PREEXISTENTES del spec viejo
   ```
4. Confirma que entiendes el **estado honesto** (PARTE XII) y **propón el plan de migrar
   `orders` completo** (PARTE XIII, paso 1) por escrito ANTES de tocar código, para
   validación del usuario. Incluye qué métodos tendrá el agregado `Order` y cómo
   quedará el cableado del puerto en Nest.

### Cláusula de conflicto
Si algo de ESTE prompt contradice una fuente canónica de la sección anterior, **gana
la fuente canónica** — y avísalo al usuario para corregir el prompt.

---

*Fin del contexto maestro. Si tras leerlo aún debes suponer algo estructural para
avanzar, no supongas: pregunta o repórtalo. Distancia euclidiana objetivo = 0.*
