# Fase 1.5 — Limpieza del repo y recorte del design-system · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) o superpowers:executing-plans para implementar este plan tarea-por-tarea. Los pasos usan checkbox (`- [ ]`) para tracking.

**Goal:** Dejar el repo ordenado: reparar el prototipo de la Propuesta B, recortar `design-system/` a lo esencial, mover el reporte a `docs/`, y crear un registro único de decisiones — sin tocar `frontend/`/`backend/`/`infra/`.

**Architecture:** Operaciones de archivos y documentación sobre el repo existente. `design-system/` pasa de espejo completo a **referencia recortada** (D-004 revertida). Cada tarea cierra con verificación real ejecutada y un commit (salvo la memoria, que vive fuera del repo).

**Tech Stack:** git · Node (servidor estático para verificar) · Microsoft Edge headless (screenshots) · PowerShell / Git Bash.

Spec de origen: `docs/superpowers/specs/2026-06-21-fase1-5-limpieza-repo-design.md`.

## Global Constraints

Valores verbatim del spec y de `docs/superpowers/priority/rules.md` (vinculante; reubicado desde `Diseño interno/` — ver Task 4 / D-009):

- **EVIDENCE OR BLOCK (rules §0):** toda tarea cierra con verificación real ejecutada y su salida.
- **FAIL-CLOSED (rules §1):** si una verificación falla, detener, NO commitear, diagnosticar.
- **GIT (rules §16):** nada de `git commit -a`; `git add`/`git rm`/`git mv` explícitos por ruta. No commitear secretos ni temporales. Rama de trabajo: `fase-0-cimientos`.
- **Commits:** mensaje en español; terminar con `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.
- **`design-system/` = referencia recortada (D-004):** lo borrado es re-descargable de Claude Design (projectId `c294ef42-5093-49e5-bf0e-186c8e8af540`). Ya **no** es espejo intocable.
- **Repo limpio:** los artefactos de verificación (servidor, screenshots) van a `$env:TEMP`, NUNCA al repo. `git status` debe quedar limpio tras cada commit.
- **Ruta raíz del repo:** `c:/Users/user/Proyecto---UTC---Innovacion`. Edge: `C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`. `rg` NO está disponible (usar Select-String / git).

---

### Task 1: Reparar el prototipo de la Propuesta B (autocontenido y funcional)

El prototipo B está roto: `ui_kits/app-mostrador/index.html` carga `../app/ui.jsx` y `../app/screens.jsx`, borrados en Task 1 de Fase 0. Se restauran desde git dentro de `app-mostrador/` y se reapunta el HTML.

**Files:**
- Create: `design-system/ui_kits/app-mostrador/ui.jsx` (restaurado de git `c24be91`)
- Create: `design-system/ui_kits/app-mostrador/screens.jsx` (restaurado de git `c24be91`)
- Modify: `design-system/ui_kits/app-mostrador/index.html` (reapuntar 2 `<script src>`)
- Modify: `design-system/ui_kits/app-mostrador/README.md` (nota de autocontenido)

**Interfaces:**
- Consumes: contenido histórico de `c24be91:design-system/ui_kits/app/ui.jsx` y `…/screens.jsx`.
- Produces: prototipo B renderizable en `design-system/ui_kits/app-mostrador/index.html` (define globals `Phone`, `Product`, `Cart`, `Tracking`, `Button`, etc. que `screensB.jsx` usa).

- [ ] **Step 1: Restaurar los dos archivos compartidos desde git, dentro de app-mostrador** (usar Git Bash para preservar LF)

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git show c24be91:design-system/ui_kits/app/ui.jsx      > design-system/ui_kits/app-mostrador/ui.jsx
git show c24be91:design-system/ui_kits/app/screens.jsx > design-system/ui_kits/app-mostrador/screens.jsx
```

- [ ] **Step 2: Verificar que se crearon con contenido**

```bash
wc -l design-system/ui_kits/app-mostrador/ui.jsx design-system/ui_kits/app-mostrador/screens.jsx
```
Expected: `ui.jsx` ~173 líneas, `screens.jsx` ~264 líneas, ambos > 0.

- [ ] **Step 3: Reapuntar los `<script src>` en `index.html`** (con la herramienta Edit, reemplazos exactos)

Reemplazo 1 — buscar:
```html
  <script type="text/babel" data-presets="react" src="../app/ui.jsx"></script>
```
por:
```html
  <script type="text/babel" data-presets="react" src="ui.jsx"></script>
```

Reemplazo 2 — buscar:
```html
  <script type="text/babel" data-presets="react" src="../app/screens.jsx"></script>
```
por:
```html
  <script type="text/babel" data-presets="react" src="screens.jsx"></script>
```

- [ ] **Step 4: Confirmar que ya no quedan referencias a `../app/`**

```bash
grep -n "\.\./app/" design-system/ui_kits/app-mostrador/index.html || echo "OK: sin referencias a ../app/"
```
Expected: `OK: sin referencias a ../app/`.

- [ ] **Step 5: Actualizar el README de app-mostrador** (Edit, reemplazo exacto)

Buscar:
```markdown
- `index.html` — monta React + Babel + Lucide, reutiliza `../app/ui.jsx` y `../app/screens.jsx`, carga `screensB.jsx` y gestiona tabs + navegación.
```
por:
```markdown
- `index.html` — monta React + Babel + Lucide, incluye `ui.jsx` y `screens.jsx` propios (autocontenido), carga `screensB.jsx` y gestiona tabs + navegación.
```

- [ ] **Step 6: Verificar el render real (evidence, rules §0)** — servidor temporal + screenshot headless

```powershell
$srv = "$env:TEMP\utc-serve.js"
@'
const http=require('http'),fs=require('fs'),p=require('path');
const root=process.argv[2], port=8765;
const T={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.jsx':'text/babel','.svg':'image/svg+xml','.json':'application/json','.md':'text/markdown'};
http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/index.html'; const f=p.join(root,u); if(!f.startsWith(root)){s.writeHead(403);return s.end();} fs.readFile(f,(e,d)=>{ if(e){s.writeHead(404);return s.end("404");} s.writeHead(200,{"Content-Type":T[p.extname(f)]||"application/octet-stream"}); s.end(d);});}).listen(port,()=>console.log("up"));
'@ | Set-Content -Encoding utf8 $srv
Start-Process node -ArgumentList $srv,"c:\Users\user\Proyecto---UTC---Innovacion\design-system" -WindowStyle Hidden
Start-Sleep 2
$edge="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$shot="$env:TEMP\utc-shotB.png"
Start-Process $edge -ArgumentList "--headless=new","--disable-gpu","--no-sandbox","--no-first-run","--hide-scrollbars","--user-data-dir=$env:TEMP\utc-edge","--virtual-time-budget=10000","--window-size=1280,1000","--screenshot=$shot","http://localhost:8765/ui_kits/app-mostrador/index.html" -NoNewWindow -Wait
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*utc-serve.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
if (Test-Path $shot) { "shot OK: " + (Get-Item $shot).Length + " B" } else { "shot FAILED" }
```
Luego **abrir/leer** `$env:TEMP\utc-shotB.png` (herramienta Read) y confirmar visualmente: se ve el teléfono con la pantalla de **login B (naranja)**, no un lienzo en blanco.
**Si la imagen sale en blanco o falla → FAIL-CLOSED (rules §1):** revisar rutas de `ui.jsx`/`screens.jsx`/`styles.css` antes de seguir.

- [ ] **Step 7: Limpiar temporales (fuera del repo) y confirmar repo limpio en lo tocado**

```powershell
Remove-Item "$env:TEMP\utc-serve.js","$env:TEMP\utc-shotB.png" -ErrorAction SilentlyContinue
Remove-Item "$env:TEMP\utc-edge" -Recurse -Force -ErrorAction SilentlyContinue
```
```bash
git status --short
```
Expected: solo aparecen los 4 archivos de app-mostrador (2 nuevos `??`/`A`, 2 modificados `M`); ningún temporal.

- [ ] **Step 8: Commit**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git add design-system/ui_kits/app-mostrador/ui.jsx design-system/ui_kits/app-mostrador/screens.jsx design-system/ui_kits/app-mostrador/index.html design-system/ui_kits/app-mostrador/README.md
git commit -m "Fase 1.5: reparar prototipo B (ui.jsx/screens.jsx propios, autocontenido)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Recortar el design-system a esenciales (borrados)

**Files (Delete):**
- `design-system/guidelines/` (16 html, carpeta completa)
- `design-system/components/core/Avatar.jsx`, `Badge.jsx`, `Button.jsx`, `Card.jsx`, `Chip.jsx`, `core.card.html`
- `design-system/components/forms/Input.jsx`, `QtyStepper.jsx`, `forms.card.html`
- `design-system/components/commerce/ProductCard.jsx`, `OrderTracker.jsx`, `commerce.card.html`
- `design-system/SKILL.md`
- `design-system/index.html`
- `design-system/ui_kits/PROPUESTA-ELEGIDA.md`

**Interfaces:**
- Consumes: nada.
- Produces: `design-system/` recortado. Conserva `tokens/`, `assets/`, `styles.css`, `readme.md`, `components/**/*.d.ts` (9), `components/**/*.prompt.md` (9), `ui_kits/app-mostrador/` (reparado en Task 1) y `docs/` (el reporte se mueve en Task 3).

- [ ] **Step 1: Borrar con git (rutas explícitas, rules §16)**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git rm -r "design-system/guidelines"
git rm "design-system/components/core/Avatar.jsx" "design-system/components/core/Badge.jsx" "design-system/components/core/Button.jsx" "design-system/components/core/Card.jsx" "design-system/components/core/Chip.jsx" "design-system/components/core/core.card.html" "design-system/components/forms/Input.jsx" "design-system/components/forms/QtyStepper.jsx" "design-system/components/forms/forms.card.html" "design-system/components/commerce/ProductCard.jsx" "design-system/components/commerce/OrderTracker.jsx" "design-system/components/commerce/commerce.card.html" "design-system/SKILL.md" "design-system/index.html" "design-system/ui_kits/PROPUESTA-ELEGIDA.md"
```

- [ ] **Step 2: Reescribir `design-system/readme.md`** (queda con menciones a guidelines/SKILL/Propuesta A ya borradas) — sobrescribir con la herramienta Write, contenido exacto:

```markdown
# UTC Pick Sazón — Design System (referencia recortada)

Referencia de marca de **UTC Pick Sazón** (app de pedidos Pick Up de la cooperativa UTC). Este directorio es **referencia**, no código de la app; la app vive en `frontend/`. Es una versión **recortada** del proyecto de Claude Design — lo que no está aquí es re-descargable.

- **Fuente:** Claude Design, projectId `c294ef42-5093-49e5-bf0e-186c8e8af540`.
- **Decisión asociada:** ver `../docs/decisiones.md` (D-004).

## Contenido
- `tokens/` — colores, tipografía, espaciado, base (variables CSS). **Se portan** al theme de `frontend/` (NativeWind).
- `styles.css` — punto de entrada que importa los tokens (lo usan el prototipo y el reporte técnico).
- `assets/` — logos (`logo-mark.svg`, `logo-wordmark.svg`).
- `components/` — por familia (core/forms/commerce): contrato `*.d.ts` + intención `*.prompt.md` de cada componente. **No** hay código ejecutable: los componentes se **reimplementan** en React Native en `frontend/src/shared/ui`.
- `ui_kits/app-mostrador/` — prototipo navegable (HTML) de la **Propuesta B "Mostrador"** (la elegida). Autocontenido; sírvelo por HTTP (no `file://`).

## Marca (resumen)
Azul `#021E5E` · Naranja `#E34100` · acentos de comida (ámbar "por preparar", lima "listo"). Tipografía: Bricolage Grotesque (display), Plus Jakarta Sans (cuerpo), Space Mono (números/códigos). Íconos: Lucide.

> El reporte técnico se movió a `../docs/Reporte-Tecnologias-Algoritmo.html`.
```

- [ ] **Step 3: Verificar que se conservó lo esencial, se borró el resto y el readme quedó limpio**

```bash
test ! -d design-system/guidelines && echo "guidelines borrado OK"
ls design-system/components/core      # esperado: solo *.d.ts y *.prompt.md (sin .jsx ni .card.html)
test -f design-system/styles.css && test -f design-system/tokens/colors.css && test -f design-system/readme.md && echo "esenciales OK"
test -f design-system/components/core/Button.d.ts && test -f design-system/components/core/Button.prompt.md && echo "contratos OK"
test ! -f design-system/index.html && test ! -f design-system/SKILL.md && echo "no-esenciales borrados OK"
grep -n "ui_kits/app/" design-system/readme.md || echo "readme sin refs a Propuesta A OK"
```
Expected: las 4 líneas "OK"; `ls` no muestra `.jsx` ni `.card.html`; el último `grep` imprime "readme sin refs a Propuesta A OK".

- [ ] **Step 4: Re-verificar que el prototipo B sigue renderizando** (los borrados no deben afectarlo)

Repetir el bloque de servidor + screenshot del Task 1 Step 6 (mismo comando, misma URL `…/app-mostrador/index.html`), leer `$env:TEMP\utc-shotB.png` y confirmar el login B. Luego limpiar temporales (Task 1 Step 7).
**Si dejó de renderizar → FAIL-CLOSED:** algún borrado afectó una dependencia; revertir y revisar.

- [ ] **Step 5: Confirmar git status**

```bash
git status --short
```
Expected: borrados (`D`) de las rutas listadas + `design-system/readme.md` modificado (`M`); ningún temporal.

- [ ] **Step 6: Commit**

```bash
git add design-system/readme.md
git commit -m "Fase 1.5: recortar design-system a esenciales (borrar guidelines, .jsx web, .card.html, SKILL, visor; readme recortado)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Mover el reporte a docs/ y arreglar su enlace de estilos

**Files:**
- Move: `design-system/docs/Reporte-Tecnologias-Algoritmo.html` → `docs/Reporte-Tecnologias-Algoritmo.html`
- Modify: el reporte movido (1 `<link>` de estilos)

**Interfaces:**
- Consumes: `design-system/styles.css` (vía enlace relativo corregido).
- Produces: reporte accesible en `docs/` con estilos correctos; `design-system/docs/` deja de existir.

- [ ] **Step 1: Mover el archivo con git**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git mv "design-system/docs/Reporte-Tecnologias-Algoritmo.html" "docs/Reporte-Tecnologias-Algoritmo.html"
```

- [ ] **Step 2: Arreglar el enlace de estilos en el reporte movido** (Edit, reemplazo exacto)

Buscar:
```html
<link rel="stylesheet" href="../styles.css">
```
por:
```html
<link rel="stylesheet" href="../design-system/styles.css">
```

- [ ] **Step 3: Verificar la ruta y que la carpeta vieja desapareció**

```bash
test -f docs/Reporte-Tecnologias-Algoritmo.html && echo "reporte en docs OK"
test ! -d design-system/docs && echo "design-system/docs eliminado OK"
grep -n "design-system/styles.css" docs/Reporte-Tecnologias-Algoritmo.html && echo "link corregido OK"
```
Expected: 3 líneas "OK"; el `grep` encuentra la línea del link.

- [ ] **Step 4: Verificar que el reporte abre CON estilos** (servidor desde la RAÍZ del repo + screenshot)

```powershell
$srv = "$env:TEMP\utc-serve.js"
@'
const http=require('http'),fs=require('fs'),p=require('path');
const root=process.argv[2], port=8765;
const T={'.html':'text/html;charset=utf-8','.css':'text/css','.js':'text/javascript','.jsx':'text/babel','.svg':'image/svg+xml','.json':'application/json','.md':'text/markdown'};
http.createServer((q,s)=>{let u=decodeURIComponent(q.url.split('?')[0]); if(u==='/')u='/index.html'; const f=p.join(root,u); if(!f.startsWith(root)){s.writeHead(403);return s.end();} fs.readFile(f,(e,d)=>{ if(e){s.writeHead(404);return s.end("404");} s.writeHead(200,{"Content-Type":T[p.extname(f)]||"application/octet-stream"}); s.end(d);});}).listen(port,()=>console.log("up"));
'@ | Set-Content -Encoding utf8 $srv
Start-Process node -ArgumentList $srv,"c:\Users\user\Proyecto---UTC---Innovacion" -WindowStyle Hidden
Start-Sleep 2
$edge="C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
$shot="$env:TEMP\utc-shotReporte.png"
Start-Process $edge -ArgumentList "--headless=new","--disable-gpu","--no-sandbox","--no-first-run","--hide-scrollbars","--user-data-dir=$env:TEMP\utc-edge","--virtual-time-budget=9000","--window-size=1280,1400","--screenshot=$shot","http://localhost:8765/docs/Reporte-Tecnologias-Algoritmo.html" -NoNewWindow -Wait
Get-CimInstance Win32_Process -Filter "Name='node.exe'" | Where-Object { $_.CommandLine -like '*utc-serve.js*' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
if (Test-Path $shot) { "shot OK: " + (Get-Item $shot).Length + " B" } else { "shot FAILED" }
```
Leer `$env:TEMP\utc-shotReporte.png` y confirmar: hero **azul** con tipografía de marca (no HTML sin estilos). Limpiar temporales después (Task 1 Step 7).
**Si sale sin estilos → FAIL-CLOSED:** el enlace no resuelve; revisar la ruta corregida.

- [ ] **Step 5: Confirmar git status y commit**

```bash
git status --short   # esperado: R design-system/docs/Reporte… -> docs/Reporte… (+ modificación del link)
git commit -m "Fase 1.5: mover reporte técnico a docs/ y corregir enlace de estilos" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Decisiones (`docs/decisiones.md`) + gobernanza (reubicar rules.md) + punteros

> **Cambio absorbido (decidido 2026-06-21):** el usuario reubicó `rules.md` a `docs/superpowers/priority/rules.md`, eliminó `Diseño interno/` y borró `README.md` (raíz, intencional) — sin commitear. Esta tarea lo consolida (commit con rename), lo registra como D-009 y arregla las referencias stale. **Step 0 (abajo) va primero.**

**Files:**
- Stage move (rename): `Diseño interno/rules.md` → `docs/superpowers/priority/rules.md` (ya en el árbol, sin commitear)
- Stage delete: `README.md` (raíz; borrado intencional, se recreará en Fase 0 Task 8)
- Create: `docs/decisiones.md`
- Modify: `docs/superpowers/priority/rules.md` (1 línea de puntero, cerca del inicio)
- Modify: `docs/superpowers/specs/2026-06-20-fase0-cimientos-arquitectura-design.md` (puntero §3 + ref de ruta)
- Modify (refs stale `Diseño interno/rules.md` → nueva ruta): `docs/superpowers/plans/2026-06-20-fase0-cimientos.md`, `docs/superpowers/specs/2026-06-21-fase1-5-limpieza-repo-design.md`, este plan

**Step 0 (primero): consolidar la reubicación con historial preservado**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git status --short   # D "Diseño interno/rules.md", D README.md, ?? docs/superpowers/priority/
git add -A "Diseño interno" docs/superpowers/priority README.md
git status --short   # esperado: R "Diseño interno/rules.md" -> docs/superpowers/priority/rules.md ; D README.md
git commit -m "Fase 1.5: reubicar rules.md a docs/superpowers/priority/, eliminar Diseño interno/ y README.md raíz" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
Expected: rename (R) detectado para rules.md; README.md como D. **Si rules.md no aparece como rename → verificar contenido idéntico antes de commitear (FAIL-CLOSED).**

**Interfaces:**
- Consumes: decisiones ya existentes (spec Fase 0 §3, `rules.md`, memoria).
- Produces: fuente canónica de decisiones del proyecto enlazada desde `rules.md` y el spec de Fase 0.

- [ ] **Step 1: Crear `docs/decisiones.md`** con este contenido exacto

```markdown
# Decisiones del proyecto · UTC Pick Sazón

Registro único y canónico de decisiones (estilo ADR ligero). Para añadir una decisión, agrega una entrada `D-00X` al final con: Fecha · Estado, Contexto y Decisión. Estados: `vigente` | `revertida` | `supersedida`.

## D-001 · UI: Propuesta B "Mostrador"
- Fecha: 2026-06-20 · Estado: vigente
- Contexto: dos propuestas de app (A "Mosaico" / B "Mostrador").
- Decisión: se implementa la **B** (tab bar Inicio·Pedidos·Perfil + rail "Listos ahora"); la **A** se descartó y se eliminó del repo.

## D-002 · Infraestructura: Docker
- Fecha: 2026-06-20 · Estado: vigente
- Contexto: correr PostgreSQL y Keycloak en local (Windows).
- Decisión: **Docker Compose** con imágenes oficiales (`postgres:16`, `quay.io/keycloak/keycloak:26`).

## D-002b · Infraestructura nativa (sin Docker)
- Fecha: 2026-06-20 · Estado: revertida (por D-002)
- Contexto: se valoró instalar Postgres/Keycloak nativos en Windows.
- Decisión: descartada; se usa Docker (D-002).

## D-003 · Layout del repositorio
- Fecha: 2026-06-20 · Estado: vigente
- Decisión: `frontend/` + `backend/` + `infra/` + `design-system/` en la raíz, sin herramienta de monorepo.

## D-004 · design-system = referencia recortada
- Fecha: 2026-06-21 · Estado: vigente
- Contexto: el import de Claude Design (projectId `c294ef42-5093-49e5-bf0e-186c8e8af540`) trajo ~63 archivos; abrumaba.
- Decisión: `design-system/` se **recorta a esenciales** (tokens, assets, styles.css, contratos `.d.ts`/`.prompt.md`, prototipo B, readme). Es **referencia**, no espejo intocable; lo borrado es re-descargable de Claude Design. Los tokens se portan a `frontend/`. (Revierte la decisión previa de "espejo intocable".)

## D-005 · Ventana de recogida
- Fecha: 2026-06-20 · Estado: vigente
- Decisión: la ventana de recogida es de **20 minutos**; pasado el plazo, re-oferta con tag "Preparados".

## D-006 · Pagos y Push diferidos
- Fecha: 2026-06-20 · Estado: vigente
- Decisión: pasarelas de pago (Mercado Pago/PayPal/TDC/TDD/efectivo) y notificaciones push se difieren a las fases 3–4.

## D-007 · Stack de navegación/estado del frontend
- Fecha: 2026-06-20 · Estado: vigente
- Decisión: **React Navigation** (no Expo Router, para no chocar con la capa `app` de FSD) + **Zustand** para estado ligero.

## D-008 · Fase 1.5: limpieza del repo
- Fecha: 2026-06-21 · Estado: vigente
- Decisión: recortar el design-system (D-004), reparar el prototipo B, mover el reporte a `docs/`, y centralizar decisiones aquí. `PROPUESTA-ELEGIDA.md` se consolidó en D-001 y se eliminó.

## D-009 · Gobernanza: reubicación de rules.md y limpieza de raíz
- Fecha: 2026-06-21 · Estado: vigente
- Contexto: `Diseño interno/` tenía espacio y acento (problemático para tooling, CLI y URLs).
- Decisión: `rules.md` se reubicó a `docs/superpowers/priority/rules.md` y se eliminó `Diseño interno/`. El `README.md` raíz se eliminó intencionalmente (se recreará en Fase 0 Task 8).
```

- [ ] **Step 2: Añadir puntero en `docs/superpowers/priority/rules.md`** (Edit) — insertar una línea cerca del inicio del archivo

Tras la primera línea de encabezado del archivo, añadir:
```markdown

> Registro canónico de decisiones del proyecto: `docs/decisiones.md`.
```
(Verificar primero el inicio real del archivo con `Read` y colocar la línea como segundo bloque, sin romper el formato existente.)

- [ ] **Step 3: Añadir puntero en el spec de Fase 0** (Edit) — en la sección `## 3. Decisiones confirmadas`

Buscar la línea de encabezado:
```markdown
## 3. Decisiones confirmadas
```
y dejar inmediatamente debajo:
```markdown
## 3. Decisiones confirmadas

> Registro vivo y canónico de decisiones: `docs/decisiones.md` (esta tabla queda como contexto de Fase 0).
```

- [ ] **Step 3b: Actualizar referencias stale `Diseño interno/rules.md` → `docs/superpowers/priority/rules.md`** (Edit en cada archivo)

Ubícalas con `grep -rn "Diseño interno/rules.md" .` y reemplaza la ruta en cada hit:
- `docs/superpowers/plans/2026-06-20-fase0-cimientos.md` (3 hits)
- `docs/superpowers/specs/2026-06-20-fase0-cimientos-arquitectura-design.md` (2 hits)
- `docs/superpowers/specs/2026-06-21-fase1-5-limpieza-repo-design.md` (1 hit en §4.4)
Además, en el spec de Fase 1.5 reescribe las dos menciones de "no se renombra `Diseño interno/`" / "deuda menor" (§ no-objetivos y § riesgos) para reflejar que SÍ se reubicó (ver D-009).

- [ ] **Step 4: Verificar**

```bash
test -f docs/decisiones.md && grep -c "^## D-0" docs/decisiones.md          # esperado: 10 entradas (D-001..D-009 + D-002b)
grep -n "docs/decisiones.md" docs/superpowers/priority/rules.md
grep -n "docs/decisiones.md" docs/superpowers/specs/2026-06-20-fase0-cimientos-arquitectura-design.md
grep -rn "Diseño interno/rules.md" . || echo "OK: cero refs a la ruta vieja"
```
Expected: conteo **10**; los dos `grep` de puntero lo encuentran; el último imprime "OK: cero refs a la ruta vieja" (las menciones históricas del nombre de carpeta en D-009/specs no usan la ruta `Diseño interno/rules.md`).

- [ ] **Step 5: Commit (decisiones + punteros + refs)**

```bash
git add docs/decisiones.md docs/superpowers/priority/rules.md docs/superpowers/specs/2026-06-20-fase0-cimientos-arquitectura-design.md docs/superpowers/plans/2026-06-20-fase0-cimientos.md docs/superpowers/specs/2026-06-21-fase1-5-limpieza-repo-design.md docs/superpowers/plans/2026-06-21-fase1-5-limpieza-repo.md
git commit -m "Fase 1.5: registro único de decisiones (docs/decisiones.md), punteros y refs a nueva ruta de rules.md" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```
(El commit del **Step 0** — reubicación de rules.md + borrado de README — es aparte y va primero.)

---

### Task 5: Sincronizar memoria + verificación final integral

**Files (fuera del repo — memoria, sin commit):**
- Modify: `…/memory/utc-design-system-import.md`
- Modify: `…/memory/utc-fase0-execution-progress.md`

**Interfaces:**
- Consumes: el estado final del repo tras Tasks 1–4.
- Produces: memoria coherente + evidencia de cierre (DoD rules §19).

- [ ] **Step 1: Actualizar `utc-design-system-import.md`** (Edit)
Reflejar: `design-system/` ahora es **referencia recortada** (D-004 revertida, ya no espejo intocable); `ui_kits/app/` no existe; el visor `index.html` se eliminó; el prototipo B es autocontenido; el reporte está en `docs/`. Apuntar a `[[utc-project-scope-phasing]]` y a `docs/decisiones.md`.

- [ ] **Step 2: Actualizar `utc-fase0-execution-progress.md`** (Edit)
Anotar que se ejecutó la **Fase 1.5** (limpieza/recorte) y que `PROPUESTA-ELEGIDA.md` se consolidó en `docs/decisiones.md`.

- [ ] **Step 3: Verificación final — sin enlaces rotos en archivos PROPIOS**

```powershell
$root = "c:\Users\user\Proyecto---UTC---Innovacion"
Get-ChildItem -Recurse -File $root -Force | Where-Object { $_.FullName -notmatch '\\\.git\\' } |
  Select-String -Pattern 'ui_kits/app/|PROPUESTA-ELEGIDA' |
  ForEach-Object { $_.Path.Replace($root+'\','') + ':' + $_.LineNumber + ': ' + $_.Line.Trim() }
```
Expected: las ÚNICAS coincidencias permitidas son históricas/descriptivas (el plan ejecutado de Fase 0, el spec de Fase 0, y la prosa del reporte). **Ningún** archivo "vivo" propio (ningún `index.html`, ninguna config) debe enlazar `ui_kits/app/`. Si aparece un enlace funcional roto → FAIL-CLOSED.

- [ ] **Step 4: Verificación final — conteo del design-system y árbol**

```powershell
$ds = "c:\Users\user\Proyecto---UTC---Innovacion\design-system"
"design-system files: " + (Get-ChildItem -Recurse -File $ds | Measure-Object).Count   # esperado: ~30
Get-ChildItem $ds | Select-Object -ExpandProperty Name                                  # esperado: assets, components, tokens, ui_kits, readme.md, styles.css
```
Expected: ~30 archivos; en la raíz quedan `assets/ components/ tokens/ ui_kits/ readme.md styles.css` (sin `guidelines/`, `docs/`, `index.html`, `SKILL.md`).

- [ ] **Step 5: Verificación final — git limpio e historial**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git status --short          # esperado: vacío
git log --oneline -5        # esperado: los 4 commits de Fase 1.5 + el del design doc
```
Expected: `git status` vacío; se ven los commits de Fase 1.5.

- [ ] **Step 6: Cierre DoD (rules §19)**
Redactar el cierre: **Observaciones · Riesgos · Validaciones realizadas · Validaciones pendientes · Supuestos · Nivel de confianza (objetivo 95–100%)**. Incluir como evidencia los screenshots vistos (prototipo B y reporte) y los conteos.

---

## Notas de ejecución

- **Orden:** Task 1 (reparar B) va primero a propósito: deja funcionando lo que se conserva antes de recortar alrededor.
- **Temporales SIEMPRE en `$env:TEMP`** (servidor, screenshots, perfil de Edge); nunca en el repo, para que `git status` quede limpio.
- **`screens.jsx` restaurado** incluye pantallas de la Propuesta A (login/home Mosaico) que B no usa; quedan inertes — es esperado, no se eliminan.
- **Memoria** (Task 5) vive fuera del repo: no genera commit; es higiene + evidencia de cierre.
