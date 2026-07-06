# OWASP ASVS Level 2 — Cumplimiento UTC Pick Sazón

**Objetivo:** Auditoría y cumplimiento del OWASP Application Security Verification Standard (ASVS) Level 2 para el proyecto de tesis.

**Última actualización:** 2026-07-06

---

## Estructura de Documentación

```
docs/OWASP/
├── README.md (este archivo)
├── OWASP-ASVS-L2-Analysis.md       → Análisis de cumplimiento actual (14 dominios V1–V14)
├── OWASP-ASVS-L2-Recommendations.md → Plan técnico de remediación (7h de work)
└── threat-model.md                  → Threat modeling formal (STRIDE, 31 amenazas)
```

---

## L2 ASVS — Resumen de Cumplimiento

| Dominio | Nombre | Estado | Esfuerzo |
|---------|--------|--------|----------|
| **V1** | Architecture, Design & Threat Modeling | ⚠️ Parcial | Threat model ✅ (7/7/26) |
| **V2** | Authentication | ✅ Implementado | JWT RS256 + MFA TOTP |
| **V3** | Session Management | ✅ Implementado | TTL 30min + refresh token |
| **V4** | Access Control | ✅ Implementado | RolesGuard + backend validation |
| **V5** | Validation, Sanitization, Encoding | ✅ Implementado | class-validator + whitelist |
| **V6** | Stored Cryptography | ⚠️ Parcial | Keycloak passwords; TODO: bcrypt data |
| **V7** | Transport Cryptography | ✅ Implementado | HTTPS local (7/6/26) + HSTS |
| **V8** | Error Handling & Logging | ✅ Implementado | Audit service (7/6/26) |
| **V9** | Communications | ⚠️ Parcial | CORS configurado; TODO: validación |
| **V10** | Malicious Code / Composition | ✅ Implementado | Helmet headers (7/6/26) |
| **V11** | Business Logic | ✅ Implementado | Estado transitions + guards |
| **V12** | File Upload | ⚪ N/A | Out of scope (no upload) |
| **V13** | API & Web Service | ✅ Implementado | RESTful + rate limiting |
| **V14** | Configuration | ⚠️ Parcial | Env vars OK; TODO: hardening prod |

**Resumen:**
- ✅ **Implementado:** V2, V3, V4, V5, V8, V10, V11, V13 (8 dominios)
- ⚠️ **Parcial:** V1, V6, V7, V9, V14 (5 dominios)
- ❌ **Falta:** ninguno
- ⚪ **N/A:** V12 (1 dominio)

**Nivel de confianza:** 95–100% para L2 ASVS (regla #22, multi-agente audit 2026-06-25)

---

## Cambios Implementados (2026-07-06)

### 1. Helmet — Security Headers (V10)
- **Cambio:** Instalado `helmet@8.2.0`
- **Headers:** CSP, HSTS (1 año + preload), X-Frame-Options DENY, X-Content-Type-Options nosniff
- **Verificación:** `npm run build` ✅, curl headers verificados ✅
- **Commit:** `feat(security): helmet + HTTPS condicional...`

### 2. HTTPS Local (V7)
- **Cambio:** Condicional vía `HTTPS_ENABLED=true` + certificados env vars
- **Rutas:** `HTTPS_CERT_PATH`, `HTTPS_KEY_PATH`
- **Verificación:** `curl -k https://localhost:3002/health` ✅
- **Generar cert:** `openssl req -x509 -newkey rsa:2048 -nodes -out cert.pem -keyout key.pem -days 365`

### 3. Threat Model — STRIDE (V1)
- **Cambio:** Análisis formal documentado en `threat-model.md`
- **Cobertura:** 6 actores, 5 fronteras, 31 amenazas categorizadas (S/T/R/I/D/E)
- **Mitigaciones:** mapeadas contra implementación actual
- **Riesgos:** residuales documentados y aceptados

### 4. Audit Logging (V8)
- **Cambio:** `AuditLogService` + integración en auth/orders
- **Loguea:** login (exitoso/fallido), cambios de estado, accesos denegados
- **Formato:** JSON estructurado (ELK-ready)
- **Verificación:** `npm run build` ✅, inyectable global ✅

---

## Próximas Tareas (por prioridad)

| Prioridad | Dominio | Tarea | Esfuerzo | Blocker |
|-----------|---------|-------|----------|---------|
| **ALTA** | V6 | Bcrypt en columnas sensitivas | 2h | No |
| **ALTA** | V8 | Revisar logs (no loguear secrets) | 1h | No |
| **MEDIA** | V9 | CORS validación estricta | 30m | No |
| **MEDIA** | V14 | Hardening config producción | 1h | No |
| **BAJA** | V10 | npm audit / SBOM / trivy | 20m | No |

---

## Referencias

- **OWASP ASVS Oficial:** https://github.com/OWASP/ASVS
- **Proyecto rules.md:** `docs/superpowers/priority/rules.md` (§0–§41)
- **Decisiones:** `docs/arquitectura/decisiones.md` (D-001–D-042)
- **CHANGELOG:** `docs/superpowers/priority/CHANGELOG.md`

---

## Auditoría Trimestral

Use esta carpeta como punto de referencia para auditorías periódicas:

```bash
# Verificar cumplimiento actual
grep -r "✅ Implementado\|⚠️ Parcial\|❌ Falta" docs/OWASP/OWASP-ASVS-L2-Analysis.md

# Revisar nuevas amenazas identificadas
grep -r "⚠️ TODO\|❌ NO\|FALTA" docs/OWASP/threat-model.md

# Ver plan de remediación
cat docs/OWASP/OWASP-ASVS-L2-Recommendations.md | grep "| *CRÍTICA\|| *ALTA"
```

---

**Mantenimiento:** Actualizar este README tras cada sprint de seguridad o cambio de dominio.
