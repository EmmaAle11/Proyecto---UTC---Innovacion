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
- Decisión: el dominio institucional es **`utc.edu.mx`**. Se corrige BR-002. **Formato exacto del correo: NO VERIFICADO** — el usuario indicó `edu.utc.mx`; falta evidencia del formato real (p. ej. `@utc.edu.mx`); confirmar antes de validar correos en backend.
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
