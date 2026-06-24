# Infra — UTC Pick Sazón (Docker)

Requiere Docker (daemon corriendo).

```bash
cd infra
cp .env.example .env   # editar valores locales (no se commitea)
docker compose up -d
docker compose ps          # postgres y keycloak deben estar "healthy"/"running"
./keycloak/seed-admin.sh   # crea/asegura el admin (rol admin) desde infra/.env
```

- Postgres: `localhost:${POSTGRES_PORT}`, base `utc_food`, user `utc`
- Keycloak: `http://localhost:${KEYCLOAK_PORT}` (realm `utc-food`, roles `admin`/`user`, client `mobile-app`)
- Admin (panel): correo `ADMIN_SEED_EMAIL` + `ADMIN_SEED_PASSWORD` de `.env`, rol `admin` (credenciales **locales**, sin Microsoft). Sembrar/refrescar con `./keycloak/seed-admin.sh` (idempotente). Ver `../docs/arquitectura/decisiones.md` D-013.

## Puertos

Los puertos de host son configurables vía `.env` (`POSTGRES_PORT`, `KEYCLOAK_PORT`).
Defaults documentados: **5432** (Postgres) y **8080** (Keycloak). Si ya están ocupados
en tu equipo, cámbialos en `.env`. En este equipo se usan **5433** y **8082** (el 5432/8080
los ocupa otro proyecto). El contenedor sigue escuchando internamente en 5432/8080.

Parar: `docker compose down` · Logs: `docker compose logs -f`
