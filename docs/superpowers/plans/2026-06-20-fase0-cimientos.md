# Fase 0 — Cimientos UTC Pick Sazón · Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dejar el repo organizado con `frontend/` (Expo + FSD), `backend/` (NestJS + Clean) e `infra/` (Docker: Postgres + Keycloak) inicializados y arrancables, sin features de negocio.

**Architecture:** Monorepo simple de dos carpetas (`frontend/`, `backend/`) más `infra/` (docker-compose) y `design-system/` (espejo de referencia, no se edita). Frontend en Feature-Sliced Design; backend en Clean Architecture por capas. Postgres y Keycloak corren en contenedores oficiales.

**Tech Stack:** Expo (React Native) · TypeScript · NativeWind v4 · React Navigation · Zustand · NestJS · TypeORM · PostgreSQL 16 · Keycloak 26 · Docker Compose.

## Global Constraints

Valores verbatim del spec (`docs/superpowers/specs/2026-06-20-fase0-cimientos-arquitectura-design.md`) y de `docs/superpowers/priority/rules.md` (documento vinculante):

- **Infra Docker, imágenes oficiales (sin `docker build`):** `postgres:16` (puerto **5432**, base **`utc_food`**), `quay.io/keycloak/keycloak:26` (puerto **8080**, realm **`utc-food`**, roles `admin`/`user`). Backend NestJS puerto **3000**. Frontend Expo local (no en Docker).
- **Marca (tokens):** primario `#E34100` (naranja-500), institucional `#021E5E` (azul-700). Fuentes: Bricolage Grotesque (display), Plus Jakarta Sans (body), Space Mono (mono).
- **FSD (frontend):** capas `app, pages, widgets, features, entities, shared` — una capa solo importa de capas inferiores.
- **Clean (backend):** capas `domain, application, infrastructure, presentation` — `domain` y `application` NO importan de NestJS/TypeORM.
- **rules.md manda:** EVIDENCE OR BLOCK (§0) — toda tarea cierra con verificación real ejecutada. FAIL-CLOSED (§1) — ante error, detenerse. GIT (§16) — nada de `commit -a`, ni `.env`/`node_modules`/`dist`/secretos; `git add` explícito. SECRETOS (§17) — `.env` nunca al repo. DoD (§19) al cerrar cada tarea.
- **Sin features en Fase 0:** no entidades de negocio, no endpoints de dominio, no auth real, no pagos, no push. Las tablas con PK/FK van por migraciones TypeORM en Fase 1.
- **Commits:** mensaje en español; terminar con `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`. Rama de trabajo: `fase-0-cimientos` (ya creada).

---

### Task 1: Organización del repositorio

**Files:**
- Create: `docs/algoritmo-circulo-innovacion.md` (mover desde `Algoritmo y Circulo de Innovación`)
- Create: `docs/architecture-propuesta.md` (mover desde `Architecture propuesta`)
- Create: `.gitignore` (raíz)
- Delete: `design-system/ui_kits/app/` (Propuesta A "Mosaico")
- Create: `design-system/ui_kits/PROPUESTA-ELEGIDA.md`

**Interfaces:**
- Consumes: nada.
- Produces: estructura `docs/` y raíz limpia; `.gitignore` que protege `.env`, `node_modules/`, `dist/` para tareas siguientes.

- [ ] **Step 1: Mover los dos briefs a `docs/` con extensión .md**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git mv "Algoritmo y Circulo de Innovación" docs/algoritmo-circulo-innovacion.md 2>/dev/null || (mkdir -p docs && mv "Algoritmo y Circulo de Innovación" docs/algoritmo-circulo-innovacion.md)
git mv "Architecture propuesta" docs/architecture-propuesta.md 2>/dev/null || mv "Architecture propuesta" docs/architecture-propuesta.md
```

- [ ] **Step 2: Eliminar la Propuesta A "Mosaico" (decisión del usuario)**

```bash
git rm -r "design-system/ui_kits/app" 2>/dev/null || rm -rf "design-system/ui_kits/app"
```

- [ ] **Step 3: Crear nota de propuesta elegida**

Crear `design-system/ui_kits/PROPUESTA-ELEGIDA.md`:

```markdown
# Propuesta elegida: B "Mostrador"

La app implementa la **Propuesta B "Mostrador"** (`app-mostrador/`):
tab bar inferior (Inicio · Pedidos · Perfil) + rail "Listos para llevar ya".

La Propuesta A "Mosaico" fue descartada y eliminada del repo (decisión 2026-06-20).
```

- [ ] **Step 4: Crear `.gitignore` raíz**

```gitignore
# Dependencias
node_modules/
# Builds
dist/
build/
.expo/
web-build/
# Entorno / secretos (rules §17)
.env
.env.local
.env.*.local
# Logs y cobertura
*.log
coverage/
# Sistema
.DS_Store
Thumbs.db
```

- [ ] **Step 5: Verificar (rules §0)**

```bash
ls docs/ && ls "design-system/ui_kits/" && test ! -d "design-system/ui_kits/app" && echo "Propuesta A eliminada OK" && git status --short
```
Expected: se ven `docs/algoritmo-circulo-innovacion.md` y `docs/architecture-propuesta.md`; en `ui_kits/` solo `app-mostrador/` y `PROPUESTA-ELEGIDA.md`; mensaje "Propuesta A eliminada OK".

- [ ] **Step 6: Commit**

```bash
git add .gitignore docs "design-system/ui_kits"
git commit -m "Fase 0: organizar repo (docs/, eliminar Propuesta A, .gitignore)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Infraestructura Docker (Postgres + Keycloak)

**Files:**
- Create: `infra/docker-compose.yml`
- Create: `infra/.env.example`
- Create: `infra/postgres/init.sql`
- Create: `infra/keycloak/realm-utc-food.json`
- Create: `infra/README.md`

**Interfaces:**
- Consumes: nada.
- Produces: Postgres en `localhost:5432` (base `utc_food`, user `utc`), Keycloak en `localhost:8080` (realm `utc-food`). El backend (Task 4) consume estas conexiones.

- [ ] **Step 1: Crear `infra/docker-compose.yml`**

```yaml
services:
  postgres:
    image: postgres:16
    container_name: utc_postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./postgres/init.sql:/docker-entrypoint-initdb.d/init.sql:ro
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER} -d ${POSTGRES_DB}"]
      interval: 5s
      timeout: 5s
      retries: 10

  keycloak:
    image: quay.io/keycloak/keycloak:26.0
    container_name: utc_keycloak
    restart: unless-stopped
    command: ["start-dev", "--import-realm"]
    environment:
      KC_BOOTSTRAP_ADMIN_USERNAME: ${KEYCLOAK_ADMIN}
      KC_BOOTSTRAP_ADMIN_PASSWORD: ${KEYCLOAK_ADMIN_PASSWORD}
      KC_HTTP_PORT: 8080
    ports:
      - "8080:8080"
    volumes:
      - ./keycloak:/opt/keycloak/data/import:ro
    depends_on:
      postgres:
        condition: service_healthy

volumes:
  pgdata:
```

- [ ] **Step 2: Crear `infra/.env.example` (sin secretos reales, rules §17)**

```dotenv
# Copiar a infra/.env y poner valores locales. infra/.env NO se commitea.
POSTGRES_USER=utc
POSTGRES_PASSWORD=cambia_esto_local
POSTGRES_DB=utc_food
KEYCLOAK_ADMIN=admin
KEYCLOAK_ADMIN_PASSWORD=cambia_esto_local
```

- [ ] **Step 3: Crear `infra/postgres/init.sql` (mínimo; tablas → migraciones TypeORM en Fase 1)**

```sql
-- Fase 0: solo extensiones. El esquema (tablas con PK/FK) se crea por
-- migraciones TypeORM en Fase 1 (rules §11), no aquí, para no duplicar fuente de verdad.
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
```

- [ ] **Step 4: Crear `infra/keycloak/realm-utc-food.json` (realm mínimo con roles)**

```json
{
  "realm": "utc-food",
  "enabled": true,
  "roles": {
    "realm": [
      { "name": "admin", "description": "Administrador de la cooperativa" },
      { "name": "user", "description": "Estudiante/usuario consumidor" }
    ]
  },
  "clients": [
    {
      "clientId": "mobile-app",
      "enabled": true,
      "publicClient": true,
      "standardFlowEnabled": true,
      "directAccessGrantsEnabled": true,
      "redirectUris": ["*"],
      "webOrigins": ["*"]
    }
  ]
}
```

- [ ] **Step 5: Crear `infra/README.md`**

```markdown
# Infra — UTC Pick Sazón (Docker)

Requiere Docker Desktop (WSL2) corriendo.

```bash
cd infra
cp .env.example .env   # editar valores locales (no se commitea)
docker compose up -d
docker compose ps      # postgres y keycloak deben estar "healthy"/"running"
```

- Postgres: localhost:5432, base `utc_food`
- Keycloak: http://localhost:8080 (realm `utc-food`, roles admin/user)

Parar: `docker compose down` · Logs: `docker compose logs -f`
```

- [ ] **Step 6: Levantar y verificar (rules §0, §12)**

```bash
cd infra
cp .env.example .env
docker compose up -d
sleep 20
docker compose ps
docker compose exec -T postgres pg_isready -U utc -d utc_food
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/realms/utc-food
```
Expected: `docker compose ps` muestra `utc_postgres` y `utc_keycloak` arriba; `pg_isready` responde "accepting connections"; el `curl` al realm devuelve `200`.
**Si algo no está arriba → FAIL-CLOSED (rules §1): detener y diagnosticar antes de seguir.**

- [ ] **Step 7: Commit (sin `.env`, rules §16/§17)**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git add infra/docker-compose.yml infra/.env.example infra/postgres infra/keycloak infra/README.md
git status --short   # confirmar que infra/.env NO aparece
git commit -m "Fase 0: infra Docker (Postgres 16 + Keycloak 26, realm utc-food)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Inicializar backend NestJS + esqueleto Clean

**Files:**
- Create: `backend/` (proyecto NestJS, generado)
- Create: `backend/src/domain/.gitkeep` + `backend/src/domain/README.md`
- Create: `backend/src/application/README.md`
- Create: `backend/src/infrastructure/README.md`
- Create: `backend/src/presentation/README.md`
- Modify: `backend/package.json` (deps)

**Interfaces:**
- Consumes: nada (Postgres se conecta en Task 4).
- Produces: proyecto NestJS arrancable con `npm run start:dev`; carpetas de capas Clean listas para Task 4 y fases siguientes.

- [ ] **Step 1: Generar el proyecto NestJS (sin git propio)**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
npx -y @nestjs/cli@latest new backend --package-manager npm --skip-git
```
Expected: se crea `backend/` con `src/main.ts`, `src/app.module.ts`, `package.json`, etc.

- [ ] **Step 2: Verificar que arranca tal cual (baseline)**

```bash
cd backend
npm run build
```
Expected: build OK sin errores (genera `dist/`).

- [ ] **Step 3: Instalar dependencias del backend**

```bash
cd backend
npm install @nestjs/config @nestjs/typeorm typeorm pg class-validator class-transformer @nestjs/throttler
npm install passport passport-jwt @nestjs/passport jwks-rsa
npm install -D @types/passport-jwt
```
Expected: instala sin errores; `package.json` lista estas deps.

- [ ] **Step 4: Crear las carpetas de capas Clean con su README**

Crear `backend/src/domain/README.md`:
```markdown
# domain — Núcleo puro (sin framework)
Entidades de dominio, value objects, reglas e **interfaces de repositorio (puertos)**.
PROHIBIDO importar NestJS o TypeORM aquí (Clean Architecture).
```
Crear `backend/src/application/README.md`:
```markdown
# application — Casos de uso
Orquesta el dominio. Use cases y DTOs de aplicación. No conoce HTTP ni TypeORM.
```
Crear `backend/src/infrastructure/README.md`:
```markdown
# infrastructure — Adaptadores
Entidades/repositorios TypeORM, conexión PostgreSQL, cliente Keycloak, pasarelas, jobs.
Implementa los puertos definidos en domain/.
```
Crear `backend/src/presentation/README.md`:
```markdown
# presentation — Entrada/salida HTTP
Controllers, guards (JWT/roles), pipes (DTO validation), filters, interceptors.
```
Crear marcador para que git versione la capa vacía:
```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion/backend"
touch src/domain/.gitkeep
```

- [ ] **Step 5: Verificar build con la nueva estructura**

```bash
cd backend
npm run build && npm run lint
```
Expected: build OK y lint sin errores.

- [ ] **Step 6: Commit**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git add backend   # node_modules/ y dist/ quedan fuera por .gitignore
git status --short   # confirmar que backend/node_modules y backend/dist NO aparecen
git commit -m "Fase 0: inicializar backend NestJS + esqueleto Clean (domain/application/infrastructure/presentation)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Backend — conexión a PostgreSQL + endpoint /health

**Files:**
- Create: `backend/src/infrastructure/database/database.module.ts`
- Create: `backend/src/presentation/health/health.controller.ts`
- Create: `backend/src/presentation/health/health.controller.spec.ts`
- Modify: `backend/src/app.module.ts`
- Create: `backend/.env.example`

**Interfaces:**
- Consumes: Postgres de Task 2 (`localhost:5432`, base `utc_food`).
- Produces: `GET /health` → `{ status: 'ok', db: boolean }`. `DatabaseModule` exporta el `DataSource` de TypeORM para fases siguientes.

- [ ] **Step 1: Crear `backend/.env.example`**

```dotenv
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_USER=utc
DB_PASSWORD=cambia_esto_local
DB_NAME=utc_food
KEYCLOAK_REALM=utc-food
KEYCLOAK_URL=http://localhost:8080
KEYCLOAK_CLIENT_ID=mobile-app
```

- [ ] **Step 2: Escribir el test de /health (TDD, debe fallar)**

Crear `backend/src/presentation/health/health.controller.spec.ts`:
```typescript
import { Test } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { DataSource } from 'typeorm';

describe('HealthController', () => {
  it('devuelve status ok y el estado de la BD', async () => {
    const fakeDataSource = { isInitialized: true } as DataSource;
    const moduleRef = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: DataSource, useValue: fakeDataSource }],
    }).compile();

    const controller = moduleRef.get(HealthController);
    expect(controller.check()).toEqual({ status: 'ok', db: true });
  });
});
```

- [ ] **Step 3: Ejecutar el test y verificar que falla**

```bash
cd backend
npx jest health.controller --silent
```
Expected: FAIL ("Cannot find module './health.controller'").

- [ ] **Step 4: Implementar el HealthController**

Crear `backend/src/presentation/health/health.controller.ts`:
```typescript
import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  check(): { status: string; db: boolean } {
    return { status: 'ok', db: this.dataSource.isInitialized };
  }
}
```

- [ ] **Step 5: Crear el DatabaseModule**

Crear `backend/src/infrastructure/database/database.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: Number(config.get('DB_PORT', 5432)),
        username: config.get('DB_USER', 'utc'),
        password: config.get('DB_PASSWORD', ''),
        database: config.get('DB_NAME', 'utc_food'),
        autoLoadEntities: true,
        synchronize: false, // rules §11: nada de synchronize para cambios de esquema
      }),
    }),
  ],
})
export class DatabaseModule {}
```

- [ ] **Step 6: Cablear en `app.module.ts`**

Reemplazar el contenido de `backend/src/app.module.ts`:
```typescript
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './infrastructure/database/database.module';
import { HealthController } from './presentation/health/health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
```

- [ ] **Step 7: Ejecutar el test y verificar que pasa**

```bash
cd backend
npx jest health.controller --silent
```
Expected: PASS (1 test).

- [ ] **Step 8: Verificación de integración real (rules §0) — requiere infra de Task 2 arriba y `backend/.env` creado**

```bash
cd backend
cp .env.example .env   # poner DB_PASSWORD real (= infra/.env)
npm run build
npm run start:dev &
sleep 12
curl -s http://localhost:3000/health
# detener: matar el proceso start:dev
```
Expected: la respuesta es `{"status":"ok","db":true}`. **Si `db` es `false` o hay error de conexión → FAIL-CLOSED (rules §1): revisar credenciales/contenedor Postgres.**

- [ ] **Step 9: Commit**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git add backend/src backend/.env.example
git status --short   # confirmar que backend/.env NO aparece
git commit -m "Fase 0: backend conecta a PostgreSQL + endpoint GET /health" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Inicializar frontend Expo + dependencias

**Files:**
- Create: `frontend/` (proyecto Expo, generado)
- Modify: `frontend/package.json` (deps)

**Interfaces:**
- Consumes: nada.
- Produces: proyecto Expo TypeScript arrancable; deps de NativeWind/navegación/estado instaladas para Tasks 6 y 7.

- [ ] **Step 1: Generar el proyecto Expo (plantilla TypeScript en blanco, sin expo-router)**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
npx -y create-expo-app@latest frontend --template blank-typescript
```
Expected: se crea `frontend/` con `App.tsx`, `package.json`, `tsconfig.json`, `app.json`.

- [ ] **Step 2: Verificar arranque baseline (typecheck)**

```bash
cd frontend
npx tsc --noEmit
```
Expected: sin errores de tipos.

- [ ] **Step 3: Instalar dependencias del frontend**

```bash
cd frontend
npx expo install nativewind tailwindcss react-native-reanimated react-native-safe-area-context react-native-screens react-native-svg expo-font
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs
npm install zustand lucide-react-native
```
Expected: instala sin errores; `package.json` lista estas deps.

- [ ] **Step 4: Commit**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git add frontend   # node_modules/ queda fuera por .gitignore
git status --short   # confirmar que frontend/node_modules NO aparece
git commit -m "Fase 0: inicializar frontend Expo + dependencias (NativeWind, React Navigation, Zustand)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 6: Frontend — NativeWind + tokens de marca en `shared/theme`

**Files:**
- Create: `frontend/tailwind.config.js`
- Create: `frontend/global.css`
- Create: `frontend/metro.config.js`
- Create: `frontend/nativewind-env.d.ts`
- Modify: `frontend/babel.config.js`
- Create: `frontend/src/shared/theme/tokens.ts`
- Create: `frontend/src/shared/theme/index.ts`

**Interfaces:**
- Consumes: deps de Task 5.
- Produces: `tokens` (objeto TS con colores/espaciado/radii) y clases NativeWind (`bg-primary`, `text-institutional`, etc.) disponibles para Task 7.

- [ ] **Step 1: Crear `frontend/src/shared/theme/tokens.ts` (portado de design-system/tokens)**

```typescript
export const colors = {
  naranja: { 50: '#FFF1EB', 100: '#FFDDCF', 200: '#FFB89E', 300: '#FB8D63', 400: '#F26336', 500: '#E34100', 600: '#C23500', 700: '#9C2B00', 800: '#762200', 900: '#511800' },
  azul: { 50: '#EDF1FA', 100: '#D4DCF1', 200: '#A6B6E0', 300: '#6982C9', 400: '#3358B8', 500: '#1A4099', 600: '#0A2E7A', 700: '#021E5E', 800: '#021642', 900: '#010E2E' },
  gris: { 50: '#F6F7F9', 100: '#EDEFF3', 200: '#DEE2EA', 300: '#C7CDD9', 400: '#9BA4B5', 500: '#6C7689', 600: '#4A5468', 700: '#353D4E', 800: '#232A38', 900: '#141926' },
  lima: { 50: '#EAF7EE', 100: '#C8ECD3', 500: '#15915B', 600: '#0F7549' },
  mango: { 50: '#FFF7E6', 100: '#FFE9B8', 400: '#F2A900', 600: '#B07700' },
  rojo: { 50: '#FDECEC', 500: '#D7263D', 600: '#B01B30' },
  blanco: '#FFFFFF',
  primary: '#E34100',
  institutional: '#021E5E',
} as const;

export const radius = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, card: 20, pill: 999 } as const;
export const space = { 1: 4, 2: 8, 3: 12, 4: 16, 5: 20, 6: 24, 8: 32, 10: 40, 12: 48 } as const;
export const fonts = { display: 'BricolageGrotesque', body: 'PlusJakartaSans', mono: 'SpaceMono' } as const;
```

- [ ] **Step 2: Crear `frontend/src/shared/theme/index.ts`**

```typescript
export * from './tokens';
```

- [ ] **Step 3: Crear `frontend/tailwind.config.js` consumiendo los tokens**

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.tsx', './src/**/*.{ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        primary: '#E34100',
        institutional: '#021E5E',
        naranja: { 50: '#FFF1EB', 500: '#E34100', 600: '#C23500', 700: '#9C2B00' },
        azul: { 50: '#EDF1FA', 500: '#1A4099', 700: '#021E5E' },
        gris: { 50: '#F6F7F9', 100: '#EDEFF3', 200: '#DEE2EA', 400: '#9BA4B5', 500: '#6C7689', 800: '#232A38' },
        lima: { 500: '#15915B', 600: '#0F7549' },
        mango: { 400: '#F2A900', 600: '#B07700' },
      },
      borderRadius: { card: '20px', pill: '999px' },
    },
  },
  plugins: [],
};
```

- [ ] **Step 4: Crear `frontend/global.css`**

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

- [ ] **Step 5: Crear `frontend/metro.config.js`**

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);
module.exports = withNativeWind(config, { input: './global.css' });
```

- [ ] **Step 6: Modificar `frontend/babel.config.js`**

Contenido completo:
```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

- [ ] **Step 7: Crear `frontend/nativewind-env.d.ts`**

```typescript
/// <reference types="nativewind/types" />
```

- [ ] **Step 8: Verificar typecheck**

```bash
cd frontend
npx tsc --noEmit
```
Expected: sin errores (las clases `className` ya son válidas por `nativewind-env.d.ts`).

- [ ] **Step 9: Commit**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git add frontend/tailwind.config.js frontend/global.css frontend/metro.config.js frontend/babel.config.js frontend/nativewind-env.d.ts frontend/src/shared/theme
git commit -m "Fase 0: configurar NativeWind + tokens de marca en shared/theme" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 7: Frontend — esqueleto FSD + navegación mínima arrancable

**Files:**
- Create READMEs de capas: `frontend/src/{app,pages,widgets,features,entities,shared}/README.md`
- Create: `frontend/src/app/navigation/RootNavigator.tsx`
- Create: `frontend/src/pages/home/HomeScreen.tsx`
- Create: `frontend/src/pages/orders/OrdersScreen.tsx`
- Create: `frontend/src/pages/profile/ProfileScreen.tsx`
- Modify: `frontend/App.tsx`

**Interfaces:**
- Consumes: `tokens`/clases de Task 6; React Navigation de Task 5.
- Produces: app Expo que arranca y muestra un tab bar (Inicio/Pedidos/Perfil) con pantallas placeholder estilizadas con NativeWind. Base FSD para las fases de features.

- [ ] **Step 1: Crear los README de cada capa FSD**

Crear un `README.md` en cada carpeta con su responsabilidad (FSD; una capa solo importa de capas inferiores):
- `frontend/src/app/README.md`: `# app — Inicialización, providers, navegación raíz, config global.`
- `frontend/src/pages/README.md`: `# pages — Pantallas a nivel de ruta (login, home, product-detail, cart, tracking, orders, profile).`
- `frontend/src/widgets/README.md`: `# widgets — Bloques visuales compuestos (header-ubicacion, tab-bar, rail-listos-ahora, product-feed, carrito-flotante).`
- `frontend/src/features/README.md`: `# features — Acciones del usuario (auth, add-to-cart, qty-stepper, order-tracking, change-status).`
- `frontend/src/entities/README.md`: `# entities — Modelos del negocio + UI base (product, order, user, payment).`
- `frontend/src/shared/README.md`: `# shared — Reutilizable transversal (ui, theme, api, lib, config).`

- [ ] **Step 2: Crear las tres pantallas placeholder**

Crear `frontend/src/pages/home/HomeScreen.tsx`:
```tsx
import { View, Text } from 'react-native';

export function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gris-50">
      <Text className="text-2xl font-bold text-institutional">UTC Pick Sazón</Text>
      <Text className="mt-2 text-gris-500">Inicio · Propuesta B "Mostrador"</Text>
    </View>
  );
}
```
Crear `frontend/src/pages/orders/OrdersScreen.tsx`:
```tsx
import { View, Text } from 'react-native';

export function OrdersScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gris-50">
      <Text className="text-xl font-bold text-institutional">Tus pedidos</Text>
    </View>
  );
}
```
Crear `frontend/src/pages/profile/ProfileScreen.tsx`:
```tsx
import { View, Text } from 'react-native';

export function ProfileScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gris-50">
      <Text className="text-xl font-bold text-institutional">Perfil</Text>
    </View>
  );
}
```

- [ ] **Step 3: Crear el RootNavigator (tab bar Inicio/Pedidos/Perfil)**

Crear `frontend/src/app/navigation/RootNavigator.tsx`:
```tsx
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeScreen } from '../../pages/home/HomeScreen';
import { OrdersScreen } from '../../pages/orders/OrdersScreen';
import { ProfileScreen } from '../../pages/profile/ProfileScreen';

const Tab = createBottomTabNavigator();

export function RootNavigator() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: '#E34100',
          tabBarInactiveTintColor: '#9BA4B5',
        }}
      >
        <Tab.Screen name="Inicio" component={HomeScreen} />
        <Tab.Screen name="Pedidos" component={OrdersScreen} />
        <Tab.Screen name="Perfil" component={ProfileScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
```

- [ ] **Step 4: Reemplazar `frontend/App.tsx`**

```tsx
import './global.css';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/app/navigation/RootNavigator';

export default function App() {
  return (
    <SafeAreaProvider>
      <RootNavigator />
    </SafeAreaProvider>
  );
}
```

- [ ] **Step 5: Verificar typecheck**

```bash
cd frontend
npx tsc --noEmit
```
Expected: sin errores.

- [ ] **Step 6: Verificar que Expo levanta (bundler) (rules §0, §18)**

```bash
cd frontend
npx expo start --no-dev --max-workers 1 &
sleep 25
curl -s "http://localhost:8081/status" || curl -s "http://localhost:19000/status"
# detener: matar el proceso expo
```
Expected: el servidor de Metro responde (status `packager-status:running`). Alternativa de evidencia: `npx expo export --platform web` termina sin errores de bundle.
**Si el bundle falla → FAIL-CLOSED (rules §1).**

- [ ] **Step 7: Commit**

```bash
cd "c:/Users/user/Proyecto---UTC---Innovacion"
git add frontend/src frontend/App.tsx
git commit -m "Fase 0: esqueleto FSD + navegación mínima (tab bar Inicio/Pedidos/Perfil)" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 8: README raíz + verificación final de Fase 0

**Files:**
- Create: `README.md` (raíz, reemplaza el actual)

**Interfaces:**
- Consumes: todo lo anterior.
- Produces: documentación de arranque del monorepo; checklist de verificación de Fase 0.

- [ ] **Step 1: Reemplazar `README.md` raíz**

```markdown
# UTC Pick Sazón

App de pedidos Pick Up para la cooperativa (dark kitchen) — Universidad Técnica de Cotopaxi.

## Estructura
- `frontend/` — Expo + React Native + NativeWind (FSD)
- `backend/` — NestJS + TypeORM (Clean Architecture)
- `infra/` — Docker Compose (PostgreSQL 16 + Keycloak 26)
- `design-system/` — espejo de Claude Design (referencia de marca, no editar a mano)
- `docs/` — briefs y specs · `docs/superpowers/priority/rules.md` — reglas obligatorias

## Arranque (orden)
```bash
# 1) Infra
cd infra && cp .env.example .env && docker compose up -d && docker compose ps
# 2) Backend
cd ../backend && cp .env.example .env && npm install && npm run start:dev   # http://localhost:3000/health
# 3) Frontend
cd ../frontend && npm install && npx expo start
```

## Reglas
Ver `docs/superpowers/priority/rules.md` (evidence-or-block, fail-closed, gate de confianza 95–100%) y las business rules BR-001..BR-015.
```

- [ ] **Step 2: Verificación final integral de Fase 0 (rules §0, §18, §19)**

```bash
cd infra && docker compose ps
cd ../backend && npm run build && npm run lint
cd ../frontend && npx tsc --noEmit
cd .. && git status --short
```
Expected: contenedores arriba; backend build+lint OK; frontend typecheck OK; `git status` limpio salvo el README. Cerrar con el formato DoD (rules §19): Observaciones / Riesgos / Validaciones realizadas / Validaciones pendientes / Supuestos / Nivel de confianza.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "Fase 0: README raíz con arranque del monorepo y verificación" -m "Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Notas de ejecución (rules.md)

- **Regla 22 (gate de confianza 95–100%):** cada tarea que aplique un cambio debe alcanzar 95–100% de confianza, validada con workflows + agente de regresión, antes de cerrarse. En la práctica de Fase 0 (scaffolding), la "regresión" es: re-ejecutar la verificación de la tarea + las verificaciones de las tareas previas afectadas (build/lint/typecheck/`docker compose ps`).
- **FAIL-CLOSED:** si cualquier verificación falla o no hay evidencia, detener, no commitear y diagnosticar (rules §1).
- **Versiones exactas:** se fijan al correr los initializers; anotarlas en el README raíz tras la instalación (riesgo del spec).
- **Pendiente conocido:** fuentes custom (Bricolage/Plus Jakarta/Space Mono) no se cargan en Fase 0; `fonts` en tokens quedan declaradas para `expo-font` en una fase posterior (fallback a system mientras tanto).
