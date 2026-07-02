#!/usr/bin/env bash
# Seed de Keycloak (realm utc-food): admin local (sin Microsoft) + client service-account 'backend-svc'.
# Idempotente: re-ejecutar es seguro. Lee secretos de infra/.env (NO en git, rules §17).
# Ver docs/arquitectura/decisiones.md (D-013, D-014) y rules.md §6.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../.env"
CONTAINER="utc_keycloak"
REALM="utc-food"
KC_INTERNAL="http://localhost:8080"   # puerto INTERNO del contenedor (no el de host)

[ -f "$ENV_FILE" ] || { echo "ERROR: no existe $ENV_FILE (cópialo de .env.example)"; exit 1; }
set -a; . "$ENV_FILE"; set +a

: "${KEYCLOAK_ADMIN:?falta KEYCLOAK_ADMIN en .env}"
: "${KEYCLOAK_ADMIN_PASSWORD:?falta KEYCLOAK_ADMIN_PASSWORD en .env}"
: "${ADMIN_SEED_USERNAME:?falta ADMIN_SEED_USERNAME en .env}"
: "${ADMIN_SEED_EMAIL:?falta ADMIN_SEED_EMAIL en .env}"
: "${ADMIN_SEED_PASSWORD:?falta ADMIN_SEED_PASSWORD en .env}"
: "${BACKEND_CLIENT_SECRET:?falta BACKEND_CLIENT_SECRET en .env}"
# Keycloak (User Profile + VERIFY_PROFILE) exige firstName/lastName, o el login falla
# con "Account is not fully set up". Defaults razonables; se pueden sobreescribir en .env.
ADMIN_SEED_FIRSTNAME="${ADMIN_SEED_FIRSTNAME:-Administrador}"
ADMIN_SEED_LASTNAME="${ADMIN_SEED_LASTNAME:-Cooperativa UTC}"

docker ps --format '{{.Names}}' | grep -qx "$CONTAINER" \
  || { echo "ERROR: el contenedor $CONTAINER no está corriendo (docker compose up -d)"; exit 1; }

kc() { docker exec "$CONTAINER" /opt/keycloak/bin/kcadm.sh "$@"; }

echo "→ Autenticando kcadm (realm master)…"
kc config credentials --server "$KC_INTERNAL" --realm master \
  --user "$KEYCLOAK_ADMIN" --password "$KEYCLOAK_ADMIN_PASSWORD" >/dev/null

echo "→ Buscando usuario '$ADMIN_SEED_USERNAME' en realm '$REALM'…"
USER_ID="$(kc get users -r "$REALM" -q username="$ADMIN_SEED_USERNAME" --fields id --format csv --noquotes 2>/dev/null | tr -d '\r' | head -n1 || true)"

if [ -z "$USER_ID" ]; then
  echo "→ No existe; creando…"
  kc create users -r "$REALM" \
    -s username="$ADMIN_SEED_USERNAME" \
    -s email="$ADMIN_SEED_EMAIL" \
    -s firstName="$ADMIN_SEED_FIRSTNAME" \
    -s lastName="$ADMIN_SEED_LASTNAME" \
    -s enabled=true \
    -s emailVerified=true >/dev/null
else
  echo "→ Ya existe (id=$USER_ID); actualizando datos…"
  kc update "users/$USER_ID" -r "$REALM" \
    -s email="$ADMIN_SEED_EMAIL" \
    -s firstName="$ADMIN_SEED_FIRSTNAME" \
    -s lastName="$ADMIN_SEED_LASTNAME" \
    -s enabled=true -s emailVerified=true >/dev/null
fi

echo "→ Fijando contraseña (permanente)…"
kc set-password -r "$REALM" --username "$ADMIN_SEED_USERNAME" \
  --new-password "$ADMIN_SEED_PASSWORD" >/dev/null

echo "→ Asignando rol realm 'admin'…"
kc add-roles -r "$REALM" --uusername "$ADMIN_SEED_USERNAME" --rolename admin >/dev/null

# MFA obligatoria (A3/D-013): el admin DEBE configurar TOTP en el primer inicio.
# Sin OTP enrolado, el login por contraseña queda incompleto → no hay acceso admin
# sin segundo factor. Coherente con el realm (requiredActions CONFIGURE_TOTP).
echo "→ Forzando MFA: el admin deberá configurar TOTP en el primer inicio (CONFIGURE_TOTP)…"
USER_ID="$(kc get users -r "$REALM" -q username="$ADMIN_SEED_USERNAME" --fields id --format csv --noquotes 2>/dev/null | tr -d '\r' | head -n1 || true)"
[ -n "$USER_ID" ] && kc update "users/$USER_ID" -r "$REALM" \
  -s 'requiredActions=["CONFIGURE_TOTP"]' >/dev/null

# ── Client service-account para el backend (crea usuarios vía Admin API) ──
echo "→ Provisionando client 'backend-svc' (service account)…"
CLIENT_ID="$(kc get clients -r "$REALM" -q clientId=backend-svc --fields id --format csv --noquotes 2>/dev/null | tr -d '\r' | head -n1 || true)"
if [ -z "$CLIENT_ID" ]; then
  kc create clients -r "$REALM" \
    -s clientId=backend-svc -s enabled=true -s publicClient=false \
    -s serviceAccountsEnabled=true -s standardFlowEnabled=false \
    -s directAccessGrantsEnabled=false -s secret="$BACKEND_CLIENT_SECRET" >/dev/null
else
  kc update "clients/$CLIENT_ID" -r "$REALM" \
    -s enabled=true -s serviceAccountsEnabled=true -s secret="$BACKEND_CLIENT_SECRET" >/dev/null
fi

echo "→ Asignando roles 'manage-users' + 'view-realm' (realm-management) al service-account…"
# manage-users: crear/editar usuarios; view-realm: leer roles del realm para asignarlos.
kc add-roles -r "$REALM" --uusername service-account-backend-svc \
  --cclientid realm-management --rolename manage-users --rolename view-realm >/dev/null

echo "✓ Admin '$ADMIN_SEED_USERNAME' <$ADMIN_SEED_EMAIL> y client 'backend-svc' listos en realm '$REALM'."
echo "  Admin: correo + contraseña locales (rol admin). backend-svc: service-account con manage-users."
