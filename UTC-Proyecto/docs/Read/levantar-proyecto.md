# Levantar el proyecto — comandos en orden

> Solo los comandos para **dejar todo corriendo**, en secuencia.
> Requisitos previos: **Docker** corriendo + **Node 20**. Puertos de este equipo:
> Postgres `5433`, Keycloak `8082`, backend `3002`.

```txt
Orden:   INFRA (Docker)  →  BACKEND (esquema + semilla + API)  →  FRONTEND (app)
```

---

## 1) INFRA — Postgres + Keycloak (Docker)

```bash
cd UTC-Proyecto/infra
docker compose up -d          # levanta Postgres + Keycloak
docker compose ps             # esperar a que ambos estén "healthy"
```

## 2) BACKEND — NestJS (:3002)

```bash
cd ../backend
npm run migration:run         # crea el esquema (tablas + enums)   ← solo la 1ª vez
docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB < ../infra/postgres/seed-demo.sql   # semilla: admin + 10 productos ← solo la 1ª vez
npm run start:dev             # backend en :3002 (recarga sola al editar)
```

## 3) FRONTEND — Expo

```bash
cd ../frontend
npx expo start                # tecla "w" = navegador · QR = Expo Go (mismo WiFi)
```

### 3-bis) Expo Go por TÚNEL (teléfono en otra red / WiFi que bloquea LAN)

En este equipo el teléfono físico **no** alcanza la PC por LAN, así que se usa túnel
tanto para Expo (bundle) como para el backend (API). Túnel elegido: **Cloudflare
Tunnel** (`cloudflared`) — gratis, sin cuenta, sin intersticial, confiable.
Para Expo se usa `--tunnel` (`@expo/ngrok`, ya instalado).

```bash
# Instalar cloudflared UNA sola vez (Ubuntu/Debian, paquete oficial):
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

```bash
# a) Exponer el backend (:3002) con una URL pública. En otra terminal:
cloudflared tunnel --url http://localhost:3002    # imprime https://XXXX.trycloudflare.com

# b) Arrancar Expo por túnel apuntando la app a esa URL pública:
cd UTC-Proyecto/frontend
EXPO_PUBLIC_API_URL=https://XXXX.trycloudflare.com npm run tunnel   # = expo start --tunnel
# Escanea el QR con Expo Go. La app ya lee EXPO_PUBLIC_API_URL (src/shared/api/client.ts).
```

- Sin `EXPO_PUBLIC_API_URL`, en modo túnel la app derivaría el host de ngrok (no la PC)
  y **no** encontraría el backend.
- El backend por túnel no necesita CORS para Expo Go (React Native no es navegador).
- Alternativa con cuenta: **ngrok** (`ngrok http 3002`) tras registrarte y configurar el
  authtoken; misma idea, pero cloudflared no pide cuenta.

---

## 4) BUILD nativo — APK con NOTIFICACIONES (development build)

**Por qué:** Expo Go (SDK 53+) **removió las notificaciones del SO**, por eso allí no se
ven (la app las desactiva sola en Expo Go). Para verlas en el teléfono se hace un
**development build**: un APK propio, tipo Expo Go pero con nuestros módulos nativos.
Nuestras notificaciones son **locales** (las dispara la app al cambiar el estado del
pedido), así que **NO necesitan Firebase/FCM**. El build se hace en la nube con **EAS**
(no requiere Android Studio ni SDK local).

### 4.0) Primera vez en la Mac — clonar e instalar dependencias

`node_modules` **NO viaja en git**: al clonar el proyecto en la Mac hay que **instalar
las dependencias** en `frontend/` y `backend/` (obligatorio en cada equipo nuevo).
Los `.env` tampoco se commitean.

```bash
git clone <repo> && cd UTC-Proyecto

# 1) Dependencias — OBLIGATORIO en cada equipo nuevo:
cd frontend && npm install
cd ../backend && npm install

# 2) Variables de entorno (no están en git; se crean a partir del ejemplo):
cd ../infra && cp .env.example .env      # ajusta puertos/credenciales locales
# backend/ también necesita su propio .env (DB + Keycloak). Ver infra/.env y decisiones D-013/D-014.

# 3) (OPCIONAL) alinear los parches de los paquetes Expo al SDK 56:
cd ../frontend && npx expo install --check
```

> `npm install` es **obligatorio** para correr o buildear. `npx expo install --check`
> es **opcional** (solo higiene de versiones de parche; no hace falta para nada de esto).

Después: el esquema + semilla de las secciones **1) INFRA** y **2) BACKEND**
(`docker compose up -d`, `migration:run`, la semilla y `./keycloak/seed-admin.sh`).

### 4.1) Instalar cloudflared (una vez, según el equipo que HOSPEDA el backend)

```bash
# macOS (Homebrew) — el equipo de la demo:
brew install cloudflared

# Linux (Ubuntu/Debian):
wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb
```

> En Mac, Docker = **Docker Desktop** corriendo. Node 20 (`brew install node@20`).

### 4.2) Construir el APK (una vez; se repite solo si cambian módulos nativos)

```bash
npm i -g eas-cli
cd UTC-Proyecto/frontend
eas login                                      # cuenta Expo gratis
eas init                                        # enlaza el proyecto (projectId → app.json) ← solo la 1ª vez
eas build -p android --profile development      # ~10-20 min en la nube → APK descargable (QR/enlace)
```

Instala el APK en el teléfono Android (permitir **"orígenes desconocidos"**). La keystore
de firma la genera EAS sola.

> **Android vs iPhone (importante).** Esta versión de prueba es un **APK → solo Android**.
> Un **iPhone no instala APKs**. Opciones para iPhone:
> - **Expo Go** (gratis, ya): instala Expo Go de la App Store y escanea el QR de Metro (túnel).
>   Corre **todo el flujo**, pero **sin notificaciones del SO** (Expo Go SDK 53+ las removió; por
>   eso el APK). Suficiente para demostrar la app en iPhone.
> - **Build iOS real** (con notificaciones): `eas build -p ios` distribuido por **TestFlight**
>   (o ad-hoc por UDID) → requiere **cuenta de Apple Developer (~$99/año)**.
>
> El **túnel** (cloudflared/Expo) funciona igual en Android e iOS; la restricción es de
> **formato/distribución del instalable**, no del túnel.

### 4.3) Usar el APK — QUÉ DEBE ESTAR ENCENDIDO (todo a la vez, en la Mac)

El dev build **no trae el JS adentro**: lo carga de Metro por el túnel y llama al backend
por el túnel de cloudflared. Al abrir la app, en la Mac deben estar corriendo **los 4**:

```bash
# 1) Docker (Postgres + Keycloak)
cd UTC-Proyecto/infra && docker compose up -d

# 2) Backend :3002
cd ../backend && npm run start:dev

# 3) Túnel al backend (deja esta terminal abierta) → copia la URL que imprime
cloudflared tunnel --url http://localhost:3002    # https://XXXX.trycloudflare.com

# 4) Metro en modo dev-client + túnel, apuntando a esa URL
cd ../frontend
EXPO_PUBLIC_API_URL=https://XXXX.trycloudflare.com npx expo start --tunnel --dev-client


```

Abre la app instalada (**"UTC Pick Sazón"**, ya NO Expo Go) → conecta por el túnel →
las **notificaciones se ven** al cambiar el estado de un pedido.

- Si apagas Metro **o** cloudflared, la app se queda sin código o sin datos.
- La URL `trycloudflare.com` **cambia** cada vez que reinicias cloudflared → vuelve a
  pasarla en `EXPO_PUBLIC_API_URL`. (URL fija = túnel nombrado de Cloudflare, cuenta gratis.)
- ¿Quieres un APK que abra **sin** Metro (para dejarlo instalado y demostrar solo)? Ese es
  el perfil `preview` de `eas.json` (`eas build -p android --profile preview`), con la URL
  del backend **horneada** en `env` (requiere URL estable).

---

### Notas mínimas

- **Solo la 1ª vez** (o tras `docker compose down -v`): `npm install` en `backend/` y `frontend/`, `./keycloak/seed-admin.sh` en `infra/`, `migration:run` y la semilla. Después, los datos **persisten** en el volumen Docker `infra_pgdata` y basta con `up -d` + `start:dev` + `expo start`.
- **Apagar sin perder datos:** `docker compose down` (el volumen sobrevive). **`down -v` borra la base de datos.**
- Prerrequisitos y puertos de infra: [`../../infra/README.md`](../../infra/README.md). Credenciales de BD/Keycloak: `infra/.env` (defaults en `infra/.env.example`).
