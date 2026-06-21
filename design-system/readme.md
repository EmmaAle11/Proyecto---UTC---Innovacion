# UTC Pick Sazón — Sistema de Diseño

> **Pide fácil, recoge con sabor.**
> App de pedidos *Pick Up* (recoger en tienda) para la cooperativa de la UTC. Sin envíos, sin filas: el estudiante pide desde su celular, paga con tarjeta y recoge su antojo cuando está listo.

Este repositorio es el sistema de diseño de la marca: tokens de color/tipografía/espaciado, componentes React reutilizables, tarjetas de especímenes para la pestaña *Design System*, y un *UI kit* del app móvil. Úsalo para construir pantallas y materiales nuevos sin reinventar la marca.

---

## 1 · Contexto del producto

**UTC Pick Sazón** nace del proyecto de innovación de la Universidad Técnica de Cotopaxi (UTC): resolver el problema de la cooperativa estudiantil con una aplicación tipo *dark kitchen*. Características del producto:

- **Modalidad Pick Up.** No hay repartidores; el alumno recoge en el mostrador de la cooperativa.
- **Catálogo de antojos.** Papas y frituras, aguas frescas, quesadillas, hamburguesas, papas preparadas, dulces, galletas, snacks, comida rápida, postres y combos.
- **Tiempos de espera visibles.** Cada producto muestra su tiempo de preparación *antes* de pagar.
- **Estados del pedido.** `Por preparar` (con tiempo estimado) → `Preparado, listo para recoger`. Se muestra cuánto lleva listo cada producto.
- **Ventana de recogida 10–20 min.** Pasado ese lapso, el producto puede volver a ofertarse con la etiqueta **“Preparados”**.
- **Pagos:** Mercado Pago, PayPal, tarjeta de crédito (TDC), tarjeta de débito (TDD) y efectivo al recoger. Pasarelas protegidas con *circuit breaker*.
- **Inicio de sesión:** cuenta institucional UTC mediante **Outlook/Microsoft** (Keycloak federa la identidad y emite JWT; MFA solo para admins).
- **Avisos** mediante pop-ups y notificaciones push sobre el estado de preparación.

**Stack de referencia del producto:** Expo (React Native) + TypeScript + Tailwind/NativeWind (arquitectura FSD) · backend **NestJS** + TypeORM · **PostgreSQL** para almacenar pedidos y calcular tiempos promedio · **Keycloak** (realm `utc-food`) federado a Microsoft/Outlook · seguridad con JWT, roles, rate-limiting, MFA admin y circuit breaker en pagos. Ver el reporte técnico completo en `docs/Reporte-Tecnologias-Algoritmo.html`.

### Fuentes de origen
- **Repositorio del brief (GitHub):** <https://github.com/mrem10110/Proyecto---UTC---Innovacion> — contiene el planteamiento del problema y el “Algoritmo y Círculo de Innovación”. Explóralo para entender mejor el alcance funcional antes de diseñar.
- **Documento de tecnologías** (`uploads/Tecnologias Innovación .docx`) — stack frontend/backend, modelo de datos, auth, seguridad y flujos. Resumido en el reporte técnico.
- **Identidad UTC** entregada por el equipo: Azul institucional `#021E5E`, Naranja institucional `#E34100`, Blanco `#FFFFFF`.

> No asumimos que el lector tenga acceso a estos enlaces; se documentan por si lo tiene.

---

## 2 · Fundamentos de contenido (voz y copy)

- **Idioma:** español de México/LATAM. **Tuteo** siempre (“tu pedido”, “pásale a recogerlo”). Nunca “usted”.
- **Tono:** cercano, cálido y directo, como quien atiende en la cooperativa. Resolvemos el antojo, no “procesamos órdenes”.
- **Claridad sobre formalidad.** Frases cortas. Verbos de acción (“Agregar”, “Pagar y enviar a cocina”, “Recoger”).
- **Con sabor, sin caer en cursi.** Una pizca de antojo (“que llegue calientito”, “tus antojos del recreo”), sin saturar.
- **Mayúsculas:** *sentence case* en botones y títulos (“Ver pedido”, no “Ver Pedido”). Versalitas/uppercase solo en *eyebrows* y etiquetas cortas (CÓDIGO DE RECOGIDA).
- **Números:** precios con `$`, tiempos en minutos (“~12 min”), códigos de pedido tipo `A-204`. Siempre en fuente mono.
- **Emoji:** uso muy puntual y solo de comida/calor (🔥 “Popular”). Nunca emoji decorativo en texto corrido ni en UI funcional.

**Sí ✓**
- “Tu pedido está listo, pásale a recogerlo.”
- “Te avisamos cuando esté en el mostrador.”
- “Recoge en 10–20 min para que no se enfríe.”

**No ✕**
- “Su orden ha sido procesada exitosamente.”
- “Notificación: estado del pedido actualizado.”
- “Diríjase al punto de entrega designado.”

---

## 3 · Fundamentos visuales

**Colores.** Marca institucional UTC: **Azul `#021E5E`** (identidad, encabezados, fondos institucionales, tinta de texto) + **Naranja `#E34100`** (acción, botones, acentos, llamadas de atención) sobre **Blanco**. Acentos de “sabor” para estados de comida: **ámbar mango** (`por preparar`), **verde lima** (`listo`) y **naranja** (`re-ofertado / Preparados`). Neutros fríos ligeramente anclados al azul. Máximo 1–2 colores de fondo por pantalla; el resto es blanco/gris muy claro.

**Tipografía.**
- **Display / títulos:** *Bricolage Grotesque* (800), tracking −0.02em. Carácter amistoso y contemporáneo.
- **Cuerpo / UI:** *Plus Jakarta Sans* (400–700). Limpia y legible.
- **Numérico:** *Space Mono* para precios, temporizadores, cantidades y códigos (numerales tabulares).
- Escala de 11px → 60px. En UI móvil el cuerpo no baja de 14px; los CTAs usan 15–16px.

**Fondos.** Lisos: blanco para tarjetas, gris muy claro (`--surface-page`) para el lienzo. Las pantallas institucionales (login, código de recogida) usan **azul sólido** con *blobs* circulares semitransparentes naranjas/blancos como textura suave — sin gradientes “tech”. Las fotos de producto van a sangre dentro de un bloque redondeado; sin imagen, un bloque tintado `azul→naranja` muy suave con un ícono de línea centrado.

**Bordes y radios.** Generosos y amigables: tarjetas a 18–20px, botones 10–18px, chips y badges en píldora (999px). Bordes de 1px en `--border-subtle/-default`; foco/selección en 1.5–2px naranja.

**Sombras.** Suaves y tintadas de azul marino (no negro puro). Escala `xs→xl`. Los CTAs naranjas llevan un *glow* propio (`--shadow-primary`, naranja a baja opacidad) para destacar la acción.

**Estados.**
- *Hover:* botones suben 1px + se oscurecen ligeramente; tarjetas elevan la sombra y suben 2px.
- *Press:* `brightness(0.94)` (sin rebote exagerado).
- *Selección:* relleno sólido naranja (chips) o borde naranja 2px (radios/inputs/pago).
- *Focus:* anillo naranja a baja opacidad (`--ring-primary`).

**Movimiento.** Transiciones cortas (120–320ms) con `--ease-standard`. Sin loops decorativos. Hay una micro-animación funcional: en el seguimiento, el pedido pasa de *En preparación* a *Listo* tras unos segundos para demostrar el ciclo.

**Transparencia / blur.** Mínima: solo botones flotantes sobre imagen (fondo blanco ~92%). No abusamos de *glassmorphism*.

**Layout.** Lienzo móvil de 390–430px. Encabezado fijo (logo + buscar + categorías), contenido con scroll, y una **barra de acción inferior fija** (carrito / pagar / recoger). Hit targets ≥44px.

---

## 4 · Iconografía

- **Sistema:** [**Lucide**](https://lucide.dev) — íconos de línea, *stroke* 2px, esquinas redondeadas. Combinan con el carácter amistoso de la marca. Se cargan por CDN (`https://unpkg.com/lucide@latest`) y se montan con `<i data-lucide="nombre"></i>` + `lucide.createIcons()`.
- **Color del ícono:** azul institucional por defecto; naranja para acción/popular; verde lima para “listo”.
- **Íconos clave:** `utensils-crossed` (menú), `shopping-bag` (pedido), `timer` (espera), `map-pin` (recoger), `bell` (avisos), `credit-card`/`wallet` (pago), `search`, `flame` (popular), `check-circle-2` (listo). Para productos sin foto se usa un ícono de su categoría (`cup-soda`, `beef`, `cake-slice`, etc.).
- **Logo:** marca propia tipo *pin* de recogida (ver `assets/`). El “hueco” del pin evoca la ventanilla de Pick Up. Wordmark “Pick **Sazón**” con *Sazón* en naranja.
- **Emoji:** solo 🔥 en el badge “Popular”. Sin otros emoji en UI.

> ⚠️ **Lucide es una sustitución razonada:** el proyecto original aún no define un set de íconos. Si la cooperativa adopta otro, reemplázalo aquí y en los componentes.

---

## 5 · Índice / manifiesto

**Raíz**
- `styles.css` — punto de entrada global (solo `@import`). Enlaza ESTE archivo.
- `tokens/` — `colors.css`, `typography.css` (incluye `@import` de Google Fonts), `spacing.css`, `base.css`.
- `assets/` — `logo-mark.svg`, `logo-wordmark.svg`.
- `README.md` (este archivo) · `SKILL.md`.

**Especímenes (`guidelines/`)** → pestaña *Design System*
- Colores: marca, escalas naranja/azul/gris, estados de pedido, estado del sistema.
- Tipografía: display, cuerpo, numérico, escala.
- Espaciado: escala, radios, sombras.
- Marca: logotipo, voz y tono, iconografía.

**Componentes (`components/`)** — `window.UTCPickSazNDesignSystem_c294ef`
- `core/` — **Button**, **Badge**, **Chip**, **Card**, **Avatar**.
- `forms/` — **Input**, **QtyStepper**.
- `commerce/` — **ProductCard**, **OrderTracker**.

Cada componente trae `.jsx` + `.d.ts` + `.prompt.md`, y cada carpeta una tarjeta `*.card.html`.

**UI kits — dos propuestas del app móvil**
- `ui_kits/app/` — **Propuesta A · Mosaico** (azul, rejilla 2-col, navegación plana). `index.html` · `ui.jsx` · `screens.jsx`.
- `ui_kits/app-mostrador/` — **Propuesta B · Mostrador** (naranja, tab bar, feed + rail “listos ahora”). `index.html` · `screensB.jsx` (reutiliza A).

**Reporte (`docs/`)**
- `Reporte-Tecnologias-Algoritmo.html` — documento técnico imprimible: propuestas, arquitectura, modelo de datos, máquina de estados, algoritmo de tiempos y pagos.

---

## 6 · Notas y sustituciones
- **Fuentes** servidas por **Google Fonts CDN** (Bricolage Grotesque, Plus Jakarta Sans, Space Mono). No se auto-hospedan binarios; si necesitas offline, descarga los `.ttf` y añade reglas `@font-face` locales en `tokens/typography.css`.
- **Iconografía Lucide** por CDN (ver §4).
- El UI kit reproduce las primitivas del sistema de forma cosmética para funcionar de manera autónoma; en producción, consume los componentes de `components/` vía el *bundle*.
