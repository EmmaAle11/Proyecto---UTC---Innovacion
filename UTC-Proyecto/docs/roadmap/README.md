# Roadmap — UTC Pick Sazón

**Índice de navegación del proyecto de tesis.** Arquitectura congelada, ejecución secuencial con overlap, 1 dev, ~160h en 8 semanas. **Deadline: 2026-09-07.**

---

## 🧭 Punto de entrada #1 (empieza AQUÍ)

Todo dev o Claude nuevo lee PRIMERO y COMPLETO:

### → [`PROMPT_CONTEXTO_ARQUITECTURA.md`](./PROMPT_CONTEXTO_ARQUITECTURA.md)

Es el **contexto maestro**: qué arquitectura tenemos, por qué, cómo replicarla, estado honesto y primera acción. Es autosuficiente y actúa como índice de las fuentes canónicas (que ganan si hay contradicción). No abras nada más hasta terminarlo.

---

## 🏛️ Documentos de gobierno de arquitectura (`docs/arquitectura/`)

| Documento | Qué responde |
|-----------|--------------|
| [`decisiones.md`](../arquitectura/decisiones.md) | ADRs (registro vivo D-001…D-040). **Por qué** se decidió cada cosa. |
| [`bounded-contexts.md`](../arquitectura/bounded-contexts.md) | **Quién habla con quién**: Bounded Context Map + Context Map (direcciones permitidas, prohibiciones anti-ciclo). |
| [`dependency-rules.md`](../arquitectura/dependency-rules.md) | **Qué puede importar qué** por capa y por módulo (el más consultado). |
| [`decision-matrix.md`](../arquitectura/decision-matrix.md) | **Cuándo crear** cada pieza (Aggregate/VO/Service/Módulo/Event/Adapter/Process). |

---

## 🗓️ Plan de ejecución

### → [`MASTER_PLAN_8WEEKS_HEXAGONAL.md`](./MASTER_PLAN_8WEEKS_HEXAGONAL.md) — **VIGENTE**
Plan secuencial-con-overlap de 8 semanas / 160h para 1 dev. Módulo piloto `orders` primero; luego los 5 restantes (más chatos); después OWASP L2 embebido + panel admin.

### ~~`MASTER_PLAN_8WEEKS.md`~~ — **SUPERADO / histórico**
El plan viejo de "3 frentes paralelos" (OWASP + DDD + Admin en simultáneo). Asumía varios devs y un panel admin web separado; ambos descartados. Se conserva solo como referencia histórica. **No lo uses para planear.**

---

## 📏 Reglas del proyecto

### → [`docs/superpowers/priority/rules.md`](../superpowers/priority/rules.md)
Todas las reglas (1…46). Foco para arquitectura y proceso:
- **42–46** — ubicación del código, análisis arquitectónico obligatorio, no crear carpetas/patrones sin justificar (YAGNI + regla 45: no aceptar por autoridad).
- **§0 / §22** — gate de verdad: `tsc` 0 + tests verdes + verificación real contra Postgres. Nada se maquilla.
- **§23** — commits/push los hace el **usuario a mano**; Claude propone, no ejecuta.
- **§24** — docs vivos: todo cambio de arquitectura actualiza el doc canónico en su tono.

---

## 🏗️ Arquitectura vigente (una frase)

**Hexagonal + DDD + Vertical Slice (`modules/`) + kernel minimalista (sin ports) + CQRS ligero + FSD v2 en el frontend.**

**Estado:** migración **incremental** en curso (NO big-bang). `orders` es el módulo **piloto**; el spike D-040 (kernel + agregado `Order` + mapper + caso de uso + test) ya probó el molde: `tsc` 0, tests verdes. El resto de módulos replican ese patrón, más chatos según lo pida el volumen (regla 46).

Regla mental que lo une: **borra `infrastructure/` de un módulo → su `domain/` debe seguir compilando.**

---

## ⚙️ Stack confirmado (decidido — sin pendientes)

- **Backend:** NestJS 11 + TypeORM + PostgreSQL 16.
- **App:** React Native + Expo (SDK 53+). **Cliente y admin viven en la MISMA app, separados por rol** — NO hay web admin separada. Dev build APK = solo Android.
- **Auth:** Keycloak local (JWT + roles + MFA TOTP admin), **AZURE-ready** (nuevo adapter, dominio intacto).
- **Pagos:** **simulados** dentro de `orders` (Stripe/AZURE real = futuro).
- **Notificaciones:** push local (Opción A).

**Puertos en este equipo** (remapeados por otro proyecto): PostgreSQL **5433**, Keycloak **8082**, backend Nest **3002**.

---

## 🚀 Cómo usar este roadmap

1. Lee `PROMPT_CONTEXTO_ARQUITECTURA.md` completo.
2. Lee los 4 docs de gobierno y `rules.md` (foco 42–46).
3. Estudia el molde real en código: `backend/src/kernel/` + `backend/src/modules/orders/`.
4. Sigue `MASTER_PLAN_8WEEKS_HEXAGONAL.md` semana a semana; cada cierre pasa el gate (§22).

**Inicio:** 2026-07-07 · **Deadline:** 2026-09-07.
