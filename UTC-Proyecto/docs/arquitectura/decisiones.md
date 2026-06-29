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
