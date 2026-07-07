# Decision Matrix — UTC Pick Sazón

> **Cuándo crear qué.** Antes de crear un Aggregate, Value Object, Domain Service,
> módulo, Process, Event o Adapter, pasa por su fila. Si no cumples los "crea si",
> **no lo crees** (regla 44). Este documento ahorra cientos de decisiones de "¿dónde
> pongo esto?".

Decisión: **2026-07-07** (D-038). Ver reglas 43/44/46, [`dependency-rules.md`](./dependency-rules.md), [`bounded-contexts.md`](./bounded-contexts.md).

---

## Aggregate (raíz)

```txt
CREA si:   tiene identidad + ciclo de vida propio, y protege invariantes que deben
           cumplirse SIEMPRE juntas (transacción de consistencia).
NO si:     es solo un contenedor de datos sin reglas → probablemente un Value Object
           o una fila leída por una query.
UTC:       Order (estados + stock + transiciones), Product, UserProfile.
Regla:     una transacción = un agregado. Cambios cruzados → Domain Event, no un
           mega-agregado.
```

## Value Object

```txt
CREA si:   se define por su VALOR, no por identidad; es inmutable; encapsula una
           regla de formato/validez (dos con el mismo valor son intercambiables).
NO si:     necesita identidad o cambia en el tiempo → es Entity/Aggregate.
UTC:       Money, OrderNumber, BranchId, Email (@edu.utc.mx).
Señal:     estás validando lo mismo en 3 lugares → encapsúlalo en un VO.
```

## Domain Service

```txt
CREA si:   la lógica de negocio NO pertenece naturalmente a UN agregado (cruza dos)
           y no es orquestación de aplicación.
NO si:     la lógica cabe dentro del agregado (método de Order) → ponla ahí primero.
NO si:     es coordinación/transacción/IO → eso es un caso de uso (application).
UTC:       cálculo que mira Order + Settings (semáforo) sin dueño único.
Riesgo:    el "service" que se traga toda la lógica y deja agregados anémicos. Evítalo.
```

## Módulo (bounded context)

```txt
CREA si:   (1) lenguaje ubicuo propio (términos con significado distinto a otros),
           (2) su propia razón de cambiar, (3) extraíble a servicio sin arrastrar otro.
NO si:     falla alguno de los 3 → es un feature DENTRO de un módulo existente.
UTC hoy:   auth, users, products, orders, settings, notifications.
           payments = simulado dentro de orders (se separa solo con Stripe/AZURE real).
Antes:     pasa reglas 43 y 44.
```

## Process (frontend, FSD `processes/`)

```txt
CREA si:   es un flujo LARGO multi-pantalla con estado propio que cruza features.
NO si:     cabe en una feature o una page → déjalo ahí (regla 46: no crear la carpeta).
NO uses:   flows/ además de processes/ → duplica responsabilidad.
UTC:       Checkout (Carrito→Pago→Confirmación), Onboarding, Order Tracking.
```

## Domain Event

```txt
CREA si:   "algo pasó" que a OTRO módulo/handler le importa (notificar, recalcular),
           o para romper un ciclo de dependencia (el que sabe publica).
NO si:     nadie reacciona todavía → YAGNI, agrégalo cuando exista el suscriptor.
UTC:       OrderCreated, OrderReady, OrderCancelled, OrderNotPickedUp.
Nombre:    pasado + hecho consumado (OrderReady, no MakeOrderReady).
```

## Adapter (infrastructure, implementa un Port)

```txt
CREA si:   necesitas hablar con algo EXTERNO (BD, Keycloak, pago, push) detrás de un
           Port ya definido en el dominio del módulo.
NO si:     no hay Port aún → define primero la interfaz en modules/<x>/domain/ports/.
UTC:       persistence/ (TypeORM repos), external/ (mock-payment, keycloak-auth,
           azure-* stub). AZURE/Stripe = adapter nuevo, dominio intacto (2-3h).
Clave:     un Port, N adapters intercambiables. Cambiar proveedor NO toca el dominio.
```

## Contract (DTO del módulo)

```txt
CREA si:   entra/sale un dato por el borde del módulo (request/response, dto compartido).
Dónde:     modules/<x>/contracts/ por defecto.
Promueve a backend/contracts/  SOLO si generas SDK/OpenAPI/cliente público (regla 46).
```

---

## Feature vs Widget (frontend, atajo)

```txt
Feature:  aporta una CAPACIDAD con lógica (agregar al carrito, filtrar catálogo).
Widget:   bloque de UI compuesto reutilizable SIN lógica de negocio propia.
Entity:   el "sustantivo" (Order, Product): tipo + UI atómica de ese sustantivo.
```

---

Ver también: [`dependency-rules.md`](./dependency-rules.md), [`bounded-contexts.md`](./bounded-contexts.md), reglas 43–46, `decisiones.md` (D-038).
