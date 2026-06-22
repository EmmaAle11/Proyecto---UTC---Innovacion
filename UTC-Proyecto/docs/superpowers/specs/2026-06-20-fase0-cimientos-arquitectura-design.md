# Fase 0 — Cimientos, organización y arquitectura · UTC Pick Sazón

**Fecha:** 2026-06-20
**Estado:** En revisión — actualizado: **infraestructura cambiada a Docker** (antes nativo). Reglas obligatorias en `docs/superpowers/priority/rules.md`.
**Proyecto:** UTC Pick Sazón — app de pedidos Pick Up para la cooperativa de la Universidad Técnica de Cotopaxi (dark kitchen, recoger en tienda, sin envíos).

---

## 1. Objetivo de la Fase 0

Dejar el repositorio **organizado y con las dos arquitecturas definidas e inicializadas**, antes de construir features. Al terminar la Fase 0:

- El `design-system/` queda como **referencia/fuente de verdad** (espejo de Claude Design), no como código de la app.
- Existe `frontend/` (Expo + React Native, arquitectura **FSD**) inicializado, con el esqueleto de capas y los **tokens portados** al theme.
- Existe `backend/` (NestJS, arquitectura **Clean**) inicializado, con el esqueleto de capas.
- Existe `infra/` con lo necesario para correr **PostgreSQL y Keycloak con Docker** (`docker-compose.yml`, imágenes oficiales).
- Los documentos del brief están ordenados en `docs/`.

**Fuera de alcance en Fase 0:** lógica de negocio, pantallas funcionales, endpoints, autenticación real, pagos y push (van en fases 1–4).

---

## 2. Hallazgo de análisis que condiciona el diseño

El import de Claude Design (`design-system/`) es un **design system para web**, no código de la app:

- Los 10 componentes (`Button`, `Badge`, `Chip`, `Card`, `Avatar`, `Input`, `QtyStepper`, `ProductCard`, `OrderTracker`) usan `React.createElement('div'/'span'/'button'/'img')`, variables CSS `var(--...)`, estilos inline web y eventos de mouse. **No corren en React Native** (no existe `div`, `var()` ni hover en RN).
- **Implicación:** los componentes son **especificación visual + contrato de API**, no se copian. Se **reimplementan** en `frontend/src/shared/ui` como componentes RN. Se conservan los `.d.ts` (props) y `.prompt.md` (intención) como guía.
- Los **tokens** (`tokens/*.css`) sí son portables: sus valores (hex, px, pesos, duraciones) se llevan a un theme de NativeWind. `box-shadow`, `cubic-bezier` y pseudo-clases requieren equivalente RN (elevation/shadow API, Easing, Pressable).
- El `design-system/` es un **espejo re-sincronizable** (projectId Claude Design `c294ef42-5093-49e5-bf0e-186c8e8af540`). Regla: **no editarlo a mano**; los cambios de marca se hacen en Claude Design y se re-sincronizan.

---

## 3. Decisiones confirmadas

> Registro vivo y canónico de decisiones: `docs/decisiones.md` (esta tabla queda como contexto de Fase 0).

| Tema | Decisión |
|---|---|
| Infraestructura | **PostgreSQL + Keycloak con Docker** (`docker compose`, imágenes oficiales) |
| Layout del repo | **`frontend/` + `backend/`** en la raíz (sin herramienta de monorepo) |
| Alcance Fase 0 | Organizar + esqueleto + **inicializar Expo y NestJS** (correr los initializers reales) |
| Propuesta de UI | **Propuesta B "Mostrador"** (tab bar Inicio/Pedidos/Perfil + rail "Listos ahora") |
| Propuesta A "Mosaico" | **Eliminar** `design-system/ui_kits/app/` del repo |
| Pagos (PayPal/Mercado Pago) y Push | **Diferidos a fases finales** (3 y 4) |

---

## 4. Estructura del repositorio (objetivo Fase 0)

```
Proyecto---UTC---Innovacion/
├─ docs/
│  ├─ algoritmo-circulo-innovacion.md      # brief original (movido)
│  ├─ architecture-propuesta.md            # brief original (movido)
│  └─ superpowers/specs/                   # este spec y los siguientes
├─ design-system/                          # ESPEJO Claude Design — referencia, NO editar a mano
│  ├─ tokens/  styles.css  assets/  guidelines/  components/  docs/
│  └─ ui_kits/app-mostrador/               # Propuesta B (la A se elimina)
├─ frontend/                               # Expo + RN + NativeWind  →  FSD
│  └─ src/{app, pages, widgets, features, entities, shared}
├─ backend/                                # NestJS  →  Clean Architecture
│  └─ src/{domain, application, infrastructure, presentation}
├─ infra/
│  ├─ docker-compose.yml   # postgres + keycloak (imágenes oficiales)
│  ├─ postgres/   # init.sql (esquema con PK/FK), montado en el contenedor
│  ├─ keycloak/   # realm-utc-food.json (import al arrancar)
│  └─ .env.example # variables (sin secretos reales)
└─ README.md
```

---

## 5. Frontend — Arquitectura FSD (Expo)

**Stack:** Expo (React Native) · TypeScript · NativeWind v4 · React Navigation (bottom-tabs + native-stack) · react-native-svg (logos) · lucide-react-native (íconos) · Zustand (estado ligero: carrito, sesión).

**Por qué React Navigation y no Expo Router:** Expo Router usa un directorio `app/` basado en archivos que choca conceptualmente con la capa `app` de FSD. React Navigation mantiene el routing en código dentro de la capa `app`/`pages`, conservando FSD limpio.

**Capas (de arriba hacia abajo; una capa solo importa de capas inferiores):**

| Capa | Propósito | Contenido inicial (Propuesta B) |
|---|---|---|
| `app` | Inicialización, providers, navegación raíz, config global | Navegador (tab bar + stacks), ThemeProvider, QueryClient/store |
| `pages` | Pantallas a nivel de ruta | `login`, `home`, `product-detail`, `cart`, `tracking`, `orders`, `profile` |
| `widgets` | Bloques visuales compuestos grandes | `header-ubicacion`, `tab-bar`, `rail-listos-ahora`, `product-feed`, `carrito-flotante` |
| `features` | Acciones del usuario | `auth` (Outlook/invitado), `add-to-cart`, `qty-stepper`, `order-tracking`, `change-status` (admin) |
| `entities` | Modelos del negocio + su UI base | `product`, `order`, `user`, `payment` |
| `shared` | Reutilizable transversal | `ui` (Button/Badge/Chip/Card/Avatar/Input/QtyStepper **reimplementados RN**), `theme` (tokens portados), `api` (cliente NestJS), `lib`, `config` |

**Tokens → theme:** se genera `shared/theme/tokens.ts` (colores, tipografía, espaciado, radios, sombras como objetos JS) + `tailwind.config.js` de NativeWind que los consume. Las 3 fuentes (Bricolage Grotesque, Plus Jakarta Sans, Space Mono) se cargan con `expo-font`.

---

## 6. Backend — Arquitectura Clean (NestJS)

**Stack:** NestJS · TypeScript · TypeORM (driver `pg`) · class-validator/class-transformer (DTO) · passport-jwt + JWKS (validación de tokens Keycloak) · @nestjs/throttler (rate limiting) · opossum (circuit breaker, en fase de pagos).

**Capas (la dependencia apunta hacia el dominio; el dominio no conoce frameworks):**

| Capa | Propósito | Contenido |
|---|---|---|
| `domain` | Núcleo puro, sin framework | Entidades de dominio (User, Product, Order, OrderItem, Payment, PreparationTime), reglas, value objects, **interfaces de repositorio (puertos)** |
| `application` | Orquestación de casos de uso | Use cases: `CrearPedido`, `EstimarTiempoPreparacion`, `MarcarPedidoListo` (registra preparación + push), `ExpirarVentanaRecogida` (re-oferta), `ProcesarPago` (circuit breaker). DTOs de aplicación |
| `infrastructure` | Adaptadores | Entidades/repositorios TypeORM, conexión PostgreSQL, cliente Keycloak, pasarelas de pago, jobs |
| `presentation` | Entrada/salida HTTP | Controllers, guards (JWT/roles), pipes (DTO validation), filters, interceptors |

**Organización física:** módulos NestJS por dominio (`auth`, `users`, `products`, `orders`, `payments`), y dentro de cada módulo se respetan las 4 capas Clean. El `domain` y `application` no importan de NestJS/TypeORM; el cableado se hace por inyección de dependencias en `infrastructure`/`presentation`.

---

## 7. Modelo de datos (referencia para Fase 1, del reporte técnico)

| Tabla | Campos clave (PK / FK) |
|---|---|
| `users` | **id PK**, email_utc, rol, created_at |
| `products` | **id PK**, nombre, categoria, precio, tiempo_base, stock, tag |
| `orders` | **id PK**, user_id **FK→users**, estado, total, accepted_at, ready_at |
| `order_items` | **id PK**, order_id **FK→orders**, product_id **FK→products**, cantidad, precio |
| `payments` | **id PK**, order_id **FK→orders**, metodo, estado, referencia |
| `preparation_times` | **id PK**, product_id **FK→products**, duracion_min, created_at |

**Algoritmo de tiempos (Fase 2):** estimación = promedio de las últimas 20 filas de `preparation_times` del producto; si <3 muestras → `products.tiempo_base` (BR-007). Al marcar "Listo": `duracion_min = minutos(ready_at − accepted_at)` (siempre **hora de servidor**, BR-005) y se inserta en `preparation_times`. Job cada minuto: si lleva listo más de la **ventana de recogida (20 min)** → estado `not_picked_up` + re-oferta con tag "Preparados" y UI "Listo hace X min" (BR-006).

**Ventana de recogida:** **20 minutos** (decisión del usuario 2026-06-20). `rules.md` §10 actualizado a 20 min para no contradecir.

**Nomenclatura y reglas de negocio (autoridad: `docs/superpowers/priority/rules.md`, incl. BR-001…BR-015):**
- **Estados del pedido (§10 / BR-004, enum):** `pending` → `preparing` → `ready` → `picked_up` / `not_picked_up` / `cancelled`. Transiciones válidas BR-004: `pending→preparing`, `preparing→ready`, `ready→picked_up`, `ready→not_picked_up`, `pending→cancelled`. Etiquetas en español solo para UI.
- **Entidades (§11):** `UserProfile`, `Product`, `Order`, `OrderItem`, `Payment`, `PreparationMetric` (tablas SQL snake_case: `user_profiles`, `products`, `orders`, `order_items`, `payments`, `preparation_times`).
- **Identidad (BR-002):** correo institucional `@email.utc.edu.ec` (o dominio oficial UTC); sin correos personales ni anónimos.
- **Pagos (BR-009):** `mercado_pago`, `paypal`, `tdc`, `tdd`, `efectivo` (efectivo sin pasarela).
- **Backend = única fuente de verdad (BR-015):** valida, autoriza, calcula, decide estados; el frontend solo muestra y solicita.

---

## 8. Infraestructura con Docker

| Servicio | Imagen / cómo corre | Puerto |
|---|---|---|
| PostgreSQL | `postgres:16` (contenedor). Base `utc_food`, `init.sql` montado | 5432 |
| Keycloak | `quay.io/keycloak/keycloak:26` (contenedor), `start-dev`, import de `realm-utc-food.json`. Realm `utc-food`, roles `user`/`admin`, MFA admin | 8080 |
| Backend | NestJS — en dev `npm run start:dev`; opcionalmente como servicio en compose (rules §12) | 3000 |
| Frontend | Expo / Metro (local, no en Docker) | — |

`infra/docker-compose.yml` levanta **postgres + keycloak** con imágenes oficiales (sin `docker build`); `postgres/init.sql` (esquema con PK/FK) se monta en el contenedor y `keycloak/realm-utc-food.json` se importa al arrancar. Comandos: `docker compose up -d`, `docker compose ps`, `docker compose logs`, `docker compose down`. Variables en `infra/.env` (no se commitea; hay `.env.example`). **Requiere Docker Desktop (WSL2) en Windows.** El backend en dev corre con `npm run start:dev`; su inclusión como servicio en compose (rules §12) es un punto abierto.

---

## 9. Plan de ejecución de la Fase 0 (alto nivel)

1. **Limpieza/organización:** crear `docs/`, mover y renombrar los 2 briefs; eliminar `design-system/ui_kits/app/` (Propuesta A); añadir nota "Propuesta B elegida".
2. **Frontend:** inicializar Expo + TypeScript; instalar NativeWind, React Navigation, react-native-svg, lucide-react-native, Zustand, expo-font; crear capas FSD (carpetas + `index.ts` + README por capa); portar tokens a `shared/theme`.
3. **Backend:** inicializar NestJS; instalar TypeORM/pg, class-validator, passport-jwt/jwks, throttler; crear capas Clean (carpetas + README); configurar conexión a PostgreSQL (sin entidades aún o con stubs).
4. **Infra:** crear `infra/` con `docker-compose.yml` (postgres + keycloak), `postgres/init.sql` (esquema PK/FK), `keycloak/realm-utc-food.json` (mínimo), `.env.example` y `README.md`.
5. **Verificación (rules §0, §12, §18):** `docker compose up -d` + `docker compose ps` (postgres y keycloak arriba); conexión real a PostgreSQL; `frontend` levanta en Expo; `backend` levanta en :3000 y conecta a PostgreSQL; documentar comandos en el README raíz.

---

## 10. Riesgos / pendientes

- **Docker Desktop (WSL2)** debe estar instalado y corriendo en Windows para `docker compose`. Verificación obligatoria con `docker compose ps` (rules §0, §12).
- **Backend en compose**: rules §12 lista `backend` como servicio Docker; en Fase 0 el backend corre con `npm run start:dev` y se decide después si se containeriza (punto abierto).
- **Fuentes custom** (Bricolage Grotesque, etc.): conseguir los `.ttf` para `expo-font`. Si no, fallback a system-ui temporal.
- **Federación Outlook en Keycloak**: configurar el Identity Provider de Microsoft requiere credenciales de Azure AD (se aborda en Fase 1, no en Fase 0).
- **Versión exacta de Expo SDK / NestJS**: se fija al inicializar; se anota en el README.
- **Estado global**: Zustand es la recomendación; si se prefiere solo Context se ajusta (decisión menor, no bloquea).
