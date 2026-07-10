# Bounded Context Map + Context Map — UTC Pick Sazón

> **Propósito:** definir qué módulos (bounded contexts) existen y **quién puede
> hablar con quién**. Evita dependencias cruzadas y ciclos. Es la ley que
> `Dependency-Rules` no cubre a nivel de módulo. Actualizar en cuanto se agregue
> o elimine un módulo (rule #24).

Decisión: **2026-07-07**. Complementa reglas 43, 44, 46.

---

## 1. Bounded Contexts (módulos reales)

| Contexto | Responsabilidad única | Estado |
|----------|----------------------|--------|
| **auth** | Identidad, JWT, roles, MFA (Keycloak adapter, AZURE-ready) | ✅ existe |
| **users** | Perfil del estudiante, sucursal preferida (`user-profile/`) | ✅ existe |
| **products** | Catálogo, categorías, disponibilidad, precio | ✅ slice (pragmático, D-046) |
| **orders** | Pedido, estados, transiciones, pago **simulado** | ✅ existe |
| **settings** | Umbrales semáforo, sucursal, horario de cooperativa | ✅ existe |
| **notifications** | Outbox de avisos (BR-012) desde Domain Events de pedido; `GET /mine` | ✅ slice real (D-045) |

> `payments` NO es módulo propio hoy: el pago está **simulado dentro de orders**.
> Se extrae a `modules/payments/` solo si entra Stripe/AZURE real (regla 43).

---

## 2. Context Map — direcciones permitidas

**Flecha = "usa / depende de". El sentido importa: nunca al revés.**

```txt
auth        → (cross-cutting, valida JWT de TODOS vía guards; no es dependencia de módulo)

orders  ──→ products      (lee precio / disponibilidad al crear pedido)
orders  ──→ users         (lee quién pide; o vía JWT sub)
orders  ──→ settings      (lee umbrales de semáforo / horario)
orders  ──▷ notifications  (EMITE Domain Events; notifications se auto-suscribe vía
                            DomainEventDispatcher — shared/events, despacho en la tx. D-045)

products    → nadie
users       → nadie
settings    → nadie
notifications → (solo escucha eventos; no llama a nadie de vuelta)
```

Leyenda: `──→` llamada directa (lectura) · `──▷` vía evento (desacoplado).

---

## 3. Prohibiciones duras (evitan ciclos)

```txt
products    ✗ NUNCA llama orders      (el catálogo no sabe de pedidos)
users       ✗ NUNCA llama orders
settings    ✗ NUNCA llama orders
notifications ✗ NUNCA llama orders    (solo reacciona a sus eventos)
cualquier módulo ✗ NUNCA importa auth como módulo (auth entra por guard/JWT)
kernel      ✗ NUNCA depende de un módulo (regla: kernel es puro)
```

Si aparece una dependencia que va en sentido contrario a §2 → **BLOQUEADO**.
Rompe el ciclo con un **Domain Event** (el que "sabe" publica; el que "reacciona"
se suscribe), como hace `orders ──▷ notifications`.

---

## 4. Regla de comunicación

- **Lectura entre módulos** (orders lee products): permitida en la dirección de §2,
  a través del **contrato público** del módulo destino (`modules/products/contracts/`),
  nunca tocando su `domain/` interno.
- **Reacción a cambios** (notificar, recalcular semáforo): **siempre por evento**,
  nunca llamada directa de vuelta. Así el emisor no conoce al receptor.

---

## 5. Cuándo nace un módulo nuevo

Un bounded context nuevo (no un feature dentro de uno existente) se justifica solo si:

1. Tiene **lenguaje ubicuo propio** (términos que no significan lo mismo en otro módulo).
2. Tiene **su propia razón de cambiar** (regla del cambio único).
3. Podría **extraerse a un servicio** sin arrastrar otro módulo.

Si no cumple los 3 → es un feature dentro de un módulo existente, no un módulo.
Aplica también reglas 43 y 44 antes de crearlo.

---

Ver también: `decisiones.md` (ADRs), reglas 43/44/46 en `superpowers/priority/rules.md`.
