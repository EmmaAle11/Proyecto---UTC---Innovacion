# OWASP ASVS L2 — Análisis de Cumplimiento

**Proyecto:** UTC Pick Sazón  
**Fecha:** 2026-07-06  
**Objetivo:** Mapeo de requisitos OWASP ASVS L2 vs implementación actual + gap analysis  
**Estado:** EN PROGRESO (Fase 1: recolección de datos)

---

## Resumen Ejecutivo

Este documento registra el cumplimiento del proyecto contra **OWASP ASVS Level 2** (Application Security Verification Standard).

ASVS L2 es el nivel estándar para aplicaciones que manejan datos sensibles o requieren autenticación robusta. Aplicable a:
- ✅ Aplicaciones escolares con autenticación institucional
- ✅ Sistemas de datos de estudiantes
- ✅ Transacciones simuladas (pagos)

---

## Los 14 Dominios ASVS (v4.0.3)

| Dominio | Nombre | L2 Requerimientos | UTC Status |
|---------|--------|-------------------|-----------|
| **V1** | Architecture, Design and Threat Modeling | 4 | ⚠️ Parcial |
| **V2** | Authentication | 9 | ✅ Implementado |
| **V3** | Session Management | 6 | ✅ Implementado |
| **V4** | Access Control | 10 | ✅ Implementado |
| **V5** | Validation, Sanitization, Encoding | 19 | ✅ Implementado |
| **V6** | Stored Cryptography | 7 | ⚠️ Parcial |
| **V7** | Transport Layer Cryptography | 4 | ⚠️ Parcial |
| **V8** | Error Handling and Logging | 5 | ⚠️ Parcial |
| **V9** | Communications (deprecated → V7/V14) | 1 | ⚠️ Parcial |
| **V10** | Malicious Code / Software Composition | 3 | ❌ No implementado |
| **V11** | Business Logic Verification | 5 | ✅ Implementado |
| **V12** | File and Resources | 3 | ⚪ N/A (no upload) |
| **V13** | API and Web Service | 5 | ✅ Implementado |
| **V14** | Configuration | 5 | ⚠️ Parcial |

**Resumen:** 
- ✅ **Implementado:** V2, V3, V4, V5, V11, V13 (6 dominios)
- ⚠️ **Parcial:** V1, V6, V7, V8, V9, V14 (6 dominios)
- ❌ **Falta:** V10 (1 dominio)
- ⚪ **N/A:** V12 (1 dominio — out of scope)

---

## Hallazgos Preliminares

### ✅ YA IMPLEMENTADO

#### V2 — Autenticación
- **JWT con RS256** (validación de firma)
- **JWKS rateLimit** (cached + rate limiting en key fetching)
- **Keycloak como IdP** (centralizado, no custom passwords)
- **Issuer validation** (iss claim verificado)
- **Authorized Party (azp) check** (token emitido para el client correcto)
- **MFA TOTP** (admin forzado)

*Evidencia:* `backend/src/infrastructure/auth/jwt.strategy.ts` (líneas 40–68)

#### V3 — Gestión de Sesiones
- **Token TTL 30 minutos**
- **Refresh token endpoint** (`POST /auth/refresh`)
- **Reintento automático en 401** (frontend interceptor)
- **No session fixation** (JWT stateless)

*Evidencia:* `backend/src/application/auth/auth.service.ts`, `frontend/src/shared/api/api-client.ts`

#### V4 — Control de Acceso
- **Guards basados en JWT** (`JwtAuthGuard`)
- **Validación de roles** (`RolesGuard`)
- **Separación admin/user** (rutas protegidas por rol)
- **Frontend oculta botones, backend valida** (regla #5 rules.md)

*Evidencia:* `backend/src/presentation/auth/guards/*.ts`

#### V5 — Validación y Sanitización
- **class-validator** en DTOs (IsEmail, MinLength, IsEnum, IsInt, Min, etc.)
- **Whitelist enabled** (class-transformer con whitelist)
- **Email validation** (IsEmail en login/register DTOs)
- **Enum validation** (OrderStatus, PaymentMethod, ProductStatus)
- **Numeric constraints** (Min, Max, precision)

*Evidencia:* `backend/src/application/*/dto/*.ts`

#### V8 — Gestión de Errores y Logging
- **Middleware de errores** (NestJS exception filters)
- **No exposición de stack traces** (mensajes genéricos en producción)
- **Logging estructurado** (NestJS built-in logger)

*Evidencia:* `backend/src/app.module.ts`, exception handling

#### V11 — Lógica Empresarial
- **Estados de pedido validados** (regla BR-004 en rules.md)
- **Transiciones solo permitidas** (pending→preparing→ready→picked_up)
- **No saltar estados** (validate en service antes de persistir)
- **Admin es autoridad** (regla BR-008, backend valida cambios de estado)

*Evidencia:* `backend/src/application/orders/dto/update-order-status.dto.ts`

#### V13 — API y Servicios Web
- **RESTful design** (POST/GET/PATCH)
- **Content-Type application/json**
- **Rate limiting** (ThrottlerModule, 5/min auth, 60/min default)

*Evidencia:* `backend/src/app.module.ts` (ThrottlerModule)

---

### ⚠️ PARCIALMENTE IMPLEMENTADO

#### V1 — Arquitectura y Amenazas
- **Existe esquema de BD** (TypeORM entities, 6 tablas)
- **Existe diagrama** (docs/arquitectura/architecture-propuesta.md)
- **FALTA:** threat modeling formal, STRIDE, análisis de riesgos explícito

#### V6 — Criptografía Almacenada
- **Contraseñas en Keycloak** (bcrypt, no en app)
- **FALTA:** cifrado de datos sensibles en BD (efectivo, tokens de refresh locales si aplica)

#### V7 — Criptografía en Tránsito
- **JWT con RS256** (OK)
- **FALTA:** TLS/HTTPS en producción (local solo HTTP)
- **FALTA:** configuración HSTS, HTTPS redirect

#### V9 — Comunicaciones
- **CORS configurado** (rules §9 menciona "CORS prod")
- **FALTA:** implementación real de CORS headers, verificación origen

---

### ❌ NO IMPLEMENTADO

#### V10 — Configuración Maliciosa
- **FALTA:** verificación de dependencias (SBOM, npm audit, trivy)
- **FALTA:** headers de seguridad (X-Content-Type-Options, CSP, X-Frame-Options)
- **FALTA:** manejo de archivos estáticos seguros

#### V12 — Gestión de Archivos
- **No hay upload** (out of scope, pero revisar si será necesario)

---

## Plan de Acción (Draft)

| Prioridad | Dominio | Requerimiento | Esfuerzo | Estado |
|-----------|---------|---------------|----------|--------|
| CRÍTICA | V1 | Threat modeling formal (STRIDE) | 4h | TODO |
| CRÍTICA | V7 | TLS/HTTPS en local + headers seguridad | 2h | TODO |
| CRÍTICA | V10 | Security headers (HSTS, CSP, X-*) | 1h | TODO |
| ALTA | V6 | Cifrado de datos sensibles en BD | 3h | TODO |
| ALTA | V1 | Documentación de architecture decision records | 2h | PARCIAL |
| ALTA | V14 | Configuración segura (secretos, env vars) | 1h | PARCIAL |
| MEDIA | V9 | Validación CORS headers | 1h | TODO |
| MEDIA | V10 | Dependency scanning (npm audit, SBOM) | 1h | TODO |

---

## Próximos Pasos

1. **Fase 2:** Leer especificación OWASP ASVS L2 oficial
2. **Fase 3:** Mapeo detallado (V1–V14) con requisitos específicos
3. **Fase 4:** Priorización y timeline
4. **Fase 5:** Implementación por sprints

---

## Referencias

- **OWASP ASVS Official:** https://github.com/OWASP/ASVS
- **Proyecto rules.md:** `docs/superpowers/priority/rules.md` (seguridad en §0–§14, BR-001–BR-015)
- **Arquitectura:** `docs/arquitectura/architecture-propuesta.md` (§5 esquema, §2 stack)
- **Decisiones:** `docs/arquitectura/decisiones.md` (D-001–D-038)

