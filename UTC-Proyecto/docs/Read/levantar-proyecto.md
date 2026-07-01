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

---

### Notas mínimas

- **Solo la 1ª vez** (o tras `docker compose down -v`): `npm install` en `backend/` y `frontend/`, `./keycloak/seed-admin.sh` en `infra/`, `migration:run` y la semilla. Después, los datos **persisten** en el volumen Docker `infra_pgdata` y basta con `up -d` + `start:dev` + `expo start`.
- **Apagar sin perder datos:** `docker compose down` (el volumen sobrevive). **`down -v` borra la base de datos.**
- Runbook completo (prerrequisitos, trampas, checklist): [`../operacion/correr-en-otra-pc.md`](../operacion/correr-en-otra-pc.md).
