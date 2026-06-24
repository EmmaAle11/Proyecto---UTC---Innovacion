# Correr el proyecto en otra PC — UTC Pick Sazón

> **Objetivo:** clonar el repositorio en una laptop nueva y dejar **todo corriendo** (Docker + backend + app). Este documento es el runbook: prerrequisitos, pasos en orden y las trampas verificadas que rompen el arranque si se ignoran.
>
> Última verificación: **2026-06-24** (sobre el equipo de desarrollo actual).

---

## 1. Estructura del repositorio (importante)

La **raíz real del repo** es la carpeta **padre**, no `UTC-Proyecto/`:

```txt
UTC/                          ← AQUÍ vive .git (esto es lo que se clona)
├─ .gitignore                 ← ignora node_modules, dist, .env, *.env, pgdata…
├─ .githooks/pre-commit       ← hook anti-secretos
├─ Propuesta_…corregida.docx
├─ UTC Pick Sazón…txt
└─ UTC-Proyecto/              ← el proyecto
   ├─ frontend/   (app Expo / React Native)
   ├─ backend/    (NestJS + TypeORM)
   ├─ infra/      (Docker: PostgreSQL + Keycloak)
   ├─ brand/      (másters del logo)
   └─ docs/       (esta documentación)
```

Al clonar obtienes el padre completo; el proyecto queda dentro de `UTC-Proyecto/`. El `.gitignore` **viaja con el clon** y protege secretos y artefactos en la nueva máquina.

---

## 2. Prerrequisitos del sistema (instalar antes)

| Requisito | Versión de referencia | Nota |
| --- | --- | --- |
| **Node.js** | 20.x (probado: v20.20.0) | + npm 10 |
| **Docker** + **Docker Compose v2** | Docker 29.x | El daemon debe estar corriendo |
| **(solo Linux) inotify watches** | `fs.inotify.max_user_watches=524288` | Si no, Expo/Metro truena con `ENOSPC` |

Subir el límite de inotify en Linux (permanente, requiere sudo en **cada** equipo):

```bash
echo 'fs.inotify.max_user_watches=524288' | sudo tee /etc/sysctl.d/99-expo-watchers.conf
sudo sysctl -p /etc/sysctl.d/99-expo-watchers.conf
```

---

## 3. Lo que NO viaja en el clon (hay que recrearlo)

| Falta en el clon | Por qué | Cómo recuperarlo |
| --- | --- | --- |
| **`node_modules/`** (frontend + backend) | gitignored | `npm install` en cada uno |
| **`infra/.env` y `backend/.env`** (valores reales) | secretos, gitignored | `cp .env.example .env` y rellenar |
| **La base de datos** (volumen Docker `pgdata`) | es local, no se clona | `npm run migration:run` (+ seed demo opcional) |
| **Keycloak** (admin, secret, MFA) | el contenedor no persiste volumen | `./keycloak/seed-admin.sh` + re-enrolar TOTP |
| **El hook anti-secretos** | `core.hooksPath` es config local, no se clona | `git config core.hooksPath .githooks` |
| **(Linux) inotify watches** | ajuste del SO, no del repo | ver §2 |

Sólo se versionan los `*.env.example` (con placeholders `cambia_esto_local`); los `.env` con valores reales **nunca** están en git (rules §17).

---

## 4. Runbook: clonar → correr (el orden importa)

```bash
# 0) Prerrequisitos: Node 20 + Docker corriendo. (Linux: inotify, ver §2.)
git clone <url-del-repo> UTC && cd UTC
git config core.hooksPath .githooks        # re-activa el hook anti-secretos

# 1) INFRA — Postgres + Keycloak en Docker
cd UTC-Proyecto/infra
cp .env.example .env        # rellenar: passwords, puertos, ADMIN_SEED_*, BACKEND_CLIENT_SECRET
docker compose up -d
docker compose ps           # ambos contenedores "healthy"/"running"
./keycloak/seed-admin.sh    # crea el admin (rol admin) + fija el secret de backend-svc

# 2) BACKEND — NestJS
cd ../backend
cp .env.example .env        # ⚠ que DB_* y KEYCLOAK_* COINCIDAN con infra/.env (ver §5)
npm install
npm run migration:run       # crea las 6 tablas + 5 enums en Postgres
#   (opcional) cargar datos demo — DESPUÉS de la migración:
docker exec -i utc_postgres psql -U <DB_USER> -d <DB_NAME> < ../infra/postgres/seed-demo.sql
npm run start:dev           # backend en :3001 (recarga sola al editar)

# 3) FRONTEND — Expo
cd ../frontend
npm install
npx expo start              # QR para Expo Go (mismo WiFi), o tecla "w" para abrir en navegador
#   admin: enrolar MFA (TOTP) una vez en la Account Console de Keycloak
```

> El detalle de la parte Docker está en [`infra/README.md`](../../infra/README.md).

---

## 5. Trampas verificadas (esto rompe el arranque)

1. **Puerto del backend: 3001, no 3000.** El frontend tiene **fijo `BACKEND_PORT = 3001`** en [`frontend/src/shared/api/client.ts`](../../frontend/src/shared/api/client.ts), pero `backend/.env.example` trae `PORT=3000`. En la otra laptop **pon `PORT=3001`** en `backend/.env`, o la app no encuentra el backend (en modo LAN). Alternativa: exportar `EXPO_PUBLIC_API_URL` con la URL real.

2. **Los dos `.env` deben ser consistentes** (si no, nada conecta):
   - `backend/.env` `DB_PASSWORD` = `infra/.env` `POSTGRES_PASSWORD` (igual `DB_USER`/`DB_NAME`/`DB_PORT` ↔ `POSTGRES_*`).
   - `backend/.env` `KEYCLOAK_BACKEND_CLIENT_SECRET` = `infra/.env` `BACKEND_CLIENT_SECRET`.
   - El puerto dentro de `KEYCLOAK_URL` = `infra/.env` `KEYCLOAK_PORT`.

3. **Convención del nombre de BD.** La documentación usa `UTC_PROJECT_DB` / usuario `UTC_PROJECT`, pero `.env.example` trae `utc_food` / `utc`. Funciona igual (todo lee del `.env`), pero los comandos de demo copiados de los docs (`psql -U UTC_PROJECT -d UTC_PROJECT_DB`) sólo coinciden si usas esos mismos valores en el `.env`. **Elige una sola convención** y úsala en los dos `.env`.

4. **Puertos de host.** En el equipo actual se usan **5433** (Postgres) y **8082** (Keycloak) porque 5432/8080 ya estaban ocupados por otro proyecto. En una laptop limpia, los **defaults 5432/8080** suelen estar libres. Cualquiera sirve, mientras los `.env` sean consistentes.

---

## 6. Checklist final (no cierres hasta que todo dé verde)

- [ ] `docker compose ps` → Postgres y Keycloak **healthy/running**.
- [ ] `./keycloak/seed-admin.sh` → termina sin error (admin + backend-svc listos).
- [ ] `npm run migration:run` → "migration executed"; 2ª corrida → "No migrations are pending".
- [ ] `psql … -c '\dt'` → lista las **6 tablas** (`user_profile`, `products`, `orders`, `order_items`, `payments`, `preparation_times`) + `migrations`.
- [ ] `curl http://localhost:3001/health` → `{status, db}` con la BD conectada.
- [ ] `npx expo start` → Metro arranca sin `ENOSPC`; la app carga.
- [ ] Login admin con MFA (TOTP enrolado) → token con rol `admin`.

---

## 7. Probar la app en un teléfono (opcional)

En el equipo actual el teléfono físico **no conecta** por WiFi (aislamiento de red + IPs de Docker que confunden a Expo). Vías confiables cuando se retome:

- **USB + `adb`** (lo más confiable, sin WiFi): `adb reverse tcp:8081 tcp:8081 && adb reverse tcp:3001 tcp:3001`, luego `npx expo start`.
- **Emulador Android** (requiere Android SDK).
- **`npx expo start --web`** corre en el navegador, pero el render es una **aproximación** (no nativo).
- Para túnel (`--tunnel`) hay que setear `EXPO_PUBLIC_API_URL` con la URL real del backend.

---

> **Nota de seguridad (rules §17/§23):** nunca commitees los `.env` con valores reales — el `.gitignore` y el hook los bloquean. Los `git commit`/`git push` los ejecutas tú a mano.
