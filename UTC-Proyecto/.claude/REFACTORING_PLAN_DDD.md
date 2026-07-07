# Plan de Migración — Clean anémico → Hexagonal + DDD + Vertical Slice

**Objetivo:** migrar el backend de **Clean Architecture anémica** (capas horizontales,
lógica en services/repos) a **Hexagonal + DDD + Vertical Slice** (`modules/<contexto>/`
con dominio rico), de forma **INCREMENTAL** (D-040), con `orders` como módulo **piloto**.

**Criterio de éxito:** 0 regresiones (los **65 tests** verdes), `tsc` 0, y
`dependency-rules` respetadas (borrar `infrastructure/` de un módulo → su `domain/`
sigue compilando).

> **Fuente de verdad de la arquitectura** (gana si hay contradicción):
> `docs/roadmap/PROMPT_CONTEXTO_ARQUITECTURA.md` + `docs/arquitectura/{decisiones.md
> (D-037…D-040), bounded-contexts.md, dependency-rules.md, decision-matrix.md}`.
> El **molde en código** ya vive y compila en `backend/src/kernel/` +
> `backend/src/modules/orders/`. Este plan solo describe cómo llevar TODO orders
> (y luego los demás módulos) a ese molde.

---

## Resumen Ejecutivo

El backend arrancó como **Clean Architecture anémica**: capas horizontales
(`application/`, `domain/`, `infrastructure/`, `presentation/`) donde el `domain/`
solo tenía **interfaces de repositorio** y la lógica de negocio vivía en los services
y en los repos TypeORM. Eso no es DDD; es un dominio anémico con una fuga de
dependencias (el "domain" importa `OrderEntity` de TypeORM — viola `dependency-rules` §2).

**La forma objetivo está CONGELADA** (D-038): Hexagonal (puertos/adapters, AZURE-ready)
+ DDD (agregados ricos, value objects, domain events) + **Vertical Slice**
(`modules/<contexto>/{contracts,domain,application,infrastructure,presentation,tests}`)
+ **kernel minimalista** (solo abstracciones de dominio, **SIN ports**) + **puertos
dentro del dominio de cada módulo** + **CQRS ligero** (carpetas `commands/`/`queries/`
solo a ~20 casos, **SIN Mediator/bus**) + **contracts dentro del módulo**.

**Estrategia de error ÚNICA** (D-039): excepciones de dominio. `DomainError extends
Error` en el kernel; los subtipos (`OrderNotFoundError`) heredan de él y Nest los mapea
a HTTP. **`Result`/`Either` ELIMINADOS.**

**El spike YA está hecho y verde** (D-040): `kernel/domain/{Entity, AggregateRoot,
DomainEvent, DomainError, UseCase}` + `modules/orders/` con el agregado `Order`, el
puerto `OrderRepositoryPort` (habla `Order`, no `OrderEntity`), el `OrderMapper`, el
caso de uso `CancelOrder` y su test. `tsc` 0, **2/2 tests** verdes. **Ese es el patrón
que TODOS los módulos replican.**

**Cambio de fondo:** `Order`/`Product`/`UserProfile` dejan de ser "modelos de BD" y se
vuelven **agregados de dominio** que expresan las reglas del negocio. La lógica que hoy
vive en `typeorm-order.repository.ts` (~499 líneas) **se mueve al agregado `Order`**;
el repo queda solo para persistir.

---

## Fase 0: Estado actual honesto (punto de partida)

> No asumas de más. Esto es lo que hay hoy en disco.

### Lo que funciona y está commiteado ✅
- auth+MFA, catálogo (GET/POST/PATCH products con `@Roles`), pedidos con estados + stock
  (D-037), panel admin, sincronización cliente↔admin, personalización (semáforo/sucursal/
  horario), push local, refresco de sesión (D-036), geolocalización + ruteo por
  cooperativa, pagos simulados. **65 tests** verdes en el backend.

### El molde nuevo, probado ✅ (spike D-040)
- `backend/src/kernel/domain/` + `backend/src/modules/orders/` compilan limpio; **2/2
  tests** del agregado verdes. Es el patrón a replicar, no a rediseñar.

### Deuda #1 — el `domain/` VIEJO tiene FUGA ⚠️
- `backend/src/domain/order/order.repository.ts` (y sus hermanos `product`, `settings`,
  `user-profile`) **importan `OrderEntity` (TypeORM)**, `enums` de infra, DTOs de
  `application/` y `JwtUser`. Eso **viola `dependency-rules` §2** (dominio → infra
  prohibido). Es una **abstracción con fugas**: interfaz colocada en `domain/` pero
  hablando tipos de infraestructura. **NO es DDD** — es Clean anémico. El trabajo es
  **cerrar esa brecha con el molde nuevo**, no apilar sobre ella.

### Deuda #2 — `tsc` preexistente en el spec viejo ⚠️
- `application/orders/orders.service.spec.ts` tiene ~3 errores `tsc` (pasa `DataSource`
  donde va `IOrderRepository`), residuo de un refactor a medias sin commitear. Se arregla
  **al cablear el módulo nuevo**, no antes.

### Diferencia clave a internalizar 🔎
- La lógica de negocio de orders (**transiciones + stock D-037 + concurrencia**) hoy vive
  en el repo TypeORM (`infrastructure/database/repositories/typeorm-order.repository.ts`,
  ~499 líneas), y el service (`application/orders/orders.service.ts`) es un **wrapper
  delgado** (~71 líneas). Migrar = **mover esa lógica al agregado `Order`**, dejando el
  repo solo para persistencia + mapeo.

### Checklist Fase 0
```
[ ] Correr el gate de partida:
      cd backend
      npx jest src/modules/orders --silent   # 2 passed (spike)
      npx tsc --noEmit                        # verás los ~3 errores PREEXISTENTES del spec viejo
[ ] Confirmar que se entiende: la lógica NO está en el service, está en el repo TypeORM.
[ ] NO tocar el domain/ viejo todavía (coexiste durante la migración — Fase 2 lo retira).
```

---

## Fase 1: Migrar `orders` COMPLETO al molde (Semana 1 ≈ 16h)

**Módulo piloto = `orders`** (el más rico → si aguanta, aguanta todo). Se lleva TODO el
comportamiento al agregado y se cablea por el puerto. El repo viejo coexiste hasta Fase 2.

### 1.1 — Enriquecer el agregado `Order` (aquí vive la regla de negocio)

Hoy `Order.ts` solo modela `cancelByOwner()`. Hay que mover **todas** las transiciones
(hoy en `transitionStatus`/`cancelOwn`/`extendOwn`/`expireOverdue` del repo) al agregado,
con sus **invariantes** y sus **eventos**. Métodos objetivo:

| Método | Transición | Invariante (lanza `DomainError` si no) | Efecto / Evento |
|--------|-----------|----------------------------------------|-----------------|
| `accept()` | `PENDING → PREPARING` | debe estar `PENDING` | fija `acceptedAt`; marca **reserva** de stock; `record(OrderAccepted)` |
| `markReady()` | `PREPARING → READY` | debe estar `PREPARING` | fija `readyAt` + `pickupDeadline` (+20 min); `record(OrderReady)` |
| `deliver()` | `READY`/`READY_LATER → PICKED_UP` | debe estar `READY`/`READY_LATER` | fija `pickedUpAt` |
| `expire()` | `READY`/`READY_LATER → NOT_PICKED_UP` | debe estar `READY`/`READY_LATER` | marca **liberación** de stock; `record(OrderNotPickedUp)` |
| `cancelByOwner()` | `PENDING → CANCELLED` | debe estar `PENDING` (**ya existe**) | `record(OrderCancelled)` |
| `extend()` | `READY → READY_LATER` | debe estar `READY` | pospone la ventana |

La tabla `ALLOWED_TRANSITIONS` del repo viejo deja de ser un `Record` externo: **cada
método encapsula su propia guarda** (más expresivo, menos "policy anémica"). Ejemplo,
en el estilo del molde real (`Order.ts`):

```ts
/** REGLA DE NEGOCIO: aceptar solo un pedido PENDING; aparta stock del almacén. */
accept(): void {
  if (this._status !== OrderStatus.PENDING) {
    throw new DomainError('Solo puedes aceptar pedidos pendientes');
  }
  this._status = OrderStatus.PREPARING;
  this._acceptedAt = new Date();
  this.record(new OrderAccepted(this.id, this.reservableLines())); // el evento LLEVA las líneas
}

/** REGLA DE NEGOCIO: un pedido listo/pospuesto no recogido libera su stock (reofertable). */
expire(): void {
  if (this._status !== OrderStatus.READY && this._status !== OrderStatus.READY_LATER) {
    throw new DomainError('Solo vence un pedido listo no recogido');
  }
  this._status = OrderStatus.NOT_PICKED_UP;
  this.record(new OrderNotPickedUp(this.id, this.reservableLines()));
}
```

**Eventos** en `modules/orders/domain/events/`: `OrderAccepted`, `OrderReady`,
`OrderNotPickedUp`, `OrderCancelled` (ya existe). Cada uno hereda de `DomainEvent`
(kernel), nombre en pasado. Se **acumulan en el agregado** vía `record()` y se
**publican tras persistir** con `pullEvents()` — **SIN bus/Mediator** (D-039). Por ahora
"publicar" = el caso de uso los recorre; `notifications` se suscribirá cuando exista
(Fase 3). No se crea infraestructura de mensajería especulativa (regla 46 / YAGNI).

> **Regla del agregado:** una transacción = un agregado. `Order` **decide**; no muta a
> otro agregado directamente.

### 1.2 — Stock D-037: cruza dos agregados → NO lo absorbe `Order`

El stock vive en **`Product`**, no en `Order`. Meter la mutación de stock *dentro* de
`Order` violaría "una transacción = un agregado" (decision-matrix). Alineación honesta:

- `Order` **decide la intención** (qué líneas reservar/liberar) y la expone en el evento
  (`OrderAccepted` / `OrderNotPickedUp` llevan `{ productId, quantity }[]`).
- **Aplicar el delta al stock de Product** es cruce de agregados → lo orquesta el **caso
  de uso** contra un **puerto de stock** (`ProductStockPort.applyDelta(lines, 'reserve'|
  'release')`), o un handler del evento. NUNCA un mega-agregado `Order` que muta productos.
- La regla D-037 (`GREATEST(0, stock − qty)` al reservar; `stock + qty` al liberar; nunca
  < 0; orden global por `productId` anti-deadlock) se conserva **idéntica**, pero vive en
  el **adapter** que implementa `ProductStockPort` (es SQL atómico = detalle de infra),
  disparada por la intención que emite el agregado.

> Esto respeta decision-matrix ("cambios cruzados → Domain Event / caso de uso, no
> mega-agregado") sin construir un Event Bus: la orquestación es una llamada directa del
> caso de uso al puerto de stock, dentro de la misma transacción.

### 1.3 — Concurrencia (lock pesimista D-037): infra + invariante

- El **lock pesimista de fila** (`FOR UPDATE` / `pessimistic_write`) es **detalle de
  persistencia** → vive en el **adapter** (el `save`/`load` del puerto abre la
  transacción y bloquea la fila, como hoy en `transitionStatus`).
- La **re-validación fresca del estado** (no revivir un terminal, no doble-reservar) es
  una **invariante del agregado**: `accept()`, `expire()`, etc. vuelven a checar
  `this._status` sobre el `Order` **rehidratado desde la fila ya bloqueada**. El puerto
  entrega el agregado fresco; el agregado se niega si el estado no da.
- `expireOverdue` (barrido) queda como caso de uso que carga los `ready` vencidos por el
  puerto y llama `order.expire()` en cada uno; el `UPDATE … RETURNING` atómico y el
  orden global por `productId` se conservan en el adapter.

### 1.4 — El puerto habla `Order`, no `OrderEntity`

`modules/orders/domain/ports/order.repository.port.ts` ya existe con el símbolo. Se
amplía para cubrir todo el ciclo, **siempre en tipos de dominio**:

```ts
export interface OrderRepositoryPort {
  findOwned(orderId: string, ownerUserId: string): Promise<Order | null>;
  findByIdForUpdate(orderId: string): Promise<Order | null>; // carga con lock (adapter)
  findOverdue(now: Date): Promise<Order[]>;
  save(order: Order): Promise<void>;
}
export const ORDER_REPOSITORY_PORT = Symbol('OrderRepositoryPort');
```

Si aparece el cruce de stock: `ProductStockPort` en `modules/orders/domain/ports/`
(o mejor, expuesto por `products` vía sus `contracts/` — decidir con regla 43 al llegar).

### 1.5 — El mapper traduce (único punto que conoce ambos mundos)

`modules/orders/infrastructure/persistence/order.mapper.ts` ya existe. Se amplía para
mapear **todos** los campos que las transiciones tocan (`acceptedAt`, `readyAt`,
`pickupDeadline`, `pickedUpAt`, items) y, crucialmente, **traducir `OrderStatus`
dominio ⇄ infra** (`enums.ts`). Comparten valores string idénticos → puente por
`as unknown as` (fricción ya medida, D-040). Unificar el enum (que infra importe el de
dominio) es un ripple aparte — **no** en esta fase.

### 1.6 — Casos de uso PLANOS en `application/`

Regla 46: **sin `commands/`/`queries/`** (esas carpetas nacen a ~20 casos). Archivos
planos, uno por caso, estilo `cancel-order.use-case.ts` real:

```
application/
├── cancel-order.use-case.ts   (ya existe — CancelOrder)
├── accept-order.use-case.ts
├── mark-ready.use-case.ts
├── deliver-order.use-case.ts
├── extend-order.use-case.ts
├── expire-overdue.use-case.ts
├── create-order.use-case.ts   (el más pesado: precios, prep adaptativa J5, pago simulado)
├── get-order.use-case.ts / list-mine / list-all / congestion / metrics (lecturas)
```

Cada uno implementa `UseCase<TInput, TOutput>` (kernel), orquesta (carga por el puerto,
delega la regla al agregado, persiste, publica eventos) y **no decide** — la invariante
vive en `Order`. Tras `save`, recorre `order.pullEvents()` y los entrega a quien
corresponda (hoy: audit/notif local; **sin bus**).

### 1.7 — Cablear el adapter por el símbolo del puerto (Nest)

En `presentation/orders.module.ts`, el provider registra el adapter TypeORM **bajo el
símbolo del puerto**:

```ts
@Module({
  providers: [
    { provide: ORDER_REPOSITORY_PORT, useClass: TypeOrmOrderRepository },
    AcceptOrder, CancelOrder, /* … casos de uso planos */,
  ],
})
```

Los casos de uso inyectan `@Inject(ORDER_REPOSITORY_PORT)`. El controller extrae
`id` + `userId` del JWT y llama al caso de uso. `DomainError` y sus subtipos se mapean a
HTTP en la capa de presentación (filter/guard Nest), no en el dominio.

### 1.8 — GATE de Fase 1 (§0/§22 — no se maquilla)
```
[ ] npx tsc --noEmit  → 0 errores (incluye arreglar el spec viejo al cablear)
[ ] npx jest          → 65 tests verdes (0 regresiones)
[ ] dependency-rules respetadas: borra mentalmente infrastructure/ del módulo →
    domain/ sigue compilando (el dominio NO importa TypeORM/Nest/HTTP)
[ ] Verificación real contra Postgres de las transiciones + stock (reserve/release,
    GREATEST(0,·), lock) — como en D-037
```

---

## Fase 2: Retirar el `domain/order/*.repository.ts` viejo

Coexisten durante la migración; **no antes**. Cuando el puerto nuevo
(`OrderRepositoryPort`) y su adapter reemplacen a `IOrderRepository`:

```
[ ] Confirmar que ningún módulo/servicio inyecta ya IOrderRepository
[ ] Eliminar backend/src/domain/order/order.repository.ts (la interfaz con fuga)
[ ] Mover/retirar TypeOrmOrderRepository al molde: su lógica de negocio ya migró al
    agregado; lo que queda (persistencia + mapeo + lock + SQL de stock/métricas) vive en
    modules/orders/infrastructure/persistence/
[ ] Retirar application/orders/orders.service.ts (wrapper) y su spec viejo
[ ] Gate: tsc 0 + 65 tests verdes
```

Cierra la deuda #1 y #2 de Fase 0.

---

## Fase 3: Replicar a los 5 módulos restantes — MÁS CHATOS (regla 46)

`products`, `users` (user-profile), `settings`, `auth`, `notifications`. **NO se clona la
estructura completa de `orders`**: la estructura sigue al código (YAGNI de estructura).

| Módulo | Forma | Nota |
|--------|-------|------|
| **products** | casi **CRUD** → **sin agregado rico** salvo la regla de disponibilidad (`isAvailable`, no bloquea en 0). `application/` plano, infra solo `persistence/`. `Money` VO solo si aporta. | El puerto de stock que orders consume lo expone products. |
| **settings** | casi CRUD singleton (umbrales semáforo/horario). Sin agregado rico. Validación `red > yellow` como invariante simple. | |
| **users** | perfil del estudiante; agregado ligero. | `ensureProfile` sale del repo de orders a su módulo. |
| **auth** | Keycloak adapter, JWT, roles, MFA. Cross-cutting (entra por guard). | AZURE-ready detrás de un puerto. |
| **notifications** | push local; **escucha eventos** de orders (`OrderReady`, etc.). | Se suscribe a los domain events que orders publica tras persistir. **Sin bus con Mediator** — suscripción directa/simple hasta que el volumen lo justifique (regla 45/46). |

Regla dura: si el módulo no necesita una carpeta, **no se crea** (carpeta con un solo
archivo = colapsa a plano). Cada módulo cumple los 3 requisitos de bounded context o es
un feature dentro de otro (bounded-contexts.md).

```
[ ] Por módulo: contracts (si hay contrato público) + domain + application plano + infra persistence
[ ] Gate por módulo: tsc 0 + tests verdes + dependency-rules
[ ] Direcciones permitidas (Context Map): orders→products/users/settings (lectura vía
    contracts), orders▷notifications (por evento). NUNCA products/users/settings/
    notifications → orders (evita ciclos).
```

---

## Fase 4: Testing y docs vivos

### 4.1 — Testing por módulo (`tests/unit/` + `tests/integration/`)
- **Unit** (dominio puro, sin Nest/BD): invariantes y transiciones del agregado + VOs +
  casos de uso con puerto mockeado. Estilo `order.spec.ts` real (verifica estado + eventos
  con `pullEvents()`).
```ts
it('rechaza aceptar si NO está PENDING y no muta el estado', () => {
  const order = make(OrderStatus.READY);
  expect(() => order.accept()).toThrow(DomainError);
  expect(order.status).toBe(OrderStatus.READY);
  expect(order.pullEvents()).toHaveLength(0);
});
```
- **Integration**: e2e del módulo contra **Postgres real** (crear → aceptar → listo →
  recoger; stock reserva/libera correctamente; lock pesimista serializa).
- **Regresión**: la suite completa (**65 tests**) verde en cada gate.
- `contract/`, `builders/`, `fixtures/` **NO** se crean por adelantado (nacen cuando
  aparezcan; regla 46).

### 4.2 — Docs vivos (§24)
- **`decisiones.md`** (estilo ADR: Contexto · Decisión · Verificación): registrar el
  cierre de la migración de orders y de cada módulo. Nueva entrada cuando orders quede
  completo (cierra D-040) y cuando se retire el domain/ viejo.
- **`Architecture.md`**: actualizar el flujo real (HTTP → controller → caso de uso →
  agregado → puerto → adapter/mapper → Postgres) e invariantes por agregado.
- Mantener `bounded-contexts.md` / `dependency-rules.md` / `decision-matrix.md` si algo
  cambia al materializar cada módulo.

---

## Riesgos y Mitigaciones

| Riesgo | Prob. | Impacto | Mitigación |
|--------|-------|---------|------------|
| Regresión en pedidos (el flujo más crítico) | Media | Alto | 65 tests como red + verificación real contra Postgres en cada gate |
| Mapeo `OrderStatus` dominio ⇄ infra falla | Media | Alto | Mismos valores string; puente `as unknown as` cubierto por test del mapper; unificar el enum se difiere (ripple) |
| Stock cruza agregados y se "cuela" a Order | Media | Medio | El agregado solo emite la **intención**; el delta lo aplica el puerto de stock (una transacción = un agregado) |
| Concurrencia: doble-reserva/liberación | Media | Alto | Lock pesimista en adapter + re-validación fresca como invariante del agregado (D-037) |
| Migración se vuelve big-bang | Baja | Crítico | INCREMENTAL: el repo SIEMPRE compila y los tests verdes; coexistencia hasta Fase 2 |
| Sobre-estructura (carpetas vacías) | Media | Bajo | Regla 46 + 44: carpeta con un archivo = colapsa a plano |

---

## Dependencias Críticas

1. **D-037 (inventario/stock)** ya está commiteado y verde — su lógica es lo que migra al
   agregado. No se re-implementa, se **mueve**.
2. **El spike D-040** (kernel + modules/orders) es la base viva — se **extiende**, no se
   rediseña.
3. **Keycloak + JWT**: no cambia. `Order` tiene `ownerUserId` (keycloak sub); auth entra
   por guard, nunca como import de módulo.
4. **Schema PostgreSQL**: no cambia. Es **reinterpretación desde el dominio** (mapper),
   no migración de BD.

---

## Líneas de Código — Límites (alerta temprana)

| Pieza | Objetivo | Alerta | Crítico |
|-------|----------|--------|---------|
| Agregado (`Order.ts`) | 200 | 300 | 400 |
| Caso de uso (plano) | 80 | 150 | 250 |
| Controller | 100 | 150 | 200 |
| Adapter/repo (persistencia) | 300 | 400 | 500 |
| Mapper | 80 | 150 | 250 |
| Value Object | 50 | 100 | 150 |

Si `Order.ts` cruza 400 líneas → refactor en la misma semana (posible señal de que una
regla debería ser un **Domain Service** o de que falta un VO). El límite es alerta, no
dogma (regla 45).

---

## Timeline (alineado a `MASTER_PLAN_8WEEKS_HEXAGONAL.md`)

| Semana | Hito | Gate |
|--------|------|------|
| **1** (≈16h) | **orders COMPLETO** al molde: agregado con todas las transiciones + stock D-037 vía puerto + adapter cableado por símbolo + casos de uso planos | tsc 0 · **65 tests** · dependency-rules · Postgres real |
| 1–2 | Fase 2: retirar `domain/order` viejo + `orders.service` wrapper (coexistencia → reemplazo) | tsc 0 · 65 tests |
| 2–3 | Fase 3: `products` / `settings` (chatos, casi CRUD) + `users` | tsc 0 · tests · dependency-rules por módulo |
| 3 | Fase 3: `auth` (puerto Keycloak, AZURE-ready) + `notifications` (escucha eventos de orders) | idem |
| 3–4 | Fase 4: testing (unit por agregado + integration contra BD real) + docs vivos (ADR de cierre) | suite completa verde |

Luego (fuera de este plan de migración): OWASP L2 embebido (V6/V7/V9/V14) + panel admin,
según el Master Plan.

---

## Qué NO hacer (errores caros ya descartados — D-038/D-039/D-040)

```
❌ Big-bang. La migración es INCREMENTAL; el repo siempre compila y los tests verdes.
❌ CommandBus / QueryBus / Mediator / Event Bus con Mediator. → CQRS LIGERO: casos de uso
   PLANOS; eventos acumulados en el agregado (record/pullEvents), publicados tras persistir.
❌ Result / Either. → Solo excepciones de dominio (DomainError). D-039.
❌ commands/ y queries/ con <20 casos. → application/ plano.
❌ Layout horizontal (domain/order, application/orders, infrastructure/ globales). →
   VERTICAL SLICE: modules/<contexto>/{contracts,domain,application,infrastructure,
   presentation,tests} + kernel/domain/.
❌ Ports en kernel/. → Van en modules/<x>/domain/ports/. El kernel = Entity/AggregateRoot/
   ValueObject/DomainEvent/DomainError/UseCase. Nada más.
❌ Dejar lógica de negocio en el service o el repo TypeORM. → Va al AGREGADO.
❌ El dominio importando TypeORM/Nest/HTTP (la fuga del domain/ viejo).
❌ Mega-agregado Order que muta stock de Product. → Cruce = evento/caso de uso, no un agregado gigante.
❌ Engordar shared/. → Lo de un módulo va al módulo; lo base al kernel.
❌ Crear carpetas sin justificar (regla 44) o subdividir "por si acaso" (regla 46).
❌ Commitear/pushear por tu cuenta. Lo hace el usuario (§23).
```
