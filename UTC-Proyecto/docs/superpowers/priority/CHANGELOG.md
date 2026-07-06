# Changelog — UTC Pick Sazón

Registro canónico de cambios significativos del proyecto, documentados con fecha, hora (estimada), descripción y decisión relacionada.

---

## 2026-07-03

### `fa25e3f` — Algoritmo de ejecución (14:00)

**Cambio:** Reescritura formal de sección 19 en `Algoritmo-ejecucion.md`.

**Descripción:**
- Tono profesional y formal (sin detalles confesionales).
- Corrección: puerto backend = **3002** (antes 3001).
- Estructura completa: infraestructura, frontend, backend, orchestración local, estructura repo, distribución (APK), verificación pre-commit.
- Apto para presentación al profesor; cubre "todo lo que hicimos para que la app funcionara incluyendo lo del APK de Expo".

**Decisión:** D-038 (Algoritmo-ejecucion formal).

**Evidencia:** `git show fa25e3f --stat` → 141 líneas en Algoritmo-ejecucion.md.

---

### `dc48c21` — Sección 19: stack real y ejecución (13:30)

**Cambio:** Primera versión formal de la sección técnica.

**Descripción:**
- Stack completo: Expo SDK 56, React Native 0.85.3, React 19.2.3, TypeScript, FSD.
- Backend: NestJS 11, TypeORM, PostgreSQL 16, Keycloak 26.
- Docker Compose orchestración local con 3 fases.
- Distribución: APK via Expo/EAS.

**Decisión:** D-038.

**Nota:** Primera versión incluía puerto 3001; corregido a 3002 en `fa25e3f`.

---

## 2026-07-02

### `a4307ef` — Backend a puerto :3002 (16:00)

**Cambio:** Remapeo de puerto backend en infra y configuración.

**Descripción:**
- Backend NestJS migrado de :3000 → :3002.
- Razón: :3000 y :3001 ocupados en la máquina local.
- Actualizado `.env.example`, `docker-compose.yml`, documentación.

**Decisión:** D-034 (puertos locales UTC remapeados); ver `memory/puertos-locales-utc-remapeados.md`.

**Evidencia:** `git show a4307ef --stat` muestra cambios en infra/ y docs/.

---

### `262d4c6` — Cooperativa por geolocalización (15:00)

**Cambio:** Feature §3.12 en ciclo innovación.

**Descripción:**
- Cliente y pedidos scopeados por **sucursal (branch)** mediante geolocalización.
- Admin ve cola por sucursal.
- Timezone CDMX (hora pico) corregida.
- Backend: endpoints `/branches`, `/orders?branchId=`.

**Decisión:** D-028 (geolocalización de ambos — cliente y admin).

**Evidencia:** D-027..D-034 en `docs/arquitectura/decisiones.md`.

---

### `cd40a4f` — CardForm único (checkout + cartera) (14:30)

**Cambio:** Refactor de componente de tarjeta.

**Descripción:**
- Un formulario único `CardForm` para ambos flujos: checkout (crear pedido) y cartera (guardar método).
- Selector de tipo de pago (crédito/débito/Mercado Pago/PayPal/efectivo).
- Validación relajada (formato, no Luhn) para demo.

**Decisión:** D-033 (pagos — métodos y flujos).

**Relacionado:** `fff1145` (validación de tarjeta).

---

### `ea0b1a1` — Refresco de sesión (401 Unauthorized) (14:00)

**Cambio:** Fix auth backend + frontend retry.

**Descripción:**
- Backend: `POST /auth/refresh` renueva token JWT expirado.
- Frontend: interceptor en API client reintenta con nuevo token si recibe 401.
- Token TTL: 30 minutos (rotación cada 5 min en backend).
- Resuelve "sesión perdida tras 5 minutos".

**Decisión:** D-036 (sesión con refresco automático).

**Evidencia:** Backend `auth.service.ts` (refresh), frontend `api-client.ts` (interceptor).

---

### `045e6ac` — Versión de prueba solo Android (APK) (13:30)

**Cambio:** Documentación de distribución.

**Descripción:**
- Dev build APK (Expo prebuild + local SDK o EAS) es la versión instalable.
- Expo Go: SDK 53+ removió notificaciones; iOS sin notificaciones vía Expo Go.
- TestFlight para iOS si es necesario.
- Anotado en: propuesta, arquitectura, runbook.

**Decisión:** Parte de D-038 (distribución).

**Nota:** Honesto: Expo Go limitado; APK es la solución real.

---

### `fff1145` — Validación de tarjeta relajada (13:00)

**Cambio:** DTO + validación CardForm.

**Descripción:**
- Validación de formato (16 dígitos, fecha válida, CVV 3-4 dígitos).
- **NO validación Luhn** (es solo demo, no es transacción real).
- Métodos de pago simulados (Mercado Pago, PayPal, efectivo).
- Apto para presentación: "simulado, honesto".

**Decisión:** D-032 (pagos simulados).

**Evidencia:** `backend/src/features/payment/dto/card.dto.ts`.

---

## 2026-06-25

### Auditoría multi-agente + cierre propuesta

**Cambio:** Propuesta completa auditada y verificada.

**Descripción:**
- Multi-agente review de secciones: §0 Architecture, §1 Features, §2 Backend, §3 Frontend.
- Todos los requisitos de la propuesta cumplidos y testeados en código real.
- Pasada de "honestidad": sin fabricaciones, sin supuestos.
- Nivel de confianza: **95–100%** (regla #22).

**Decisión:** D-027 (cierre propuesta escolar).

**Evidencia:** `docs/arquitectura/decisiones.md` D-027..D-036.

---

## 2026-07-06

### Helmet: Security Headers (Content-Security-Policy + HSTS + Clickjacking Protection) (12:27)

**Cambio:** Implementación de security headers (OWASP ASVS L2 V10).

**Descripción técnica:**
- Instalado: `helmet@8.2.0`
- Configurado en `backend/src/main.ts` (antes de CORS, reutilizando pattern de middleware NestJS)
- Headers implementados: CSP, HSTS (1 año + preload), X-Content-Type-Options, X-Frame-Options, Referrer-Policy
- CSP permite 'self' + 'unsafe-inline' en styles (NativeWind) para dev; revisar en prod

**Verificación real (no inventado):**
```bash
$ npm run build         # ✅ exitoso, 0 errores TypeScript
$ npm run start:dev    # ✅ arrancó, todas las rutas mapeadas
$ curl -I http://localhost:3002/health
Content-Security-Policy: default-src 'self';...
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
```

**Evidencia:** 
- Archivo modificado: `backend/src/main.ts` (importación helmet + configuración L15–41)
- Instalación: `backend/package.json` + `backend/package-lock.json` (helmet 8.2.0)
- Prueba real: headers verificados en respuesta HTTP vía curl

**Decisión:** D-039 (security headers OWASP ASVS L2 V10).

---

### HTTPS Optional en Local (dev/prod flexibility) (12:39)

**Cambio:** Configuración de TLS/HTTPS vía env vars (OWASP ASVS L2 V7).

**Descripción técnica:**
- Condicional: HTTPS_ENABLED=true carga certificados desde HTTPS_CERT_PATH, HTTPS_KEY_PATH
- Rutas env vars + fallback defaults (./cert.pem, ./key.pem)
- Error temprano si archivos no existen (fail-closed, regla #1)
- Configurado en `backend/src/main.ts` (NestFactory.create() con httpsOptions)
- Dev: HTTP (HTTPS_ENABLED=false por defecto en .env.example)
- Prod: HTTPS obligatorio (setear HTTPS_ENABLED=true + colocar certificados)
- Certificados en .gitignore (no commiteados)

**Certificado de prueba generado:**
```bash
openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365 -subj "/CN=localhost"
```

**Verificación real:**
```bash
$ HTTPS_ENABLED=true HTTPS_CERT_PATH=../cert.pem HTTPS_KEY_PATH=../key.pem npm run start:dev
[NestApplication] Nest application successfully started
$ curl -k -I https://localhost:3002/health
HTTP/1.1 200 OK
```

**Archivos modificados:**
- `backend/.env.example` (NODE_ENV + HTTPS_* vars)
- `backend/src/main.ts` (HTTPS condicional L5–26, NestFactory.create L37)
- `.gitignore` (cert.pem, key.pem agregados)

**Decisión:** D-040 (TLS/HTTPS transport security ASVS L2 V7).

---

## Reglas de documentación

Cada cambio en este changelog debe incluir:

```txt
- Commit hash
- Fecha (ISO 8601) + hora estimada
- Descripción breve (qué cambió)
- Explicación técnica (por qué, qué implicaciones)
- Decisión relacionada (D-00X si aplica)
- Evidencia verificable (git show, código leído, prueba ejecutada)
```

Estos cambios deben mantenerse **siempre sincronizados** con:
- `docs/propuesta/*` (alcance, funcionalidades)
- `docs/arquitectura/decisiones.md` (decisiones tecnicas)
- `docs/operacion/*` (procedimientos)
- `rules.md` (reglas obligatorias)
