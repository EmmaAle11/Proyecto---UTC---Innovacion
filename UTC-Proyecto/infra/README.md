# Infra — UTC Pick Sazón (Docker)

Requiere Docker (daemon corriendo).

```bash
cd infra
cp .env.example .env   # editar valores locales (no se commitea)
docker compose up -d
docker compose ps      # postgres y keycloak deben estar "healthy"/"running"
```

- Postgres: `localhost:${POSTGRES_PORT}`, base `utc_food`, user `utc`
- Keycloak: `http://localhost:${KEYCLOAK_PORT}` (realm `utc-food`, roles `admin`/`user`, client `mobile-app`)

## Puertos

Los puertos de host son configurables vía `.env` (`POSTGRES_PORT`, `KEYCLOAK_PORT`).
Defaults documentados: **5432** (Postgres) y **8080** (Keycloak). Si ya están ocupados
en tu equipo, cámbialos en `.env`. En este equipo se usan **5433** y **8082** (el 5432/8080
los ocupa otro proyecto). El contenedor sigue escuchando internamente en 5432/8080.

Parar: `docker compose down` · Logs: `docker compose logs -f`
