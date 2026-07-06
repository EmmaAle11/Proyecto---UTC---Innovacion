# Threat Model — UTC Pick Sazón

**Documento:** STRIDE Threat Modeling  
**Fecha:** 2026-07-06  
**Versión:** 1.0  
**Clasificación:** Académico (proyecto escolar)

---

## 1. Descripción del Sistema

**Aplicación:** UTC Pick Sazón (dark kitchen cooperativa)

**Actores:**
- **Estudiante (User):** cliente, crea pedidos, paga, recoge comida
- **Administrador (Admin):** gestiona productos, estados de pedidos, acepta pagos
- **Sistema Keycloak:** proveedor de identidad centralizado (Realm: utc-food)
- **PostgreSQL:** almacenamiento de datos persistentes
- **Expo Go / APK:** cliente mobile (React Native)

**Entorno:**
- **Local dev:** HTTP (OK, aceptado)
- **Producción:** HTTPS (requerido)

---

## 2. Fronteras de Confianza

```
┌─────────────────────────────────────────────────┐
│         CLIENTE (Expo / APK Mobile)             │
│         • Expo SDK 56, React Native 0.85        │
└──────────────────┬──────────────────────────────┘
                   │ HTTP/HTTPS (JWT Bearer Token)
                   ↓
    ┌──────────────────────────────┐
    │   BACKEND (NestJS :3002)     │
    │   • Controllers              │
    │   • JWT validation           │
    │   • Business logic           │
    │   • Rate limiting (5/60)     │
    └──────────┬────────┬──────────┘
               │        │
               ↓        ↓
      ┌────────────┐  ┌─────────────────────┐
      │ PostgreSQL │  │  Keycloak (HTTP)    │
      │ 16 local   │  │  RS256 JWKS + TOTP  │
      │ UTC_PROJECT│  │  Realm: utc-food    │
      │ _DB        │  └─────────────────────┘
      └────────────┘
```

**Cruces de frontera (puntos de validación):**
1. Cliente ↔ Backend: HTTP/HTTPS → JWT signature validation
2. Backend ↔ Keycloak: HTTP (dev), HTTPS (prod) → JWKS cached + issuer validation
3. Backend ↔ PostgreSQL: Unix socket (local) → contraseñas en env vars
4. Cliente ↔ Admin: Separación lógica (roles: admin, user)

---

## 3. STRIDE Analysis — Amenazas Identificadas

### **S — SPOOFING (Suplantación de Identidad)**

| Amenaza | Escenario | Probabilidad | Severidad | Mitigación | Estado |
|---------|-----------|--------------|-----------|-----------|--------|
| **S1** — Token JWT falsificado | Atacante inventa un JWT válido | BAJA | CRÍTICA | Validación RS256 + issuer + azp check | ✅ Implementado |
| **S2** — Acceso admin sin MFA | Admin sin segundo factor | BAJA | CRÍTICA | TOTP forzado (no opcional, regla BR-003) | ✅ Implementado |
| **S3** — Suplantación Keycloak | Backend acepta tokens de otro IdP | BAJA | CRÍTICA | Validación issuer exacto (issuer = kc_url/realms/realm) | ✅ Implementado |
| **S4** — Token expirado aceptado | Token viejo reutilizado | BAJA | MEDIA | TTL 30 min, validación `exp` claim | ✅ Implementado |
| **S5** — Keycloak comprometido | Contraseñas del reino leídas | MUY BAJA | CRÍTICA | Fuera de scope (escuela, asumir Keycloak seguro) | ⚠️ Aceptado |

---

### **T — TAMPERING (Modificación de Datos)**

| Amenaza | Escenario | Probabilidad | Severidad | Mitigación | Estado |
|---------|-----------|--------------|-----------|-----------|--------|
| **T1** — Pedido modificado en tránsito | Atacante intercepta HTTP + modifica datos | MEDIA | ALTA | HTTPS (TLS 1.3) en producción | ⚠️ TODO |
| **T2** — BD comprometida | Datos en BD leídos/modificados | BAJA | CRÍTICA | Encriptación de columnas sensitivas (bcrypt) | ⚠️ TODO |
| **T3** — Cambio de rol sin validación | User intenta elevarse a admin | MUY BAJA | CRÍTICA | RolesGuard en backend (verifica roles del JWT) | ✅ Implementado |
| **T4** — Estado de pedido manipulado | User marca pedido como "ready" sin ser admin | MUY BAJA | ALTA | Backend valida transiciones de estado (regla BR-004) | ✅ Implementado |
| **T5** — Stock modificado en BD | Admin falsifica stock manualmente | MUY BAJA | MEDIA | Auditoría de cambios (logging de acciones) | ⚠️ TODO |

---

### **R — REPUDIATION (Negación de Responsabilidad)**

| Amenaza | Escenario | Probabilidad | Severidad | Mitigación | Estado |
|---------|-----------|--------------|-----------|-----------|--------|
| **R1** — Admin niega haber aceptado pago | Sin registro de quién hizo qué | MEDIA | MEDIA | Audit logging de acciones críticas (login, cambios) | ⚠️ TODO |
| **R2** — User niega pedido realizado | Sin prueba de quién creó el pedido | MEDIA | BAJA | Timestamp servidor (ready_at, created_at) | ✅ Implementado |
| **R3** — No trazabilidad de cambios | Cambios de estado sin registro | MEDIA | MEDIA | Audit log por timestamp, usuario, acción | ⚠️ TODO |

---

### **I — INFORMATION DISCLOSURE (Divulgación de Información)**

| Amenaza | Escenario | Probabilidad | Severidad | Mitigación | Estado |
|---------|-----------|--------------|-----------|-----------|--------|
| **I1** — Stack trace en errores | Error HTTP 500 expone ruta interna | MEDIA | BAJA | Exception filters genéricos (no detalles en prod) | ⚠️ Parcial |
| **I2** — Tokens en logs | Tokens JWT logueados accidentalmente | BAJA | CRÍTICA | No loguear Authorization headers | ⚠️ TODO (verificar) |
| **I3** — Contraseñas en env vars | Archivo .env en git | MUY BAJA | CRÍTICA | .gitignore + .env (no commiteado) | ✅ Implementado |
| **I4** — API keys expuestas | KEYCLOAK_BACKEND_CLIENT_SECRET en logs | BAJA | CRÍTICA | No loguear secrets de config | ⚠️ TODO (verificar) |
| **I5** — PII leakage | Email/datos de user en respuesta pública | BAJA | MEDIA | DTO + serialización selectiva (no traer datos innecesarios) | ✅ Implementado |
| **I6** — Timing attack en login | Respuesta diferente si user existe | BAJA | BAJA | Tiempo constante (out of scope, Keycloak lo maneja) | ⚠️ Aceptado |

---

### **D — DENIAL OF SERVICE (Denegación de Servicio)**

| Amenaza | Escenario | Probabilidad | Severidad | Mitigación | Estado |
|---------|-----------|--------------|-----------|-----------|--------|
| **D1** — Brute-force login | Atacante intenta 1000 login/min | MEDIA | MEDIA | Rate limiting: 5/min en /auth/login | ✅ Implementado |
| **D2** — Spam de órdenes | User crea 1000 pedidos/min | MEDIA | MEDIA | Rate limiting: 60/min en /orders | ✅ Implementado |
| **D3** — BD saturada (INSERT spam) | Volcado de datos masivo | BAJA | MEDIA | Rate limiting + circuit breaker en pagos | ✅ Parcial |
| **D4** — ReDoS (Regex denial) | Entrada malformada causa CPU 100% | BAJA | BAJA | Validadores de entrada (class-validator, no regex custom) | ✅ Implementado |
| **D5** — Desconexión de Keycloak | Keycloak offline = login imposible | BAJA | MEDIA | Graceful degradation (dejar offline pero mantener API) | ⚠️ TODO |

---

### **E — ELEVATION OF PRIVILEGE (Escalada de Privilegios)**

| Amenaza | Escenario | Probabilidad | Severidad | Mitigación | Estado |
|---------|-----------|--------------|-----------|-----------|--------|
| **E1** — User accede rutas /admin | User sin rol admin intenta acceso | MUY BAJA | CRÍTICA | RolesGuard: solo admin puede /admin/* | ✅ Implementado |
| **E2** — Expiración de token ignorada | Token sin exp claim aceptado | MUY BAJA | CRÍTICA | Validación `exp` claim obligatoria (JWT estrategia) | ✅ Implementado |
| **E3** — JWT sin firma validada | Token sin validar signature | MUY BAJA | CRÍTICA | Validación RS256 + JWKS en jwt.strategy.ts | ✅ Implementado |
| **E4** — Session fixation | Atacante reutiliza token viejo | BAJA | MEDIA | JWT stateless + TTL corto (30 min) | ✅ Implementado |
| **E5** — Rol modificado en JWT | Token contiene rol inventado | MUY BAJA | CRÍTICA | Validación issuer + azp (token emitido por Keycloak) | ✅ Implementado |

---

## 4. Riesgos por Severidad

### 🔴 CRÍTICO (Severidad)

| Riesgo | Mitigación Actual | Estado | Acción |
|--------|------------------|--------|--------|
| T1 — HTTPS en tránsito | Solo dev HTTP, prod requiere HTTPS | ⚠️ Parcial | Implementar HTTPS local + env vars |
| T2 — Datos cifrados en BD | Keycloak maneja contraseñas, pero PII no cifrada | ⚠️ TODO | Bcrypt en columnas sensitivas (si aplica) |
| I1 — Exposición de secrets | .env en .gitignore, pero verificar logs | ⚠️ Verificar | Audit logging sin secrets |

### 🟠 ALTA (Severidad)

| Riesgo | Mitigación Actual | Estado | Acción |
|--------|------------------|--------|--------|
| T5 — Auditoría de cambios | No existe logging de acciones | ❌ NO | Implementar audit service |
| R1 — Negación de responsabilidad | Sin registro de usuario → acción | ❌ NO | Audit log con timestamps + usuario |
| I2 — Tokens en logs | No verificado | ⚠️ TODO | Audit + configurar logger para no loguear Auth headers |

### 🟡 MEDIA (Severidad)

| Riesgo | Mitigación Actual | Estado | Acción |
|--------|------------------|--------|--------|
| D5 — Keycloak offline | No hay fallback | ⚠️ TODO | Cache tokens (si tiempo permite) |

---

## 5. Resumen de Implementación ACTUAL

✅ **IMPLEMENTADO (Mitigaciones activas):**
- S1–S4: Validación JWT completa (RS256, issuer, azp, exp)
- S2: MFA forzado admin (TOTP)
- T3–T4: RolesGuard + validación de estados
- E1–E5: Separación roles + estateless sessions
- D1–D4: Rate limiting + validadores

⚠️ **PARCIALMENTE IMPLEMENTADO:**
- T1: HTTPS requiere configuración manual
- I1: Exception handling existe pero revisar en prod
- D3: Circuit breaker existe en pagos, no generalizado

❌ **NO IMPLEMENTADO (Próximas tareas):**
- T2: Cifrado de datos en BD (bcrypt)
- T5: Auditoría de cambios (logging de acciones)
- R1–R3: Audit logging de responsabilidad
- I2/I4: Verificación de logs (no loguear secrets)
- D5: Fallback Keycloak

---

## 6. Decisiones de Riesgo (Aceptado / Aceptado Temporal)

| Riesgo | Razón | Revisor | Fecha |
|--------|-------|---------|-------|
| Keycloak en HTTP (dev) | Entorno local, OK | Proyecto | 2026-07-06 |
| Payments simulados | Demo escolar, no real | Proyecto | 2026-07-02 |
| BD sin backup automático | Entorno escolar, bajo volumen | Proyecto | 2026-06-25 |
| Email externo no validado | Escuela = within campus, confiable | Proyecto | 2026-06-24 |

---

## 7. Plan de Remediación (Próximos Sprints)

**CRÍTICO (Esta semana — OWASP ASVS L2):**
1. ✅ **Helmet** — security headers (HECHO)
2. 📋 **Threat Model** — este documento (EN PROGRESO)
3. ⏳ **HTTPS local** — certificado + env vars
4. ⏳ **Audit Logging** — infrastructure/logging/audit-log.service.ts

**ALTA (Próxima semana):**
5. Cifrado datos sensitivos (bcrypt columnas)
6. Revisión logs (no loguear tokens/secrets)
7. Exception handling refinado (sin stack trace prod)

**MEDIA (Sprint 3+):**
8. Cache tokens (fallback Keycloak)
9. Metrics y SLA
10. Documentación de runbook de incidentes

---

## Referencias

- **OWASP STRIDE:** https://owasp.org/www-community/threats/
- **OWASP ASVS L2:** https://github.com/OWASP/ASVS
- **Proyecto rules.md:** `docs/superpowers/priority/rules.md` (§0–§41)
- **Decisiones:** `docs/arquitectura/decisiones.md` (D-001–D-039)

---

**Documento creado por:** Claude Code (Ponytail mode)  
**Aprobación:** Pendiente (usuario/proyecto)  
**Próxima revisión:** Post-implementación HTTPS + Audit Logging
