# Fase 1.5 — Ordenar el repo y recortar el design-system a esenciales · UTC Pick Sazón

**Fecha:** 2026-06-21
**Estado:** Aprobado en brainstorming — pendiente de plan de implementación.
**Etiqueta del usuario:** "Fase 1.5". **Orden real:** se ejecuta **ahora**, antes de retomar el Task 2 de Fase 0 (infra Docker).

---

## 1. Objetivo

El usuario se siente perdido ante el volumen de archivos del `design-system/` (components, guidelines, tokens…). Objetivo: **dejar el repo ordenado y borrar lo que no aporta valor para construir la app**, conservando solo la referencia de marca útil. Como efecto, el `design-system/` pasa de ~63 a ~30 archivos y queda claro qué es código y qué es referencia.

**Modelo mental que guía el diseño:** en el repo hay (1) **el diseño** (`design-system/`, referencia de marca, no es código de la app) y (2) **la app** (`frontend/`/`backend/`/`infra/`, aún por crear). La sobrecarga viene de (1); se recorta a lo esencial.

---

## 2. Decisiones de diseño (resueltas en brainstorming)

1. **Hogar de decisiones:** nuevo `docs/decisiones.md` (registro ADR-ligero).
2. **Nivel de limpieza del design-system:** **Esenciales** (recortar, no solo etiquetar).
3. **Referencias rotas a la Propuesta A:** arreglar lo nuestro; no se mantiene el "espejo intocable".
4. **Cambio de decisión previa:** se **revierte D-004 "espejo intocable"**. Ahora el `design-system/` es una **referencia recortada**; lo borrado es **re-descargable** desde Claude Design (projectId `c294ef42-5093-49e5-bf0e-186c8e8af540`). Se pierde la re-sincronización de un clic — aceptado por el usuario.

---

## 3. Hallazgos del barrido (alta confianza)

Búsqueda nativa (PowerShell; `rg` no disponible) + inspección de dependencias y de git:

1. **El prototipo de la Propuesta B está ROTO.** `ui_kits/app-mostrador/index.html` (líneas 24–25) carga `../app/ui.jsx` y `../app/screens.jsx`, que **Task 1 borró** (commit `ec74486`). Sin ellos, B no renderiza (el loop `start()` espera `window.LoginB`/`window.Product` para siempre). **Recuperables de git** (`c24be91`).
2. **`styles.css` es necesario** y NO se borra: tanto el prototipo B (`../../styles.css`) como el reporte (`../styles.css`) lo enlazan; importa los tokens.
3. **El reporte enlaza `../styles.css`** (línea 8) y usa tokens (`var(--azul-700)`…). Si se mueve a `docs/`, hay que reapuntar el link a `../design-system/styles.css` o pierde estilos.
4. **Enlaces rotos a la Propuesta A** (carpeta `ui_kits/app/`, ya borrada): en `design-system/index.html` (propio → se elimina), y menciones en `readme.md`, el reporte y `app-mostrador/README.md`.
5. **`PROPUESTA-ELEGIDA.md`**: nadie la enlaza como ruta; solo la mencionan el plan ejecutado de Task 1 y la memoria.
6. **Componentes `*.jsx` son web** (React DOM con `div`/`var()`/hover): no corren en React Native; se reimplementan en `frontend/` (spec Fase 0 §2). Bajo valor → se borran; se conservan `*.d.ts` (contrato) y `*.prompt.md` (intención).
7. **Memoria desactualizada:** `utc-design-system-import.md` describe `ui_kits/app` como existente y el `index.html` propio.

---

## 4. Alcance

### 4.1 Recortar `design-system/` a esenciales

**Conservar:**
- `tokens/` (colors, typography, spacing, base) — fuente de marca, se porta al theme.
- `assets/` (logo-mark.svg, logo-wordmark.svg).
- `styles.css` — entrada que importa tokens; la usan el prototipo B y el reporte.
- `components/**/*.d.ts` (9) + `components/**/*.prompt.md` (9) — contrato + intención para reimplementar en RN (9 familias: Avatar, Badge, Button, Card, Chip, Input, QtyStepper, ProductCard, OrderTracker).
- `ui_kits/app-mostrador/` — prototipo de la propuesta elegida (ver 4.2, queda autocontenido).
- `readme.md` — actualizado: describe que es una **referencia recortada** y enlaza el proyecto de Claude Design como fuente.

**Borrar:**
- `guidelines/` (16 html) — documentación visual re-descargable.
- `components/**/*.jsx` (9) — componentes web, no se usan en la app.
- `components/**/*.card.html` (3: core/forms/commerce) — tarjetas del panel de Claude Design.
- `SKILL.md` — definición de skill de Claude Design, sin valor en el repo.
- `index.html` (raíz de design-system, el visor creado en el import) — sus enlaces apuntan a piezas que se borran.
- `ui_kits/PROPUESTA-ELEGIDA.md` — su contenido pasa a `decisiones.md` (D-001).

**Mover:**
- `design-system/docs/Reporte-Tecnologias-Algoritmo.html` → `docs/Reporte-Tecnologias-Algoritmo.html`, **editando** su `<link rel="stylesheet" href="../styles.css">` → `href="../design-system/styles.css"`. La carpeta `design-system/docs/` queda vacía y se elimina.

### 4.2 Arreglar el prototipo B (que quede funcional)
- **Restaurar de git** (`c24be91`) a `ui_kits/app-mostrador/`: `ui.jsx` y `screens.jsx` (primitivas + pantallas compartidas Phone/Product/Cart/Tracking que B reutiliza; las pantallas A-only que incluya `screens.jsx` quedan sin usar, son inocuas).
- **Editar** `ui_kits/app-mostrador/index.html`: `src="../app/ui.jsx"` → `src="ui.jsx"`, `src="../app/screens.jsx"` → `src="screens.jsx"`.
- **Actualizar** `ui_kits/app-mostrador/README.md`: ya es autocontenido (no depende de `../app/`); ajustar esa frase. La comparación con la Propuesta A puede quedar como contexto histórico.

### 4.3 Registro de decisiones `docs/decisiones.md` (ADR-ligero)
Formato por entrada: `## D-00X · título` con `Fecha · Estado` (vigente/revertida), `Contexto`, `Decisión`, opcional `Consecuencias`. Semilla:

| ID | Decisión | Estado |
|----|----------|--------|
| D-001 | UI = **Propuesta B "Mostrador"**; Propuesta A "Mosaico" descartada y eliminada | vigente |
| D-002 | Infra = **Docker** (Postgres 16 + Keycloak 26) | vigente |
| D-002b | Infra "nativa" (sin Docker) | revertida por D-002 |
| D-003 | Layout repo = `frontend/` + `backend/` + `infra/` + `design-system/` en raíz | vigente |
| D-004 | `design-system/` = **referencia recortada** (re-descargable de Claude Design); ya **no** es espejo intocable; tokens se portan a `frontend/` | vigente |
| D-005 | Ventana de recogida = **20 min** | vigente |
| D-006 | Pagos y Push = **diferidos a fases 3–4** | vigente |
| D-007 | Stack frontend: React Navigation (no Expo Router) + Zustand | vigente |
| D-008 | **Fase 1.5**: recorte del design-system a esenciales + registro de decisiones; prototipo B reparado | vigente |

Punteros (sin duplicar): una línea en `docs/superpowers/priority/rules.md` y en el spec de Fase 0 §3 → "Registro canónico de decisiones: `docs/decisiones.md`".

### 4.4 Sincronizar memoria
- `utc-design-system-import.md`: reflejar el recorte y que `design-system/` ya no es espejo intocable (D-004 revertida); corregir rutas (`ui_kits/app` no existe; `index.html` propio eliminado).
- `utc-fase0-execution-progress.md`: anotar que `PROPUESTA-ELEGIDA.md` se consolidó en `docs/decisiones.md`.

### 4.5 No-objetivos
- No se crean `frontend/`/`backend/`/`infra/` (eso es Fase 0, Tasks 2–7).
- ~~No se renombra `Diseño interno/`~~ → **SÍ se reubicó** (D-009): `rules.md` movido a `docs/superpowers/priority/rules.md` y `Diseño interno/` eliminado.
- No se reescriben los planes/specs ejecutados salvo añadir el puntero a `decisiones.md`.
- No se edita el contenido del reporte salvo el `<link>` de estilos.

---

## 5. Estructura resultante

```
design-system/                 (~30 archivos, referencia recortada)
├─ tokens/        colors.css typography.css spacing.css base.css
├─ assets/        logo-mark.svg  logo-wordmark.svg
├─ styles.css
├─ components/    core|forms|commerce → *.d.ts + *.prompt.md
├─ ui_kits/app-mostrador/   index.html · ui.jsx · screens.jsx · screensB.jsx · README.md
└─ readme.md

docs/
├─ algoritmo-circulo-innovacion.md
├─ architecture-propuesta.md
├─ decisiones.md                        (nuevo)
├─ Reporte-Tecnologias-Algoritmo.html   (movido; link de estilos arreglado)
└─ superpowers/{plans,specs}/
```

---

## 6. Verificación (rules §0 — evidence-or-block)

1. `design-system/` recortado según 4.1 (conteo ~33; carpetas `guidelines/`, `docs/` ya no existen; sin `*.jsx`/`*.card.html`/`SKILL.md`/`index.html`/`PROPUESTA-ELEGIDA.md`).
2. **Prototipo B renderiza:** servir `design-system/` por HTTP y abrir `ui_kits/app-mostrador/index.html`; screenshot headless (Edge) muestra la app (login B). Sin 404 a `../app/`.
3. `docs/Reporte-…html` abre **con estilos** (link a `../design-system/styles.css` resuelve).
4. `docs/decisiones.md` existe con D-001…D-008 (+ D-002b).
5. Re-barrido: ningún archivo **propio** enlaza rutas borradas; `rules.md` y spec apuntan a `decisiones.md`.
6. `git status` limpio tras el commit. `git rm`/`git mv` explícitos (rules §16); commit en español terminando con `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

**FAIL-CLOSED (rules §1):** si una verificación falla, detener y diagnosticar antes de commitear.

---

## 7. Riesgos / notas

- **Se pierde la re-sincronización de un clic** con Claude Design (D-004 revertida). Mitigación: la URL/projectId queda en `decisiones.md` y todo lo borrado es re-descargable.
- **`screens.jsx` restaurado** trae también pantallas de la Propuesta A (login/home Mosaico) que B no usa; quedan inertes. Quitarlas quirúrgicamente es frágil → se dejan.
- **El reporte** sigue mencionando la Propuesta A en su prosa (histórico); fuera de alcance editarlo más allá del `<link>`.
- **`Diseño interno/`** (espacio + acento) fue reubicado como D-009: `rules.md` → `docs/superpowers/priority/rules.md`; carpeta eliminada.
