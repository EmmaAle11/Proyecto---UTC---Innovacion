# Levantar el proyecto — comandos en orden

> Solo los comandos para **dejar todo corriendo**, en secuencia.
> Requisitos previos: **Docker** corriendo + **Node 20**. Puertos de este equipo:
> Postgres `5433`, Keycloak `8082`, backend `3001`.

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

## 2) BACKEND — NestJS (:3001)

```bash
cd ../backend
npm run migration:run         # crea el esquema (tablas + enums)   ← solo la 1ª vez
docker exec -i utc_postgres psql -U UTC_PROJECT -d UTC_PROJECT_DB < ../infra/postgres/seed-demo.sql   # semilla: admin + 10 productos ← solo la 1ª vez
npm run start:dev             # backend en :3001 (recarga sola al editar)
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
# a) Exponer el backend (:3001) con una URL pública. En otra terminal:
cloudflared tunnel --url http://localhost:3001    # imprime https://XXXX.trycloudflare.com

# b) Arrancar Expo por túnel apuntando la app a esa URL pública:
cd UTC-Proyecto/frontend
EXPO_PUBLIC_API_URL=https://XXXX.trycloudflare.com npm run tunnel   # = expo start --tunnel
# Escanea el QR con Expo Go. La app ya lee EXPO_PUBLIC_API_URL (src/shared/api/client.ts).
```

- Sin `EXPO_PUBLIC_API_URL`, en modo túnel la app derivaría el host de ngrok (no la PC)
  y **no** encontraría el backend.
- El backend por túnel no necesita CORS para Expo Go (React Native no es navegador).
- Alternativa con cuenta: **ngrok** (`ngrok http 3001`) tras registrarte y configurar el
  authtoken; misma idea, pero cloudflared no pide cuenta.

---

### Notas mínimas

- **Solo la 1ª vez** (o tras `docker compose down -v`): `npm install` en `backend/` y `frontend/`, `./keycloak/seed-admin.sh` en `infra/`, `migration:run` y la semilla. Después, los datos **persisten** en el volumen Docker `infra_pgdata` y basta con `up -d` + `start:dev` + `expo start`.
- **Apagar sin perder datos:** `docker compose down` (el volumen sobrevive). **`down -v` borra la base de datos.**
- Prerrequisitos y puertos de infra: [`../../infra/README.md`](../../infra/README.md). Credenciales de BD/Keycloak: `infra/.env` (defaults en `infra/.env.example`).
