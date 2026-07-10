# Dependency Rules — UTC Pick Sazón

> **El documento que más se consulta.** Define qué puede depender de qué, a nivel
> de **capa** (dentro de un módulo) y a nivel de **módulo** (entre bounded contexts).
> Si una dependencia no está permitida aquí → **BLOQUEADO** (reglas 43/44).
> El nivel de módulo vive en [`bounded-contexts.md`](./bounded-contexts.md); esto lo complementa hacia adentro.

Decisión: **2026-07-07** (D-038). Ver reglas 44/45/46.

---

## 1. Regla de oro (la dirección de las flechas)

```txt
Presentation  ──→  Application  ──→  Domain  ──→  (Ports)
                                                     ▲
Infrastructure ─────────────────────────────────────┘
   (Adapters implementan los Ports; apuntan HACIA el dominio, nunca al revés)
```

**Todo apunta al Domain. El Domain no apunta a nadie.**

---

## 2. Permitido ✅ / Prohibido ✗ (nivel de capa)

```txt
✅ Presentation   → Application            (controller invoca caso de uso)
✅ Application    → Domain                 (orquesta agregados, policies)
✅ Application    → Domain Ports           (depende de la INTERFAZ, no del adapter)
✅ Infrastructure → Domain Ports           (adapter IMPLEMENTA la interfaz)
✅ Infrastructure → Domain (tipos)         (mapper conoce el agregado para mapearlo)
✅ Cualquier capa → kernel/domain          (Entity, DomainError, ValueObject… son base)
✅ Domain         → kernel/domain          (extiende AggregateRoot, ValueObject…)

✗ Domain          → Infrastructure         (el dominio NO conoce TypeORM/Keycloak/HTTP)
✗ Domain          → Application            (el agregado no sabe de casos de uso)
✗ Domain          → Presentation           (jamás)
✗ Application      → Presentation          (el caso de uso no sabe de HTTP/Nest)
✗ Application      → Infrastructure (concreto)  (depende del PORT, no del adapter TypeORM)
✗ kernel           → cualquier módulo       (kernel es puro; no sabe de orders/auth/…)
✗ kernel           → Infrastructure         (jamás)
```

Regla mnemónica: **si borro toda la carpeta `infrastructure/`, el `domain/` debe
seguir compilando.** Si no compila, hay una flecha prohibida.

> **Excepción documentada (D-043, hermana de D-041) — puertos clásicos entity-as-model.**
> Los contextos SIN slice propio (products-CRUD, settings, identity/auth) usan la **entidad
> TypeORM como modelo compartido** (estilo anémico deliberado; forzarles modelos de dominio +
> mappers es la ceremonia que D-038/regla 46 rechazan). Por eso su puerto vive en
> `application/<ctx>/*.repository.port.ts` y **sí** importa la entidad (`Application → Infra tipos`).
> Es una excepción **acotada y consciente**, no una flecha libre: el `domain/` puro (sólo
> vocabulario/`enums.ts`) y todo `modules/*/domain` siguen sin tocar `infrastructure/`. La
> regla mnemónica se cumple para el dominio; la excepción es sólo para estos puertos de
> persistencia clásicos.

---

## 3. Nivel de módulo (resumen — detalle en bounded-contexts.md)

```txt
✅ orders        → products / users / settings   (lectura, vía su contracts/, en esa dirección)
✅ orders        ▷ notifications                  (por Domain Event, no llamada directa)
✅ (todos)       ← auth                            (cross-cutting: JWT/guard, NO import de módulo)

✗ products/users/settings/notifications → orders   (nunca de vuelta → evita ciclos)
✗ cualquier módulo → import directo de otro módulo (auth/*, orders/domain/* interno)
✗ imports circulares entre módulos                 (BLOQUEADO)
```

Comunicación entre módulos: **solo por `contracts/` del destino** (lectura en la
dirección permitida) o **por evento** (reacción). Nunca tocando su `domain/` interno.

---

## 4. shared/ y kernel/ — qué NO puede entrar

```txt
✗ shared/  → lógica de negocio     (si es de un módulo, va al módulo — regla 44)
✗ kernel/  → dependencias de módulo (kernel no conoce a nadie)
✗ kernel/  → ports concretos        (IEmailSender/IPaymentGateway viven en el módulo)
```

---

## 5. Cómo se rompe un ciclo

Si necesitas que B "avise" a A pero A→B ya existe (ej. `orders` necesita que
`notifications` reaccione, pero notifications no puede llamar a orders):

```txt
El que SABE publica un Domain Event.  →  orders emite OrderReady
El que REACCIONA se suscribe.          →  notifications escucha OrderReady
```

El emisor **no conoce** al receptor. Cero acoplamiento, cero ciclo.

---

Ver también: [`bounded-contexts.md`](./bounded-contexts.md), [`decision-matrix.md`](./decision-matrix.md), reglas 43–46.
