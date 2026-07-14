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

## D-010 · Autenticación por rol (usuario SSO Microsoft vía Keycloak; admin local + MFA)
- Fecha: 2026-06-22 · Estado: vigente
- Contexto: dos prototipos de login en `design-system/ui_kits/login/` — usuario (botón "Iniciar sesión con Outlook", sin contraseña propia) y admin (correo+contraseña, azul institucional, "Acceso restringido").
- Decisión:
  - **Usuario (`user`)**: SSO con Microsoft/Outlook institucional, **federado dentro de Keycloak** (Identity Brokering: Microsoft Entra ID como IdP del realm `utc-food`). La app nunca recibe la contraseña del usuario.
  - **Admin (`admin`)**: credenciales **locales en Keycloak** + **MFA** (rules §6).
  - **Keycloak es siempre el emisor de tokens (broker).** La app y el backend validan únicamente JWT de Keycloak; agregar Microsoft después es configuración de Keycloak, sin tocar app ni backend.
- Implicación / desbloqueo: se puede **desarrollar ya** con usuarios locales de Keycloak (demo escolar). La federación Microsoft real es un paso posterior que requiere un **app registration en Entra ID + admin consent** del tenant institucional — **no requiere DNS**. Mientras tanto, el botón "Outlook" apunta a Keycloak. (Ver D-011 sobre permisos.)

## D-011 · Dominio institucional e identidad
- Fecha: 2026-06-22 · Estado: vigente
- Contexto: BR-002 de rules.md indicaba `@email.utc.edu.ec` (plantilla Ecuador), pero el proyecto es de la UTC de **México**.
- Decisión: el dominio institucional es **`edu.utc.mx`**. Se corrige BR-002. **Formato adoptado y validado: `@edu.utc.mx`** — implementado en `backend/src/application/auth/dto/register.dto.ts` (`@Matches(/@edu\.utc\.mx$/i)`) y en el frontend (`LoginUsuario`), conforme a D-014.
- Corrección 2026-06-24: hubo confusión histórica entre `utc.edu.mx` y `edu.utc.mx`; el usuario confirmó que el correcto es **`edu.utc.mx`** (orden invertido). Se reemplazó en la validación (frontend + backend), los textos, los mocks, los **datos demo** (re-sembrados) y los docs. Las cuentas viejas `@utc.edu.mx` quedan obsoletas; para entrar hay que registrar una `@edu.utc.mx`.
- Permisos: el equipo **no controla DNS ni el tenant** institucional. Esto **no bloquea** el desarrollo (Keycloak local con usuarios de prueba). Solo condiciona la federación Microsoft real (app registration + admin consent del tenant UTC), no el resto del proyecto.

## D-012 · Expo Go como runtime de desarrollo + restricción de librerías nativas
- Fecha: 2026-06-22 · Estado: vigente
- Contexto: rules §13 exige que la app corra en **Expo Go** (cliente/runtime de desarrollo, NO un framework; el framework es Expo sobre React Native). Expo Go solo incluye los módulos nativos del **Expo SDK**.
- Decisión:
  - El frontend es una app **Expo (managed)** sobre React Native. Se prueba en **Expo Go** vía `npx expo start` + QR (demo en teléfono al profesor) y, opcionalmente, en **navegador** con `npx expo start --web` (react-native-web, por defecto `http://localhost:8081`) para iterar UI desde el IDE.
  - **Restricción dura:** solo se usan librerías compatibles con Expo Go (del Expo SDK o JS puro). Para autenticación (D-010) se usa **`expo-auth-session` + `expo-web-browser`** (compatibles con Expo Go), **NO** `react-native-app-auth` (requiere development build). El login admin (correo+password vs Keycloak) también vía `expo-auth-session` o POST directo al token endpoint.
  - Si en el futuro hace falta un módulo nativo fuera del SDK, se **gradúa a development build** (`expo-dev-client` / EAS) — cambio de modo, no rewrite.
- Nota: la vista web (`:8081`) es una **aproximación** (react-native-web); el flujo OAuth difiere entre web y nativo, por lo que la **validación real del login** se hace en Expo Go / dispositivo.

## D-013 · Seed de administrador: credenciales locales en Keycloak (afina D-010)
- Fecha: 2026-06-22 · Estado: vigente
- Contexto: D-010 fijó admin = local + MFA, pero no existía ningún admin real en el realm `utc-food`. No se asume que los admins tengan correo institucional.
- Decisión:
  - Se siembra un admin con **correo provisto NO institucional** (`admin@picksazon.app`) + contraseña **local** y rol realm `admin`. **Sin Microsoft/Outlook** (eso es solo del cliente, D-010).
  - **Identidad declarativa** en `infra/keycloak/realm-utc-pick-sazon.json` (sin secreto, para arranques limpios) + **script idempotente** `infra/keycloak/seed-admin.sh` que aplica la contraseña desde `infra/.env` (gitignored, §17). Editar el realm JSON no re-importa en caliente; el script opera sobre la instancia viva.
  - Para la **demo** la contraseña es **permanente** (verificable con token). El endurecimiento §6 (forzar `UPDATE_PASSWORD` + MFA `CONFIGURE_TOTP`) queda como toggle posterior, **no** activado aún.
- Verificación: token real por `grant_type=password` (client `mobile-app`, `directAccessGrants`) con `realm_access.roles` incluyendo `admin`.
- Pendiente: cliente con Azure/Microsoft vía broker (paso 2) y cableado de la pantalla RN LoginAdmin al token endpoint.

## D-014 · Cliente con credenciales locales en Keycloak (supersede la parte Microsoft de D-010)
- Fecha: 2026-06-22 · Estado: vigente
- Contexto: el equipo **nunca** tendrá app registration + admin consent del tenant institucional de UTC → el SSO Microsoft real para cuentas `@edu.utc.mx` es inviable. (Aclaración: el *app registration* lo crea uno mismo, gratis; lo que depende de UTC es el *admin consent*.)
- Decisión:
  - **Cliente (`user`)** = credenciales **locales en Keycloak**, igual que el admin. **Auto-registro restringido a `@edu.utc.mx`** (validado en el DTO del backend). Sin Microsoft/Azure. **Supersede** la parte "usuario SSO Microsoft" de D-010.
  - **Registro/login branded vía backend** (Keycloak no expone auto-registro público por API): la app llama a `POST /auth/register` y `POST /auth/login` del backend NestJS. El registro usa un client **service-account `backend-svc`** (roles `manage-users` + `view-realm`) para crear el usuario por la Admin API y asignar el rol realm `user`; el login es password grant al client público `mobile-app`. Secretos solo en `.env` (gitignored, §17). Rate-limit 5/min en auth (§8).
  - UI: `LoginUsuario` pasa de "Iniciar sesión con Outlook" (mock Microsoft) a formularios **Crear cuenta / Iniciar sesión**.
  - Keycloak sigue siendo el único emisor de tokens; si UTC algún día coopera, brokear a Microsoft es "solo config".
- Verificación (§0): register `@edu.utc.mx` → 201 con token cuyo `realm_access.roles` incluye `user`; dominio ajeno → 400; duplicado → 409; rate-limit → 429. Build + tests verdes.
- Alternativa cloud descartada por ahora: Microsoft Entra External ID / Azure AD B2C (directorio propio).

## D-015 · Distinción de identidades admin (servidor vs app)
- Fecha: 2026-06-23 · Estado: vigente · Afina D-013.
- Contexto: tanto el admin del **servidor** Keycloak (realm `master`) como el admin de la **app** (realm `utc-food`) se llamaban `admin` → confusión al iniciar sesión (mismo username, distinta contraseña y consola).
- Decisión: se renombran para distinguirlos. **Servidor Keycloak = `kcadmin`** (consola `/admin/`, realm `master`, password `KEYCLOAK_ADMIN_PASSWORD`). **App/cooperativa = `coop-admin`** (realm `utc-food`, Account Console + panel, email `admin@picksazon.app`, password `ADMIN_SEED_PASSWORD`). Aplicado en caliente (vía `editUsernameAllowed` temporal, luego revertido) y en `infra/.env`, `infra/.env.example`, realm JSON y seed. El email del admin de la app **no** cambió.

## D-016 · MFA del admin activa (TOTP integrado de Keycloak)
- Fecha: 2026-06-23 · Estado: vigente · Activa el endurecimiento §6 que D-010/D-013 dejaban pendiente.
- Contexto: rules §6 exige MFA para admins; se evaluó si hacía falta un servicio externo.
- Decisión: **NO se usa servicio externo.** Se usa el **TOTP integrado de Keycloak** (RFC 6238; política del realm: 6 dígitos / 30s / SHA1). El admin enrola su autenticador (Google/Microsoft Authenticator o FreeOTP) **una vez** vía Account Console; el login admin (password grant) envía el código en el parámetro **`totp`**. El cliente (`user`) **no** lleva MFA (no enrola OTP; el flujo condicional por defecto "user configured" no lo pide).
- Verificación (§0): password grant del admin **sin** `totp` → rechazado (`invalid_grant`); `coop-admin` tiene credenciales `password` + `otp`.
- Pendiente (diferido): flujo condicional **por rol** (exigir OTP a cualquier `admin` aunque no haya enrolado) — cirugía de auth-flows por kcadm, beneficio marginal para un solo admin.

## D-017 · Seguridad de auth en backend (JWT guard + roles + login admin real)
- Fecha: 2026-06-23 · Estado: vigente.
- Contexto: el backend no validaba JWT ni rol, y el login admin de la app era un mock.
- Decisión: **guards globales** en NestJS — `JwtAuthGuard` (passport-jwt + jwks-rsa: valida firma RS256 + issuer del realm) y `RolesGuard` (`@Roles('admin')`), con `@Public()` para `register`/`login`/`admin/login`/`health`. Nuevo `POST /auth/admin/login` (password grant + `totp`) que **verifica el rol `admin`** en el token (un `user` recibe 403). La pantalla RN LoginAdmin deja el mock y usa el login real con **campo OTP**. El rol se valida **en el backend** (rules §5, BR-015).
- Verificación (§0): matriz curl — sin token→401; cliente en ruta admin→403; admin sin `totp`→400; admin con `totp` malo→401; cuenta cliente en `admin/login`→403. Backend `build`/`lint`/`test` verdes; frontend `tsc` + bundle Metro OK.

## D-018 · Armonía de las pantallas de login
- Fecha: 2026-06-23 · Estado: vigente.
- Contexto: cliente (hero naranja + hoja blanca) y admin (banda plana) se veían "async".
- Decisión: ambas comparten el mismo esqueleto (hero con degradado + hoja blanca) vía componentes reutilizables `widgets/auth/AuthScaffold` + `shared/ui/BrandField` + `shared/ui/PrimaryButton`; difieren solo en el **color de rol** (naranja cliente / azul admin) y el copy. El admin pasó de banda plana a hero azul.

## D-019 · Semáforo de congestión: parámetros y visibilidad para ambos roles
- Fecha: 2026-06-24 · Estado: vigente.
- Contexto: el círculo definía el semáforo de forma aproximada ("menos de 5 Verde, más de 5 Amarillo, más de 10 Rojo") y lo ubicaba sobre todo en el panel del admin. Faltaba precisar **qué cuenta**, los **umbrales como parámetros** (incluidos los bordes 5 y 10) y dejar explícito que el **cliente también lo ve**.
- Decisión:
  - **Métrica:** número de **pedidos en cola** = `orders` en estado `pending` + `preparing` + `ready`. Se **excluyen** `ready_later`, `picked_up`, `not_picked_up` y `cancelled` (no presionan el mostrador en el momento).
  - **Umbrales parametrizables** (resuelven la ambigüedad de los bordes): 🟢 **Verde** `n < 5` · 🟡 **Amarillo** `5 ≤ n ≤ 10` · 🔴 **Rojo** `n > 10`. Constantes `UMBRAL_AMARILLO = 5` y `UMBRAL_ROJO = 10`, **ajustables** por la cooperativa según su capacidad.
  - **Visibilidad por rol:** el **admin** ve el **conteo exacto** + color (para decidir cuándo empujar los pedidos programados); el **cliente** ve solo el **color** + una etiqueta ("tranquila / concurrida / llena"), sin el número crudo.
  - **Fuente de verdad:** lo calcula el **backend** (no el frontend) a partir de `orders`, y se expone por un endpoint legible por ambos roles. Hora del servidor (BR-005).
- Verificación (§0): consulta sobre el dataset demo → `pending`+`preparing`+`ready` = 3 → 🟢 Verde, consistente con `datos-demo.md`. Query en `consultas-sql.md`.
- Reflejo en docs (rule #24): círculo §3.14, ejecución §12, arquitectura §7.

## D-020 · Identidad visual "Editorial Street-Food" + panel admin en RN (Astro descartado)
- Fecha: 2026-06-24 · Estado: vigente.
- Contexto: faltaba el **panel de administración** y se quería dejar **lo estético listo** en todas las pantallas, con una identidad "fuera de lo común" inspirada en el logo (mascota verde antojada). Se evaluó si convenía un framework como **Astro**.
- Decisión:
  - **Identidad "Editorial Street-Food":** tipografías cargadas con `expo-font` — **Bricolage Grotesque** (titulares), **Plus Jakarta Sans** (cuerpo), **Space Mono** (números/turnos/códigos/semáforo). Paleta navy `azul[700]` + naranja `naranja[500]` + acento verde lima; layout editorial (titulares grandes, tarjetas con sombra, barrita de acento). Primitivas tipográficas `shared/ui/Type` (`Display/Heading/Title/Body/Label/Mono`). Aplicada a **todas** las pantallas (cliente + auth + admin).
  - **Panel admin = stack RN propio** dentro de la misma app Expo: `RootNavigator` ramifica por **rol de sesión** (`session.role`), admin → `AdminStack` (tabs Dashboard · Cola · Menú) + pantallas empujadas (Detalle de pedido, Editar producto, Reoferta). UI-first con mock que **espeja el dataset demo** (`datos-demo.md`).
  - **Astro DESCARTADO:** genera sitios web (HTML/islas), no apps React Native; obligaría a un 2º frontend solo-admin (duplica stack/build/diseño/auth y rompe la armonía cliente↔admin de D-018). Un panel admin es un dashboard muy interactivo (cola/semáforo/CRUD) = caso de SPA, donde el modelo de islas estorba. Lo distintivo se logró dentro de Expo; el admin puede verse en pantalla grande con React Native Web (mismo código).
  - **`design-system/` retirado:** su contenido ya estaba **consumido** (kits/specs → pantallas RN) y quedó **superado** por el sistema de diseño en código (`shared/theme/tokens.ts` + `shared/ui/Type`). Se eliminó la carpeta; los **másters del logo** se preservaron en `brand/`. (Cierra el ciclo de D-004/D-008.)
- Verificación (§0): por milestone `npx tsc --noEmit` (0 errores) + `expo export` (bundle Android OK con las 9 fuentes). Cero `fontWeight` residual: todo el frontend usa las familias de marca. Solo librerías compatibles con Expo Go (D-012).
- Pendiente (turno de datos): cablear el CRUD/transiciones reales del admin a `UTC_PROJECT_DB` (los guards JWT/roles ya existen); reemplazar los mocks por endpoints.

## D-021 · Pedidos sincronizados alumno↔administrador + cuenta del administrador
- Fecha: 2026-06-24 · Estado: vigente.
- Contexto: la vista del alumno y la del administrador llevaban listas de pedidos separadas, así que lo que uno marcaba no se reflejaba en el otro. El panel del administrador tampoco permitía cerrar sesión ni ajustar nada.
- Decisión:
  - **Pedidos compartidos:** el alumno y el administrador trabajan sobre los **mismos pedidos**. Cuando el alumno envía uno, aparece en la cola del administrador; cuando el administrador cambia el estado (En preparación · Listo · Entregado), el seguimiento del alumno lo refleja al instante, y a la inversa.
  - **Cuenta del administrador:** se agregó **cerrar sesión**, una sección de **accesibilidad** (texto grande, alto contraste, reducir movimiento) y de **personalización funcional**: el administrador edita el **nombre y el horario** de la cooperativa y los **umbrales del semáforo**, y el cambio se aplica **al instante** (los umbrales mueven el color del semáforo en el Dashboard; el nombre se refleja en el panel).
- Verificación (§0): recorrido completo del flujo — el alumno paga, el administrador marca listo y el alumno lo ve reflejado.
- Pendiente: hoy la sincronización ocurre en un mismo equipo; entre dispositivos distintos se completa al conectar la base de datos (turno de datos).

## D-022 · Endurecimiento tras auditoría (pre-Paso 3)
- Fecha: 2026-06-29 · Estado: vigente.
- Contexto: antes de seguir con el turno de datos (Paso 3, pedidos) se corrió una auditoría (alineación de formularios, RLS, cohesión, ingeniería inversa de seguridad). No salieron bugs críticos ni vulnerabilidades explotables; sí varias mejoras de bajo riesgo que se aplicaron.
- Decisión:
  - **Producción sin datos de mock (BR-015):** los catálogos del cliente y del administrador ya **no** caen al mock cuando el backend falla; el mock queda **solo en desarrollo**. En producción el catálogo queda vacío con un aviso de error ("no se pudo cargar"), para no operar nunca sobre datos ficticios.
  - **RLS en Postgres: fuera de alcance, por diseño.** No se usa Row-Level Security; la propiedad de los pedidos (un alumno solo ve los suyos, BR-014) se garantiza en el backend a partir del token. Para un proyecto escolar de una sola app es lo proporcional; se documenta como decisión consciente, no como pendiente.
  - **Validaciones que ahorran viajes y cierran huecos:** el formulario de alta/edición valida en el dispositivo (precio y tiempo > 0, nombre y categoría obligatorios) antes de enviar; la foto del producto solo acepta rutas de asset válidas; la reoferta ahora se puede **quitar** desde el panel (no solo poner/bajar).
  - **Validación opcional de audience del token (defensa OIDC):** queda disponible como opción de configuración, **apagada por defecto** para no afectar el inicio de sesión actual.
- Verificación (§0/§22): backend `lint`/`build`/`test` verdes (incluye prueba de regresión de la validación de la foto); frontend `tsc` verde; auditoría + guard anti-regresión con confianza ≥95%.
- Reflejo en docs (rule #24): corrección de puertos en ejecución §3; esta entrada. El círculo y los pasos no cambian de alcance (es endurecimiento interno).

## D-023 · Semilla mínima (solo admin + productos) y arranque limpio
- Fecha: 2026-06-29 · Estado: vigente.
- Contexto: para demostrar el flujo real en vivo (crear cuenta → pedir → el admin lo ve) se quería un arranque **sin datos precargados** que confundan.
- Decisión: `infra/postgres/seed-demo.sql` se recorta a **`products` (10) + un solo `user_profile`: `admin@picksazon.app`** (sin pedidos/pagos/tiempos ni alumnos demo). Los alumnos se crean **al registrarse en vivo**. Se limpia con `TRUNCATE payments, preparation_times, order_items, orders RESTART IDENTITY CASCADE` (documentado en `docs/datos/psql-cheatsheet.md §5`). La BD viva y Keycloak se dejaron también con **solo el admin** (borrado de cuentas de prueba vía el service-account `backend-svc`).
- Verificación (§0): conteos antes/después → 0 pedidos, único usuario `admin@picksazon.app` en `user_profile` y en el realm `utc-food`.
- Reflejo en docs (rule #24): `datos/datos-demo.md`, `datos/psql-cheatsheet.md`.

## D-024 · Notificaciones de pedido (Opción A: locales, sin push remota) — afina la parte "push" de D-006
- Fecha: 2026-07-01 · Estado: vigente.
- Contexto: BR-012 pide avisar eventos del pedido (aceptado, listo, cancelado, no recogido). D-006 difería "push". Se quería que funcionara también en **web (Chrome)** y se viera como push en teléfono, **sin** construir infraestructura de push remota (Expo Push + registro de tokens + dev-build), que no es verificable en este entorno.
- Decisión: **notificaciones locales del SO disparadas por sondeo al backend** (no push remota con la app cerrada). Dos frentes: **web** = API `Notification` del navegador; **nativo** = `expo-notifications` (notificación local; Expo Go ya no soporta push remota desde SDK 53). Mapa puro `notificationFor` (4 eventos BR-012 + de-dup) + hook que sondea `loadMine` y notifica transiciones; toggle en Perfil que **pide permiso**; `notifyReady` arranca en `false`. La push remota real queda **diferida** (necesita dev-build + `projectId` + dispositivo).
- Verificación (§0/§22): `notificationFor` 10/10; `tsc` 0; bundle web 0; 3 agentes de regresión (35% → 85% → 97%). El "ver la notificación" real queda como validación visual (dispositivo/navegador).
- Reflejo en docs (rule #24): círculo §3.1 (aviso en teléfono o navegador); ejecución §8.

## D-025 · Número de pedido secuencial (U-00001) reemplaza el código derivado del UUID
- Fecha: 2026-07-01 · Estado: vigente.
- Contexto: el código de recogida se derivaba del UUID (ej. "A-5C33"): poco legible y no correlativo. Se quería un número de pedido legible tipo **U-00001**.
- Decisión: columna `order_number` en `orders`, **autoincremental** (secuencia Postgres + `@Generated('increment')`, `UNIQUE`), generada por la BD; el backend la expone en `OrderResponse.orderNumber` y el frontend la formatea `U-` + 5 dígitos (`formatOrderCode`). Es a la vez el **código de recogida**. Migración `AddOrderNumber`.
- Verificación (§0/§22): backend 40/40; migración `exit 0`; e2e `POST /orders` → `orderNumber:1` = U-00001; frontend `tsc`/bundle 0; agente de regresión gate §22 (fix de códigos mock `A-`→`U-`).
- Reflejo en docs (rule #24): círculo §1/§3.1/§3.4; ejecución §5/§14.

## D-026 · Pedido programado con hora fija + prioridad "glaciar" (MVP)
- Fecha: 2026-07-01 · Estado: vigente.
- Contexto: la Propuesta incluía "programar tu pedido". Faltaba concretar la política: anticipación, cómo avisar al negocio y cómo interactúa con el semáforo.
- Decisión (MVP):
  - El cliente **fija la hora de recogida** al pagar; el backend valida **≥30 min de anticipación** y **mismo día** (hora del servidor, BR-005). Columna `scheduled_for` (migración `AddScheduledFor`).
  - **Hora de empezar** = `scheduled_for − prep estimada` (máx de `prep_time_seconds` de las líneas), derivada en la respuesta (`startBy`).
  - **Aviso al negocio:** notificación **local en el dispositivo del admin** cuando llega `startBy` (mismo mecanismo que D-024, no push remota); la cola del admin ordena por **holgura ("glaciar")** y resalta "⏰ Empezar ahora".
  - **Semáforo:** un pedido programado **entra a la cola solo dentro de los 20 min previos** a la recogida (no infla la congestión antes).
  - Limitación documentada: "mismo día" en la zona horaria del **servidor** (despliegue single-locale; multi-TZ requeriría fijar la zona de la cooperativa).
- Verificación (§0/§22): backend 45/45; migración `exit 0`; e2e (válido +45 min → `startBy` −15 min; +10 min → 400; `congestion` excluye programado → count 0); frontend `tsc`/bundle 0; `scheduleView` 5/5; agente de regresión gate §22 (88% → fix E1 + test de cobertura de `congestion`).
- Reflejo en docs (rule #24): círculo §3.15; ejecución §13.

## D-027 · Estimación de preparación adaptativa (promedio real) + "tiempo preparado" (J5 + B5)
- Fecha: 2026-07-02 · Estado: vigente.
- Contexto: la Propuesta (§2/§3.7) prometía "calcular tiempos **promedio** de preparación" y "mostrar cuánto tiempo lleva preparado". El código registraba muestras en `preparation_times` pero nunca las promediaba, y `readySinceMin` de producto llegaba siempre `null`.
- Decisión:
  - **J5:** `avgPrepByProduct` promedia las **últimas 20 muestras** por producto (ventana `ROW_NUMBER`), y solo cuenta si hay **≥3** (si no, cae al `base_prep_time_seconds`). `create()` usa ese promedio como `prep_time_seconds` del pedido → estimación adaptativa (alimenta `startBy` del programado).
  - **B5:** columna `status_changed_at` (migración `AddProductStatusChangedAt`) que el service fija al **cambiar** el status; el front deriva "preparado hace X min" para estados preparados.
- Verificación (§0/§22): backend `tsc` 0 + tests (test J5: usa promedio si hay muestras, si no base); SQL de ventana validada contra Postgres real; migración `exit 0`.
- Reflejo en docs (rule #24): círculo §2/§3.7; ejecución §7.

## D-028 · Semáforo de congestión ajustable server-side (G2) + coherencia del dashboard (H4)
- Fecha: 2026-07-02 · Estado: vigente.
- Contexto: los umbrales del semáforo (5/10) estaban **hardcodeados** en el backend; el "ajuste" del admin vivía solo en memoria del front y **no** afectaba el semáforo que ve el **alumno**. Además el dashboard admin recalculaba local e **inflaba** con pedidos programados fuera de ventana.
- Decisión:
  - **G2:** tabla singleton `app_settings` (migración `AddAppSettings`) con `congestion_yellow`/`red`; `SettingsService` + `SettingsController` (`GET /settings/congestion` autenticado, `PATCH` **@Roles admin**, valida `red > yellow`); `congestion()` **lee** esos umbrales → el semáforo del alumno refleja el ajuste. El front (Personalización) carga y **persiste** los umbrales.
  - **H4:** `selectSemaforo` del dashboard excluye programados fuera de la ventana de 20 min (igual que el server-side).
- Verificación (§0/§22): backend `tsc` 0 + 28 tests; e2e real: `GET /settings/congestion` → `{5,10}`, `PATCH` como `user` → **403**; migración `exit 0`.
- Reflejo en docs (rule #24): círculo §3.14; ejecución §12.

## D-029 · Inteligencia del negocio (métricas F5) + auto-vencimiento de recogida (E6)
- Fecha: 2026-07-02 · Estado: vigente.
- Contexto: la Propuesta prometía "qué se vende más y a qué hora pega el pico" y una ventana de recogida de 10–20 min. No existían métricas y `pickup_deadline` se guardaba pero nunca se leía (el paso a `not_picked_up` era manual).
- Decisión:
  - **F5:** `GET /orders/metrics` **@Roles admin** → más vendidos (Σ cantidad, excluye cancelados) + hora pico; card "Inteligencia del negocio" en el dashboard. **Corrección 2026-07-02:** la hora pico usa `created_at AT TIME ZONE 'America/Mexico_City'` (hora LOCAL de la cooperativa); sin eso, `timestamptz` daba la hora **UTC** (14:00 CDMX se veía como 20:00). Validado contra la BD (20 UTC → 14 CDMX).
  - **E6:** `expireOverdue()` marca `not_picked_up` los `ready` con `pickup_deadline < now()`; `OrderExpiryScheduler` lo barre cada 60 s (`setInterval` con `unref`, sin dependencia de scheduler). El dinero se mantiene cobrado (§3.10).
- Verificación (§0/§22): backend `tsc` 0 + tests; SQL de métricas y de vencimiento validadas contra Postgres real.
- Reflejo en docs (rule #24): círculo §3.1/§3.8; ejecución §6/§9.

## D-030 · Cierre de detalles de UX de la propuesta (B3, E4, E1, F1, F4)
- Fecha: 2026-07-02 · Estado: vigente.
- Contexto: varios detalles prometidos estaban decorativos o ausentes.
- Decisión:
  - **B3** buscador funcional del menú (filtra por nombre en vivo).
  - **E4** el cliente ve el estado "**Calentando tu alimento**" (feed + detalle).
  - **E1** prompt "listo desde hace X min" con **cancelar o extender** juntos; el backend permite cancelar un pedido `ready`/`ready_later` no recogido (§3.9), no solo `pending`.
  - **F1** el admin **edita la foto** del producto por URL (http/https de imagen); `IMAGE_URL_PATTERN` acepta URL de imagen y sigue bloqueando `javascript:`/traversal/`.svg`.
  - **F4** accesibilidad **funcional**: store `shared/a11y` que las primitivas `Type` consumen (escala de texto real incl. `fontSize` inline, y alto contraste) + `reduceMotion` apaga animaciones; cliente y admin lo cablean.
- Verificación (§0/§22): frontend `tsc` 0; backend `tsc` 0 + tests (incl. test del regex `imageUrl` acepta URL / rechaza `javascript:`).
- Reflejo en docs (rule #24): círculo §3.1/§3.6/§3.8/§3.9.

## D-031 · MFA de administrador forzada por configuración (A3)
- Fecha: 2026-07-02 · Estado: vigente.
- Contexto: el TOTP estaba cableado (login admin lo valida) pero **no forzado**: un admin de un clon nuevo podía entrar solo con contraseña.
- Decisión: el realm marca al `coop-admin` con required action **`CONFIGURE_TOTP`** (+ `otpPolicy` TOTP explícita) y `seed-admin.sh` la re-aplica. Cadena de enforcement: `CONFIGURE_TOTP` **obliga a enrolar** el TOTP → el admin queda con credencial OTP → el sub-flujo **OTP condicional** (default de Keycloak en el direct-grant) **exige** ese OTP en cada login. Resultado: el login **solo-con-contraseña NO obtiene token** para el admin sembrado (fail-closed).
- **Por qué OTP condicional (no un paso OTP forzado a nivel realm):** los **alumnos** también entran por direct-grant (`mobile-app`) y **no** tienen TOTP; un OTP *required* no-condicional rompería su login. El condicional aplica MFA solo a quien tiene credencial OTP (los admins, forzados por `CONFIGURE_TOTP`) sin afectar a los alumnos — que es justo el diseño deseado.
- **Limitaciones honestas (auditoría estricta 2026-07-02):** (a) el enrolamiento del TOTP es **out-of-band** (Account Console del navegador): el direct-grant/ROPC no tiene UI para `CONFIGURE_TOTP`, así que la app no enrola; el backend ahora **explica la causa** ("configura el TOTP…") en vez de un genérico. (b) Hueco residual: si un operador **limpia** la required action **sin** enrolar, el condicional-OTP se saltaría y volvería a pasar solo-password; cerrarlo del todo requeriría un flujo dedicado por cliente/grupo (fuera de alcance de la demo). Documentado, no oculto.
- Verificación (§0): realm JSON válido + `bash -n` del seed OK; auditoría de flujo (fail-closed para el admin sembrado; mensaje de error corregido).
- Reflejo en docs (rule #24): círculo §3.2/§3.3 (seguridad).

## D-032 · Sucursal de recogida persistida en el pedido (§3.12)
- Fecha: 2026-07-02 · Estado: vigente.
- Contexto: la selección de sucursal (geo/override/fallback) existía en la UI pero **no viajaba** al backend ni se guardaba con el pedido.
- Decisión: columnas `branch_id`/`branch_name` en `orders` (migración `AddOrderBranch`, nullable); `create-order.dto` las valida (opcionales, `@MaxLength`); `create()` las persiste; `order-response` las expone; el carrito envía la sucursal seleccionada. (Sin tabla `branches` aún: se guarda id+nombre para que el pedido sea autodescriptivo.)
- Verificación (§0/§22): backend `tsc` 0 + 51 tests; migración `exit 0`; frontend `tsc` 0.
- Reflejo en docs (rule #24): círculo §3.12; ejecución §10.

## D-033 · Pagos con tarjeta: formulario real + pasarela simulada con circuit breaker (C2 + C4)
- Fecha: 2026-07-02 · Estado: vigente — **afina D-006** (pagos diferidos).
- Contexto: la Propuesta prometía pago con tarjeta y (§3.2 seguridad) un **circuit breaker** para pagos. Los pagos eran un mock sin formulario ni pasarela, y el breaker no existía.
- Decisión (sin integrar pasarelas reales de MP/PayPal/procesador):
  - **C2:** **formulario real de tarjeta** (número con **validación de formato** —13–19 dígitos—, marca por BIN, expiración MM/AA no vencida, CVV 3–4); **no se guarda el número completo**, solo `last4`. **No se valida el checksum de Luhn** (se quitó por dead code — evitaba rechazar números inventados y el cobro es simulado; bastan el formato 13–19 dígitos + BIN + expiración + CVV). Con TDC/TDD hay que elegir/agregar tarjeta para pagar; la aprobación se **simula**. **Un solo componente `CardForm`** se usa **idéntico en el checkout y en Mi cartera** (antes la cartera tenía un formulario propio, más pobre): en la cartera muestra un selector de **tipo** (TDC/TDD piden número real; Mercado Pago/PayPal piden correo/titular + referencia); en el checkout el tipo viene fijado por el método. Se quitó la "edición" de tarjeta en la cartera (no se puede editar un número que no se guarda → borrar y re-agregar).
  - **C4:** `CircuitBreaker` propio (closed/open/half-open, fail-fast, cooldown) que envuelve `PaymentGatewayService.authorize` (simulado); `create()` autoriza tarjeta/online por ahí (efectivo no). Si la pasarela/circuito rechaza → 400 claro.
- Verificación (§0/§22): backend `tsc` 0 + **57 tests** (4 del circuit breaker: abre tras umbral, fail-fast, half-open cierra/reabre; 2 de C4 en `create`); frontend `tsc` 0; lógica de tarjeta (marca/expiración) validada con node.
- Reflejo en docs (rule #24): círculo §2/§3.2; ejecución §5.

## D-034 · Puerto por defecto del backend = 3002
- Fecha: 2026-07-02 · Estado: vigente.
- Contexto: el `:3001` lo ocupa otro proyecto (`doxia-agent2`) en este equipo.
- Decisión: default del backend **3002** en `backend/.env`, `.env.example`, `main.ts` (fallback), `frontend/src/shared/api/client.ts` (`BACKEND_PORT`) y el runbook `docs/Read/*`. Docker (Postgres 5433 / Keycloak 8082) sin cambios.
- Verificación (§0): 0 referencias a 3001 en código; backend arranca en `:3002` (DI OK, rutas 401).

## D-035 · Cooperativa por geolocalización + pedidos scopeados por cooperativa (§3.12)
- Fecha: 2026-07-02 · Estado: vigente — **cierra un bug de ruteo** de D-032.
- Contexto: (a) las sucursales tenían nombres "(demo)" y el cliente arrancaba con una **precargada**; (b) el admin tenía su cooperativa **hardcodeada** en otro store; (c) **`GET /orders/all` no filtraba por sucursal** → cualquier admin veía TODOS los pedidos ("pedir para una cooperativa y que responda otra").
- Decisión:
  - **Lista única** de cooperativas UTC (sin "(demo)") compartida por cliente y admin (mismos `id`), en `entities/branch`.
  - **Cliente:** `branch.store.selected` arranca en **`null`** (nada precargado); al abrir, geolocaliza y asigna la **UTC más cercana**; si niega el permiso, elige a mano; **no se puede pedir sin cooperativa** (gate en el carrito).
  - **Admin:** su cooperativa también por **geolocalización** (mismo `branch.store`); Personalización muestra la detectada + "Usar mi ubicación"/"Elegir a mano". Se eliminaron `branchName`/`address` hardcodeados del admin settings store.
  - **Ruteo:** `GET /orders/all?branchId=` filtra `findAll` por `branch_id`; el Dashboard y la Cola del admin envían **su** `branchId` → el admin **solo** ve/atiende los pedidos de **su** cooperativa. Los pedidos ya llevaban `branch_id` (D-032).
- Verificación (§0/§22): backend `tsc` 0 + 57 tests; frontend `tsc` 0; filtro `where: { branchId }` directo.
- Nota: pedidos previos con `branch_id` de ids viejos (p. ej. `demo-roma`) no matchean las nuevas cooperativas → conviene truncar para la demo.
- Reflejo en docs (rule #24): círculo §3.12; ejecución §10.

## D-036 · Refresco de sesión (fix del "Unauthorized" tras ~5 min)
- Fecha: 2026-07-02 · Estado: vigente.
- Contexto (bug real): el access token de Keycloak dura **300 s** por defecto y **no había refresco** — tras ~5 min, cualquier acción protegida (p. ej. **reoferta** del admin) fallaba con **401 "Unauthorized"** hasta re-loguear. El backend guardaba el `refresh_token` pero no lo usaba; el frontend no manejaba 401.
- Decisión:
  - **Backend:** `POST /auth/refresh` (**@Public**, throttle 30/min) → `keycloak.refresh(refresh_token)` (grant `refresh_token` del client público `mobile-app`; no re-pide MFA en sesión activa). Sirve para cliente y admin.
  - **Frontend:** el `shared/api/client` expone `setTokenRefresher` (para no acoplar `shared`→`features`); al recibir **401** en una petición autenticada, renueva el token con el `refresh_token` y **reintenta 1 vez**. `features/auth` registra el refresher (actualiza la sesión; si el refresh ya no vale, cierra sesión).
  - **Realm:** `accessTokenLifespan = 1800` (30 min) como colchón para demos (el refresco cubre igual el vencimiento).
- Verificación (§0/§22): backend `tsc` 0 + 57 tests; frontend `tsc` 0; **e2e real**: `POST /auth/refresh` con token válido → nuevo access+refresh; con basura → **401**.
- Reflejo en docs (rule #24): círculo §3.2/§3.3 (seguridad/sesión).

## D-037 · Inventario real: "stock de dark kitchen" (el ciclo del pedido mueve el stock)
- Fecha: 2026-07-03 · Estado: vigente.
- Contexto (hueco real): el campo `products.stock` era **decorativo** — `orders.service` no lo leía ni lo descontaba; el único candado de venta era `isAvailable` (por eso se podía "vender/reofertar" un producto en 0 sin que nada cambiara). Contradecía la propuesta, que habla de manejo de "Preparados" y reoferta de excedente.
- Modelo elegido: `stock` = **unidades físicas disponibles ahora** (almacenadas **o** excedente ya preparado). Regla *dark kitchen*: el **`0` NO bloquea vender** (la cooperativa **cocina al momento**, no prepara sin orden); el candado sigue siendo `isAvailable`. Se descartó el inventario clásico (bloquear en 0) por contradecir la cocina bajo demanda.
- Ciclo (server-side, transaccional, SQL atómico, nunca < 0 — respeta el `CHECK "stock" >= 0`):
  - **Aceptar** (`pending→preparing`): `stock = GREATEST(0, stock − cant)` por línea (aparta del almacén; el faltante se cocina).
  - **Entregar** (`→picked_up`): sin cambio (ya se apartó al aceptar).
  - **No recogido** (`→not_picked_up`, vía `updateStatus` del admin **y** vía `expireOverdue` del scheduler) y **cancelación de un pedido ya listo** (`cancelOwn` desde `ready`/`ready_later`): `stock = stock + cant` (excedente reofertable).
  - **Cancelar pendiente**: sin cambio.
- Decisión de diseño honesta: el stock **sube solo cuando una unidad preparada queda sin reclamar**, NO "al empezar a prepararla" (evita mostrar como libre algo ya apartado → **no doble-vende**) y hace que una unidad **almacenada** apartada que no se recoge **vuelva** al inventario en vez de inventar una. `min/maxStock` siguen siendo etiquetas del admin (sin reorden/alertas automáticas — trabajo futuro).
- Implementación: helper `applyStockDelta(manager, order, 'reserve'|'release')` en `orders.service`; hooks en `updateStatus`, `expireOverdue` y `cancelOwn`. Sin migración (la columna y el CHECK ya existían).
- **Concurrencia (endurecido tras auditoría multi-agente, 2 rondas):** **todas** las transiciones de estado (`updateStatus`, `cancelOwn`, `extendOwn`) se serializan con **lock pesimista de fila** (`FOR UPDATE`, `lock: pessimistic_write`) — se bloquea sin joins y se cargan las relaciones aparte (Postgres no permite `FOR UPDATE` sobre el lado nullable de un outer join) — y **re-validan el estado FRESCO ya bloqueado** (no revive/pisa un terminal como `picked_up`/`not_picked_up`). Cierra: doble-reserva (dos "Aceptar" simultáneos), doble-liberación (`cancelOwn`/`extendOwn` + vencimiento) y los TOCTOU de `cancelOwn`/`extendOwn`. `expireOverdue` usa un **`UPDATE … WHERE status='ready' … RETURNING id` atómico y condicional** (no un `find()+save()` que podía pisar una transición concurrente) y solo devuelve el stock de las filas que ESE update venció. **Anti-deadlock:** los `UPDATE` de stock toman los locks de fila de producto en **orden global de `productId`** (`applyStockDelta` ordena por producto; `expireOverdue`, al ser multi-orden, **agrega la devolución por producto** y la aplica en ese mismo orden global).
- **Matiz honesto:** el barrido automático solo vence pedidos **`ready`** vencidos; un **`ready_later`** (extendido, §3.10) libera su stock por acción del admin o cancelación del cliente — un barrido de fin de día para extendidos queda como trabajo futuro.
- Verificación (§0/§22): backend `tsc` 0 + **65 tests** (8 nuevos: reserve/release/entregar/vencer/cancelar-listo/cancelar-pendiente + TOCTOU de `cancelOwn` y de `extendOwn`); **SQL real** contra Postgres en transacción con ROLLBACK: `GREATEST(0, 3−5)=0` (piso, sin violar el CHECK), `12−2=10`, `0+1=1`; `FOR UPDATE` y `UPDATE…RETURNING` condicional validados en vivo. **Auditoría adversarial** (workflow 3 ángulos × verificación) → 6 hallazgos corregidos; **2ª pasada** encontró 2 defectos nuevos (`extendOwn` sin blindar; deadlock multi-orden) → también corregidos.
- Reflejo en docs (rule #24): círculo §3.7 (tabla + ejemplos + matiz), ejecución §18.

## D-038 · Arquitectura objetivo congelada (Hexagonal + DDD + Vertical Slice, YAGNI de estructura)
- Fecha: 2026-07-07 · Estado: vigente (dirección del refactor backend en curso).
- Contexto: se venía formando la capa `domain/` (repos como interfaces) sin una forma final decidida. Tras tres rondas de crítica cruzada (Claude ↔ ChatGPT, cada uno criticando al otro — regla 45), se congela la forma objetivo.
- Decisión (qué SÍ): **Hexagonal** (puertos/adapters, AZURE-ready) + **DDD** + **Vertical Slice** (`modules/<contexto>/` autónomo: contracts, domain, application, infrastructure, presentation, tests juntos) + **kernel minimalista** (solo abstracciones de dominio: Entity, AggregateRoot, ValueObject, DomainEvent, DomainError, UseCase — **sin ports**; Result/Either descartados en D-039) + **puertos dentro del dominio de cada módulo** (`modules/orders/domain/ports/`) + **CQRS ligero** (sin Mediator/bus) + **contracts dentro del módulo**.
- Decisión (YAGNI de estructura, regla 46): NO subdividir por adelantado. `application/` plano hasta ~5 casos de uso (commands/queries a los ~20); `infrastructure/` solo `persistence/` + `external/` (messaging/cache cuando aparezca RabbitMQ/Redis/AZURE real); `presentation/` plano hasta tener varios de un tipo; `tests/` solo unit+integration; `contracts/` local salvo que se genere SDK/OpenAPI público. Frontend **FSD v2** (app/pages/widgets/features/entities/shared), `processes/` solo para flujos largos reales; **sin `flows/`** (duplica). `shared/` casi inexistente: lo que pertenece a un módulo va al módulo.
- Gobierno: reglas nuevas 44 (no crear carpetas sin justificar las 4 preguntas), 45 (no aceptar patrones por autoridad), 46 (umbrales YAGNI). Mapa de módulos y direcciones permitidas en `bounded-contexts.md` (Bounded Context + Context Map: `orders→products/users/settings`, `orders▷notifications` por evento; nunca al revés; kernel no depende de módulos).
- Verificación: pendiente — es plan/dirección, no código entregado. Se valida (§0/§22) conforme se materialice cada módulo en el Master Plan 8 semanas.
- Reflejo en docs (rule #24): `bounded-contexts.md`, `dependency-rules.md`, `decision-matrix.md` (nuevos), `roadmap/MASTER_PLAN_8WEEKS_HEXAGONAL.md`, reglas 44/45/46.

## D-039 · Estrategia de error única: excepciones de dominio (sin Result/Either)
- Fecha: 2026-07-07 · Estado: vigente.
- Contexto: el kernel congelado (D-038) listaba `Result`/`Either`, pero NestJS ya lanza excepciones (`UnauthorizedException`, `BadRequestException`…) en todo el código. Mezclar Result + excepciones = dos estilos de control de error conviviendo (el peor de los mundos). Como aún NO hay producción, conviene fijar UNO definitivo ahora sin costo de cambio.
- Decisión: **un solo estilo → excepciones de dominio.** El dominio lanza `DomainError extends Error` (kernel). Los subtipos (`OrderNotFoundError`) heredan de `DomainError` y la presentación (Nest) los mapea a su HTTP. Las Value Objects validan en el constructor y lanzan `DomainError`. **`Result` y `Either` se ELIMINAN del kernel** — se reconsideran solo si un flujo real lo justifica (regla 45).
- Kernel definitivo: `Entity`, `AggregateRoot`, `ValueObject` (cuando aparezca la 1ª VO), `DomainEvent`, `DomainError`, `UseCase`.
- Verificación (§0): `kernel/domain/DomainError.ts` creado y ejercido por el spike (D-040); `tsc` 0 en kernel/ y modules/; 2/2 tests del agregado verdes.

## D-040 · Spike vertical-slice: módulo `orders` piloto (CancelOrder)
- Fecha: 2026-07-07 · Estado: vigente (prueba de molde; no reemplaza aún el path viejo).
- Contexto: antes de comprometer la Semana 1 completa, medir el costo real de migrar de capas horizontales a Vertical Slice con dominio rico. Alcance del spike: `Order` + mapper + 1 caso de uso (`CancelOrder`), coexistiendo con el código viejo (migración incremental, decisión del usuario).
- Qué se construyó: `kernel/domain/{Entity,AggregateRoot,DomainEvent,DomainError,UseCase}` + `modules/orders/{domain/entities/Order, domain/events/OrderCancelled, domain/ports/order.repository.port, infrastructure/persistence/order.mapper, application/cancel-order.use-case, tests/unit/order.spec}`.
- Resultado (§0/§22): `tsc` 0 en archivos nuevos; 2/2 tests del agregado verdes. La regla de negocio (solo PENDING se cancela) se movió del repo TypeORM al agregado `Order`. El puerto habla `Order`, NO `OrderEntity` → cierra la fuga de dependencia que tenía `domain/order/order.repository.ts` viejo (importaba OrderEntity, violaba dependency-rules §2).
- Fricciones medidas (lo que costará el turno completo): (1) `OrderStatus` duplicado — un enum de dominio en paralelo al de infra; el mapper puentea por valor string idéntico (`as unknown as`); unificar (infra importa el de dominio) es ripple aparte. (2) el puerto nuevo no reemplaza al `IOrderRepository` viejo todavía → dos repos hasta cablear el adapter Nest y mover el resto de casos de uso. (3) transacción/ownership siguen en el adapter; el caso de uso delega el filtro por dueño al puerto (`findOwned`).
- Deuda preexistente detectada (NO del spike): `application/orders/orders.service.spec.ts` tiene 3 errores `tsc` (pasa `DataSource` donde va `IOrderRepository`) del refactor a medias sin commitear. Arreglar al cablear el módulo.
- Estimación tras el spike: migrar `orders` completo (todas las transiciones + stock D-037 al agregado + adapter Nest + mover casos de uso + verde los 65 tests) ≈ Semana 1 completa (16h). Los otros 5 módulos son más chatos (regla 46).

## D-041 · Normalización: denormalizaciones deliberadas (auditoría datos/transacciones)
- Fecha: 2026-07-09 · Estado: vigente.
- Contexto: la auditoría de datos marcó como P3 tres "denormalizaciones". Tras análisis, las tres son **decisiones deliberadas**, no defectos, y se documentan aquí para que futuras auditorías las reconozcan como intencionales:
  - **`orders.branch_id` / `branch_name` (texto, sin tabla `branches`)**: es un **snapshot de recibo** — el pedido queda autodescriptivo de dónde se recoge, aunque la lista de sucursales cambie. No hay multi-sucursal real todavía; cuando lo haya, se crea `branches` + FK (ver migración `AddOrderBranch`). Patrón legítimo (igual que el snapshot de precio en `order_items`).
  - **`products.category` (texto libre)**: es una **taxonomía abierta definida por el admin** (el DTO valida `@IsString`/`MaxLength`, no un conjunto cerrado). Un enum/tabla estricta impediría agregar categorías sin migración. Se deja como texto por diseño.
  - **`user_profile.role` (copia de `UserRole`)**: es un **caché NO autoritativo**. La autorización se hace SIEMPRE desde el JWT (`roles.guard` lee `req.user.roles`, verificado); `role` solo se siembra en la creación del perfil y no se lee para ninguna decisión. Fuente de verdad = Keycloak/JWT.
- Decisión: no se normalizan (crear `branches`/`categories` o quitar `role` sería ceremonia sin valor a la escala actual, regla 45/46). Se documentan como deliberadas.
- Invariantes financieras/estructurales que SÍ se forzaron (D-041 hermana, migraciones): CHECK `subtotal = round(unit_price*quantity,2)`, CHECK status↔timestamp, CHECK `congestion_yellow>=0`, triggers `total_amount=SUM(subtotal)` (diferido) y `payment.amount=total_amount`, 8 índices, y optimistic locking (`@VersionColumn`) en `products`/`app_settings`. Verificadas contra Postgres real.

## D-042 · Hardening diferido a producción (auditoría P0-P5, conscientemente diferido)
- Fecha: 2026-07-10 · Estado: vigente (diferido, con rationale).
- Contexto: la auditoría a cero defectos marcó varios ítems de endurecimiento que NO se pueden resolver sin infraestructura de producción (SMTP, config del realm, turno de deps). No son defectos alcanzables hoy; se documentan como diferidos conscientes (no "olvidados") para que futuras auditorías los reconozcan como tracked:
  - **CVE de multer (high, DoS)**: es dep **transitiva** de `@nestjs/platform-express` e **INALCANZABLE** (la app no tiene endpoints de upload; multer nunca se ejecuta). Fix = bumpear platform-express en un turno de deps dedicado (no en medio del hardening). Sin superficie de ataque real hoy.
  - **`aud` (audience) opt-in en el JWT** (`jwt.strategy.ts`): la validación de audiencia solo aplica si `KEYCLOAK_AUDIENCE` está seteada; la defensa vigente es `azp===mobile-app` (verificada). Fijar `aud` requiere configurar el client en Keycloak (prod).
  - **Verificación de correo**: `createUser` crea con `emailVerified:true` (no hay SMTP en local). En prod: `emailVerified:false` + `VERIFY_EMAIL` + no auto-login hasta verificar. El filtro actual es el regex `@edu.utc.mx`.
  - **Brute-force del realm**: el realm importado no define `bruteForceProtected`/`passwordPolicy`; la barrera vigente es el throttle de la app (5/min, ahora con `trust proxy` configurable). Activar en el realm de prod.
  - **Email en log de auditoría (P5)**: es apropiado y esperado para un log de auditoría de seguridad (no hay tokens/passwords); a lo sumo, política de retención/acceso si los logs se centralizan en prod.
  - **Enumeración de cuentas en el registro (P4, CWE-204)**: `register` devuelve 409 "ya existe una cuenta" → distingue correos registrados. Valor práctico casi nulo (el dominio `@edu.utc.mx` hace los correos predecibles de por sí) + rate-limit 5/min. El 409 es necesario para la UX de registro; unificar a un mensaje genérico llega con el flujo de verificación por correo (SMTP en prod). Residual aceptado.
- Decisión: se difieren a la fase de producción; ninguno es alcanzable/explotable en el despliegue actual (local + túnel para demo). Trackeados aquí y en [[regresion-fase1-backlog]].

## D-043 · Última iteración de coherencia: vocabulario de dominio y puertos en su lugar
- Fecha: 2026-07-10 · Estado: vigente. Cierra dos incoherencias de ubicación detectadas en la auditoría de arquitectura (gate verde antes y después: `tsc` 0 + 94/94).
- **Contexto (C1):** los enums de dominio (`UserRole`, `ProductStatus`, `PaymentMethod`, `PaymentStatus`) vivían físicamente en `infrastructure/database/entities/enums.ts`. `OrderStatus` ya se había movido a su slice (`modules/orders/domain`) e infra lo re-exportaba — ese patrón quedó a medias para los otros cuatro, provocando que `domain/` y `contracts/` importaran de `infrastructure/` (viola la regla de oro de dependency-rules §1).
- **Contexto (C2):** `src/domain/{product,settings,user-profile}/*.repository.ts` eran los únicos archivos de ese `domain/` clásico y tipaban sus métodos con **entidades TypeORM** → un folder llamado `domain/` que sólo importaba infra (contradice dependency-rules §2 y la regla 44).
- **Decisión:**
  - **C1:** el vocabulario de los contextos sin slice propio (identity, products-CRUD, payments) se mueve a `src/domain/enums.ts` (PURO, 0 imports). `infrastructure/database/entities/enums.ts` pasa a ser **barrel** que re-exporta (OrderStatus del slice + los 4 de `domain/enums`) → entidades TypeORM y migraciones no cambian una línea; los valores string son idénticos, la columna enum de Postgres no se toca. Dominio y contracts dejan de importar de infra.
  - **C2:** los tres puertos se reubican a `application/<contexto>/*.repository.port.ts` (el puerto vive con su consumidor; el adaptador TypeORM en `infrastructure/` lo implementa → dirección hexagonal correcta). `src/domain/` clásico queda como **vocabulario de dominio puro** (sólo `enums.ts`), no como falsos puertos.
- **Tradeoff reafirmado (hermano de D-041):** esos puertos de persistencia siguen hablando en la **entidad TypeORM como modelo compartido** (estilo anémico/active-record deliberado para el CRUD clásico; forzar modelos de dominio + mappers en products/settings/auth es la ceremonia que D-038/regla 46 rechazan). Por eso `application/<ctx>/*.repository.port.ts` importa la entidad: es una excepción **documentada** a dependency-rules §2, acotada a los contextos clásicos sin slice. El dominio con reglas propias (`modules/*/domain`, `kernel/domain`) queda 100% puro.
- **Resultado (§0/§22):** dominio sin un solo import de `infrastructure/@nestjs/typeorm`; `tsc` 0 + 94/94; regla de oro respetada salvo la excepción entity-as-model arriba. Ver [[arquitectura-objetivo-congelada]] y [[hardening-ledger-p0p5]].

## D-044 · Value Objects en `orders` (Money, Quantity, ids tipados)
- Fecha: 2026-07-10 · Estado: vigente. Cierra la "primitive obsession" del agregado (dinero=number, ids=string).
- **Contexto:** `Order.place()` calculaba dinero con `number` y redondeos manuales; ids y cantidades viajaban como primitivos sueltos. Las invariantes (monto ≥ 0 y 2 decimales; cantidad entera ≥ 1) vivían sólo en CHECK de BD y en `class-validator`, no en el dominio.
- **Decisión:** kernel gana `ValueObject<T>` (base con `equals` por valor). En `modules/orders/domain/value-objects/`:
  - **`Money`** — guarda CENTAVOS ENTEROS (no un `number` decimal) → suma/multiplicación exactas, sin float drift; redondea una sola vez en `of()`. `subtotal`/`total` cuadran con el CHECK `subtotal = round(unit_price*quantity,2)` sin re-redondear.
  - **`Quantity`** — entero ≥ 1 (misma invariante que el CHECK `quantity > 0`).
  - **`OrderId` / `ProductId`** — branded types (en runtime siguen siendo `string`, serializan y viajan a TypeORM sin conversión; el compilador impide mezclarlos o pasar un `string` suelto). El **mapper** es el único punto que traduce `string` de BD ↔ id tipado.
- **Borde:** los VOs viven en el dominio; el adaptador los convierte a primitivo al persistir (`money.toString()`, `qty.value`) y el mapper reconstruye al rehidratar. Los `contracts/` (DTOs de API) siguen en `number`/`string` (JSON).
- **Verificación (§0/§22):** `tsc` 0 + tests de VO (float-drift 0.1+0.2=0.30, redondeo, rechazos) + suite completa verde. La BD (`CHECK quantity>0`, `subtotal derived`) refleja exactamente las invariantes de los VOs (coherencia código↔datos).

## D-045 · Bounded context `notifications` + Domain Events + Outbox transaccional
- Fecha: 2026-07-10 · Estado: vigente. Segundo slice vertical real (tras `orders`); materializa el Context Map (orders ▷ notifications por evento).
- **Contexto:** BR-012 (avisos: aceptado/listo/cancelado/no recogido) vivía SOLO en el cliente, que hacía polling + diff del estado y re-derivaba el evento — duplicando la lógica que ya tienen las transiciones del agregado `Order`. El backend no tenía concepto de notificación.
- **Decisión:**
  - **Domain Events (vuelven al kernel):** `AggregateRoot.record/pullEvents` + `DomainEvent`. `Order` emite `OrderAccepted/Readied/Cancelled/NotPickedUp` en sus transiciones (fuente única de "qué pasó").
  - **Dispatcher en proceso (`shared/events`, @Global):** los handlers se auto-registran (OCP); el productor (orders) no conoce a los consumidores. El despacho corre DENTRO de la tx del cambio de estado (recibe el `EntityManager`).
  - **Outbox transaccional (`notifications` table):** el handler del slice `notifications` materializa cada evento como fila, en la MISMA tx (atomicidad: no hay aviso sin cambio ni cambio sin aviso). `UNIQUE(order_id, event_type)` + `ON CONFLICT DO NOTHING` = de-dup de BR-012 a nivel BD sin abortar la tx del pedido. FK a `orders` ON DELETE CASCADE.
  - **Lectura:** `GET /notifications/mine` (JWT, scoped por `sub`, BR-014). El contenido (título/cuerpo) se renderiza al leer desde el tipo (no se almacena texto → outbox normalizado); es BR-012 en el servidor, para que el cliente deje de duplicarlo.
  - **Slice fino (regla 46):** el outbox es append-only y la lectura trivial → `NotificationsService` usa el Repository de TypeORM directo, sin puerto/adapter (mismo criterio que products). La ESCRITURA va por el handler dentro de la tx.
  - **`expireOverdue` (flip masivo por SQL, no pasa por el agregado):** construye los `OrderNotPickedUp` desde las filas vencidas y los despacha en su tx.
- **Fix colateral (P0 preexistente, no de esta feature):** al arrancar la app se descubrió que `AuthService` inyectaba `AuditLogService` desde `3a14e14` pero `AuthModule` nunca lo proveía ni era global (el comentario "global" en `app.module` era intención no implementada) → la app NO arrancaba desde ese commit (los unit tests no montan el grafo DI). Se creó **`LoggingModule` @Global** (provee/exporta `AuditLogService`) y se quitaron los providers duplicados de `app.module` y `orders.module`. Root fix, no per-módulo.
- **Verificación (§0/§22):** `tsc` 0 + build 0 + **la app ARRANCA** (`Nest application successfully started`, ruta `GET /notifications/mine` mapeada, 0 errores DI) + migración aplicada en Postgres real + smoke test del outbox (de-dup `INSERT 0 1`→`INSERT 0 0`, FK rechaza pedido inexistente) + 115 tests verdes.

## D-046 · `products` consolidado a slice + limpieza de mocks basura
- Fecha: 2026-07-10 · Estado: vigente. Cierra el "split-brain" de products y elimina los datos mock que sobraban tras el turno de datos.
- **Contexto (backend):** `products` vivía partido — `modules/products/domain/product.policy.ts` (policy) **y** las capas clásicas (`application/products/`, `presentation/products/`, `infrastructure/database/repositories/typeorm-product`). Convivían dos estilos de organización para el mismo contexto (deuda de la migración incremental D-040 a medias).
- **Decisión (backend):** consolidar TODO en `modules/products/` como slice vertical (igual estructura que `orders`): `application/` (service + `product.repository.port.ts`), `contracts/` (DTOs, aplanado el `dto/`), `domain/` (policy), `infrastructure/persistence/` (adapter TypeORM), `presentation/` (controller + module), `tests/unit/`. **Profundidad pragmática** (regla 46): se MANTIENE el estilo entity-as-model (sin forzar aggregate/VOs como orders) — products es CRUD y no tiene invariantes ricas propias; su puerto vive en `application/` (excepción entity-as-model de D-043), no en `domain/ports/`. La entidad TypeORM sigue central (`infrastructure/database/entities/`, como todas). "Una misma línea": cada contexto es un slice; el grado de DDD táctico lo dicta el contexto, no la uniformidad.
- **Contexto (frontend):** tras el turno de datos, coexistían `api.ts` (real) y datos `mock` que solo eran muleta de cuando el túnel de Cloudflare no respondía.
- **Decisión (frontend):** separar **tipos + constantes de display** (vocabulario REAL usado por el camino de la API) a `entities/{product,order}/admin-types.ts`, y **ELIMINAR los datos falsos** que solo eran muleta/muertos: `PRODUCTS` + `CATEGORIES` (product/mock.ts, CATEGORIES ni se importaba), `ADMIN_PRODUCTS` (fallback `__DEV__`), `ADMIN_ORDERS` (seed inicial del store → ahora `[]`). El `createCatalogLoader` deja de aceptar `mock`: ante fallo, catálogo vacío + `error` también en dev (backend = única fuente, BR-015). Se renombró `branch/mock.ts` → `branch/branches.ts` (es config canónica sin backend, D-041 — no era mock; el nombre mentía). Regla dura del usuario: **no se conserva mock basura.**
- **Verificación (§0/§22):** backend `tsc` 0 + 117 tests + build 0 + **app arranca** (`ProductsController {/products}` mapeado, 0 errores DI); frontend `tsc` 0; 0 referencias muertas a los símbolos borrados.

---

## D-047 · Roles de cooperativa (5) y alcance por sucursal — modifica BR-003

- Fecha: 2026-07-14 · Estado: **propuesto** (diseño aprobado; sin implementar).
- **Contexto:** una cooperativa la operan **3 personas + el administrador**, y hay **una cooperativa por plantel** (Tlalpan, Coyoacán, Roma). El sistema solo tenía **2 roles** (`admin`, `user`) y **ningún alcance por sucursal**: `user_profile` no tiene `branch_id`, no existe tabla `branches`, y `GET /orders/all?branchId=X` **autoriza con un dato que manda el cliente** (verificado: `orders.controller.ts:52-58` + `order.repository.ts:380`). Sin el parámetro devuelve **todas** las cooperativas → **BOLA/IDOR (OWASP A01)**. Además `create-order.dto.ts:49-58` acepta `branchId`/`branchName` como **texto libre**: un pedido puede cobrarse y **quedar invisible para todas las cocinas**.
- **Decisión:** 5 roles — `user` (plataforma), y anclados a **una** cooperativa: `cocina` (acepta y termina), `inventario` (materia prima, costos, ganancia), `mostrador` (cobra, caja, entrega, reoferta, factura), `admin` (superconjunto de su plantel). **Una persona = un rol.** **Sin super-admin** (crear cooperativas y admins se hace en la consola de Keycloak, fuera de la app). Tabla `branches` + FK. El `branch_id` viaja **en el JWT** (protocol mapper de Keycloak) y **jamás** se lee del request → nueva **BR-016**.
- **Autorización explícita del usuario** (requisito de BR-003), textual: *"Por cooperativa suelen ser 3 personas… una que cocine, otra que haga el inventario con costos y ganancias, otra que reciba las órdenes, cobre, dé cambio y facture. Más el admin que ya tenemos."*
- **Consecuencias:** **BR-003 se modifica** (permitía solo `admin`/`user` y prohibía `staff`/`cashier` — que es lo que `mostrador` es). **`app_settings` deja de ser fila única** (`@Check("id" = 1)`): pasa a ser por sucursal, o el admin de Roma le mueve el semáforo a Tlalpan. El **shape de la respuesta depende del rol**: `cocina` recibe un DTO **sin** `total`, `payment`, `customer` ni `email` (BR-014) — ocultarlo en la UI **no es seguridad**.
- **Plan:** `docs/superpowers/plans/2026-07-14-01-cimientos-roles-y-alcance.md`.

## D-048 · SSOT: los contratos se REFERENCIAN, no se copian ni se generan

- Fecha: 2026-07-14 · Estado: **propuesto**.
- **Contexto:** **25 duplicaciones** verificadas entre backend y frontend. Las tres que duelen: (1) **el precio a cobrar** está escrito dos veces (`Order.ts:179` cobra `reofferPrice ?? price`; `product/model/types.ts:34` lo muestra aparte — y el comentario del front *pide* que coincidan, lo que prueba que nada los obliga); (2) el **cliente inventa la sucursal** (ver D-047); (3) la **fórmula del semáforo** está escrita **carácter por carácter dos veces**, y **ambas están vivas** (el cliente usa la del servidor; el dashboard admin usa la copia local con los umbrales `5/10` hardcodeados).
- **Alternativas (regla 43):** (A) backend sirve datos/config · (B) los `contracts/` del backend **son** el paquete compartido, consumidos con `import type` · (C) codegen OpenAPI · (D) ts-rest/tRPC/Zod.
- **Decisión: A + B. Se descartan C y D.**
  - **C (codegen) — descartado** porque su modo de fallo es el peor: si nadie regenera, **los tipos viejos siguen compilando en verde** y la app revienta en runtime, **con la falsa confianza de "tener SSOT"**. El `--check` que lo evitaría **necesita CI, y no hay CI en el frontend**. Además el plugin de NestJS **no ve `interface`s** (verificado en su código fuente: un controlador que devuelve `Promise<ProductResponse>` emite `type: Object`, un schema vacío — **no falla: miente**).
  - **B es más fuerte, no solo más barato:** **no hay artefacto generado que pueda quedarse viejo.** La barrera es el **`tsc --noEmit` del frontend, que ya se corre**. Babel **borra** los `import type` → **Metro nunca los ve**: cero bytes en el bundle, cero config, cero dependencias.
- **Consecuencias:** los `contracts/` deben quedar **puros** (hoy `products/contracts/product-response.ts:1` **importa `ProductEntity` de TypeORM**). Los enums se consumen derivando la unión (`` type X = `${BackendEnum}` ``), porque un `enum` de TS **emite código real**. Se blinda con una regla de ESLint (`consistent-type-imports`), no con disciplina.
- **Plan:** `.../2026-07-14-02-ssot.md`.

## D-049 · RLS: primero quitarle el superusuario a la app; después las políticas

- Fecha: 2026-07-14 · Estado: **propuesto**.
- **Contexto — PROBADO experimentalmente, no supuesto:** se creó una tabla, se activó `ENABLE ROW LEVEL SECURITY` + `FORCE` y se le puso la política **más restrictiva que existe** (`USING (false)` = *nadie ve nada*). **La app siguió viendo todas las filas.** Porque `UTC_PROJECT` es **superusuario**, tiene **`BYPASSRLS`**, es **dueño de todas las tablas** y es **el único rol de la base** — y con él se conecta el backend *y* corren las migraciones. **Postgres no aplica RLS a un superusuario. Ni con `FORCE`.**
- **Decisión:** RLS **sí**, pero en este orden: (1) cerrar el defecto en la **aplicación** (D-047); (2) **partir la identidad de la base en tres** (`postgres` superusuario · `utc_owner` dueño, NOSUPERUSER · `utc_app` sin DDL ni `BYPASSRLS`); (3) **entonces** las políticas, con `FORCE`, `SET LOCAL` (nunca `SET`) y `current_setting()` **envuelto en subselect** (si no, tumba los índices).
- **Consecuencias / trampas documentadas:** `SET` en vez de `SET LOCAL` → **el pool recicla la conexión con el valor puesto y filtra datos entre cooperativas** (el mecanismo de seguridad **causa** la fuga que venía a evitar). `SET LOCAL` obliga a que **toda** petición corra en transacción — **hoy las lecturas NO lo hacen**, y `createWithItemsAndPayment` deja la carga de productos fuera de la tx **a propósito** (para no sostener la conexión durante el I/O del pago): **RLS revierte esa optimización**. El `OrderExpiryScheduler` **no tiene JWT** → con RLS vería 0 filas y **los pedidos nunca vencerían, en silencio**.
- **Veredicto honesto:** el paso (2) **vale por sí solo aunque nunca se haga RLS** (limita el radio de una inyección SQL). Y **una seguridad que miente es peor que no tenerla.**
- **Plan:** `.../2026-07-14-03-rls.md`.

## D-050 · Motor de costeo: unidad base, rendimiento (yield), CPP y snapshot de costo

- Fecha: 2026-07-14 · Estado: **propuesto**.
- **Contexto:** el usuario planteó *"3 kg de carne por $150; la hamburguesa gasta 500 g → $25 de carne"*. Ese cálculo **rompió el modelo escrito** (insumos como "porciones" contables, `stock` entero): el insumo necesita **unidad base**, **stock decimal** y **costo por unidad base**.
- **Decisión:**
  - **Unidades base: solo `g`, `ml`, `pza`.** `kg` y `L` son unidades de **COMPRA** y viven en la línea de compra con su `factor_a_base`. *(Si se permiten kg **y** g, un día alguien captura `0.5` pensando en kilos y el sistema entiende medio gramo.)*
  - **El factor de empaque va en el LOTE, no en el insumo** — una caja de lechuga trae 12 piezas hoy y 10 la próxima; si el factor vive en el insumo, **no puedes tener dos proveedores sin duplicar el insumo**.
  - **Rendimiento (`yield`) por insumo:** el hueso, la cáscara, el olote **se pagan y no se sirven**. `bruto = neto / yield`. **Depende de la PRESENTACIÓN**: la misma papa rinde **80 % en costal** y **100 % congelada**.
  - **Costeo: CPP (promedio ponderado)** para el dinero; **FEFO** para rotar el refrigerador. Son **dos preguntas distintas**. FIFO como método contable obliga a partir lotes y **a deshacer capas de costo al cancelar un pedido** — ahí viven los bugs.
  - **El costo se CONGELA en el pedido** (snapshot), igual que el precio (BR-015): **una compra de mañana no puede cambiar el margen de ayer**.
  - **`track_stock = false`** para lo que nadie cuenta jamás (sal, especias). *Si la sal entra en el cálculo de disponibilidad, el sistema reporta **"0 hamburguesas" para siempre**.*
  - **IVA:** venta de comida preparada **16 %** (LIVA art. 2-A, *"inclusive para llevar"*); compra de **alimento 0 %** — y eso **incluye aceite, mayonesa, catsup y azúcar**. Solo los **desechables** gravan 16 %, más dos excepciones (**concentrados que dan refresco** — el polvo de horchata — y **saborizantes/aditivos**). **El margen se calcula contra `precio / 1.16`**, o se infla ~16 puntos.
- **Errores registrados (§40):** el diseño **aplicó el yield del 80 % a la carne MOLIDA**, que **no tiene hueso** (rendimiento 100 %); y **calculó con precios que no existían en ningún catálogo** ($0.05/g vs. $0.130/g reales), invalidando todas sus conclusiones. **Ambos quedan escritos en el spec, no borrados.**
- **Spec:** `docs/superpowers/specs/2026-07-14-motor-de-costeo-design.md` · **Datos:** `docs/datos/recetas-e-insumos.md`.

## D-051 · Efectivo con desglose, caja con corte y layout CFDI (sin timbrar)

- Fecha: 2026-07-14 · Estado: **propuesto**.
- **Decisión:** el cliente **declara con qué billetes y monedas paga**; el **backend calcula el cambio** (BR-015) y **apaga las denominaciones imposibles** (`(entregado + d) − total > cash_max_change` → deshabilitada). Mostrador **abre la caja con un fondo**, el sistema registra **cada pieza que entra y sale**, y **cierra con corte**: contado vs. esperado, **con la diferencia registrada y un responsable**.
- **Dos algoritmos distintos, y confundirlos es el bug:** el **"pago exacto"** del cliente usa un **voraz** (válido: el sistema MXN es canónico **y el bolsillo tiene piezas infinitas**). **La caja NO.** Con existencias acotadas es la **mochila acotada** → **programación dinámica**. *(Se puede tener $500 en billetes de $200 y ser incapaz de dar $100. El voraz falla **en silencio**, dando el cambio mal.)*
- **CFDI: se genera el LAYOUT, no se timbra.** Claves: `ClaveProdServ` **90101500**, `ClaveUnidad` **E48**, `FormaPago` **01**, `MetodoPago` **PUE**, `ObjetoImp` **02**, `Exportacion` **01**. **Trampa dura:** el SAT valida que `UsoCFDI` sea **compatible con el `RegimenFiscalReceptor`** — **`G03` NO es válido para el régimen `605` (Sueldos y Salarios)**, que es **el del estudiante promedio**; le corresponde **`S01`**. Mandarlo mal = **el PAC rechaza el documento**. → El cliente **captura sus datos fiscales en su perfil**, y se validan **en captura**, no al timbrar. `orders.facturado` es **obligatorio desde el día 1**: un pedido ya facturado **no puede entrar también en la factura global**.
- **Plan:** `.../2026-07-14-05-efectivo-caja-ticket-cfdi.md`.

## D-052 · Producto terminado: la reoferta es un bucle infinito y se cobra antes de reservar

- Fecha: 2026-07-14 · Estado: **propuesto** · ⚠️ **DOS BUGS YA EN PRODUCCIÓN**.
- **Contexto:** el modelo solo conoce **insumos** y **recetas**. Pero **la cocina produce en lote y guarda cosas hechas** (la gelatina se cuaja en molde de 20; el aceite se compra en tina de 20 L; **la reoferta vende una hamburguesa ya hecha, cuyo respaldo de insumos es CERO**). **Cinco síntomas, una ausencia.**
- **Bug 1 — la reoferta nunca termina.** `reofferPrice` vive **en el PRODUCTO** (`Order.ts:179`), no en la unidad rescatada → **toda venta de ese producto va con descuento, incluidas las recién hechas** *(es la canibalización que el propio diseño advertía… implementada)*. Y `NOT_PICKED_UP → 'release'` (`Order.ts:283`) devuelve la unidad al stock **sin caducidad y sin merma**: `release → reoferta → not_picked_up → release`, **infinito**. **La hamburguesa del lunes sigue disponible el viernes.**
- **Bug 2 — se cobra antes de reservar.** El stock se aparta al **aceptar**; el cliente **paga al pedir**. El propio código lo confiesa: `default: return 'none' // (pending nunca reservó)`. **Dos clientes pagan la última hamburguesa.**
- **Decisión:** tabla `finished_goods` (`qty`, `produced_at`, **`expires_at`**, **`is_reoffer`**, **`reoffer_price` DE LA UNIDAD**, `source`). **Disponible = `finished_goods` + `floor(min(stock_i / bruta_i))`.** Al vencer `expires_at` → **MERMA obligatoria** (el ciclo **termina**). El aceite se parte en dos: la **absorción por porción** es **food cost**; el **cambio de tina** es una **merma de operación**.
- **⚠️ Corrección registrada (§15/§40):** una versión anterior de este ADR afirmaba que reservar en `place()` era *"mover una línea"* porque *"ya existe el `UPDATE … WHERE stock >= qty`"*. **FALSO.** El SQL real es `GREATEST(0, "stock" - :qty)` — **incondicional, satura en 0, nunca falla** (y el comentario documenta esa semántica como **deliberada**: *"cocina al momento si no alcanza"*). **`ProductSnapshot` ni siquiera tiene campo `stock`.** Y **reservar en `place()` sin tocar las rutas de cancelación FUGA STOCK PARA SIEMPRE** (`cancelByOwner` devuelve `'none'` si no estaba preparado). **El arreglo son SEIS piezas, no una** — y **revierte D-037**, así que es una decisión de negocio, no un bug.
- **Spec:** `docs/superpowers/specs/2026-07-14-producto-terminado-design.md`.
