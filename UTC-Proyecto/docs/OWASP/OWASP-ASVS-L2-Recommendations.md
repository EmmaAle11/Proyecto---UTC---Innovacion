# OWASP ASVS L2 — Recomendaciones Técnicas

**Proyecto:** UTC Pick Sazón  
**Fecha:** 2026-07-06  
**Enfoque:** Ponytail (mínimo código, máximo impacto)  
**Formato:** Brecha → Fix → Esfuerzo

---

## 🚨 CRÍTICO — Implementar Inmediatamente

### 1. Security Headers (V10)

**Brecha:** No hay headers de seguridad (HSTS, CSP, X-Frame-Options, X-Content-Type-Options).

**Fix (Helmet + NestJS):**

```bash
npm install @nestjs/helmet
```

En `backend/src/app.module.ts`:

```typescript
import { HelmetModule } from '@nestjs/helmet';

@Module({
  imports: [
    HelmetModule.forRoot({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
      hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
      frameguard: { action: 'deny' },
    }),
    // ... rest de imports
  ],
  // ...
})
export class AppModule {}
```

En `backend/src/main.ts`: Helmet se aplica automáticamente.

**Esfuerzo:** 30 min (copiar, 1 commit)  
**Impacto:** Alto (previene clickjacking, MIME sniffing, XSS básico)

---

### 2. TLS/HTTPS en Local (V7)

**Brecha:** Local usa HTTP (OK para dev), pero documentación no cubre HTTPS en prod.

**Fix:**

En `.env.example`:

```env
# HTTPS (prod): generar con: openssl req -x509 -newkey rsa:4096 -nodes -out cert.pem -keyout key.pem -days 365
HTTPS_ENABLED=false
HTTPS_CERT_PATH=./cert.pem
HTTPS_KEY_PATH=./key.pem
NODE_ENV=development  # development | production
```

En `backend/src/main.ts`:

```typescript
import * as fs from 'fs';

async function bootstrap() {
  let httpsOptions: any = undefined;
  if (process.env.HTTPS_ENABLED === 'true') {
    httpsOptions = {
      key: fs.readFileSync(process.env.HTTPS_KEY_PATH),
      cert: fs.readFileSync(process.env.HTTPS_CERT_PATH),
    };
  }
  const app = await NestFactory.create(AppModule, { httpsOptions });
  // ... rest del código
}
```

**Esfuerzo:** 20 min + generación de certificados  
**Impacto:** CRÍTICO (encriptación de tránsito)

---

### 3. Threat Model Formal (V1)

**Brecha:** No hay threat model documentado (STRIDE, análisis de actores, atacantes).

**Fix:** Crear `docs/arquitectura/threat-model.md`

```markdown
# Threat Model — UTC Pick Sazón

## Actores
- **Estudiante (User):** cliente, crea pedidos, no administo
- **Administrador (Admin):** gestiona productos, estados, acepta pagos
- **Keycloak (IdP):** autenticación centralizada
- **PostgreSQL:** datos persistentes

## Fronteras de Confianza
1. Frontend ↔ Backend (HTTP/HTTPS)
2. Backend ↔ Keycloak (HTTP/HTTPS)
3. Backend ↔ PostgreSQL (local socket)
4. Usuario ↔ Keycloak (navegador)

## Amenazas Identificadas (STRIDE)

### SPOOFING (suplantación)
- [ ] Token JWT falsificado → Fix: validación de firma RS256 + issuer ✅
- [ ] Acceso admin sin MFA → Fix: TOTP forzado para admin ✅
- [ ] Keycloak comprometido → Asumir seguro (out of scope escuela)

### TAMPERING (modificación)
- [ ] Pedido modificado en tránsito → Fix: HTTPS/TLS (TO-DO)
- [ ] BD comprometida → Fix: cifrado de datos sensibles (TO-DO)
- [ ] Cambio de rol sin validación → Fix: backend valida roles ✅

### REPUDIATION (negación)
- [ ] Admin niega haber aceptado pago → Fix: logging de acciones (TO-DO)
- [ ] Usuario niega pedido → Fix: timestamp servidor (ready_at) ✅

### INFO DISCLOSURE (divulgación)
- [ ] Stack trace en error → Fix: exception filters genéricos ✅
- [ ] Tokens en logs → Fix: no loguear tokens (verificar) TO-DO
- [ ] Contraseñas en env → Fix: .gitignore + .env (no commiteado) ✅

### DENIAL OF SERVICE
- [ ] Login bruteforce → Fix: rate limiting 5/min ✅
- [ ] Pedidos spam → Fix: rate limiting 60/min ✅
- [ ] BD saturada → Asumir controlado (escuela, bajo volumen)

### ELEVATION OF PRIVILEGE
- [ ] User accede rutas admin → Fix: RolesGuard en backend ✅
- [ ] Token JWT sin expiración → Fix: TTL 30 min ✅
- [ ] No validar azp (authorized party) → Fix: JWT strategy valida ✅

## Riesgos Residuales
- [ ] Local dev sin HTTPS (OK, aceptado)
- [ ] Keycloak en HTTP local (OK, aceptado)
- [ ] Pagos simulados (OK, documentado, escuela)
- [ ] BD sin backup automático (escuela, aceptado)

## Estado
- Crítico: V1 (TLS), V6 (cifrado datos), V10 (headers)
- Implementado: V2 (auth), V3 (session), V4 (access control), V5 (validation)
- A revisar: V8 (logging), V9 (CORS)
```

**Esfuerzo:** 2 horas (mapeo, documentación)  
**Impacto:** CRÍTICO (evidencia para tesis, cumplimiento ASVS)

---

## ⚠️ ALTO — Implementar en Sprint 2

### 4. Logging Estructurado (V8)

**Brecha:** NestJS logger existe pero no registra acciones críticas (login, cambios de estado, intentos fallidos).

**Fix:**

Crear `backend/src/infrastructure/logging/audit.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuditService {
  private readonly logger = new Logger('Audit');

  // ponytail: log línea por acción crítica, no todo
  logLogin(email: string, success: boolean, mfaRequired: boolean) {
    this.logger.log({
      action: 'login',
      email,
      success,
      mfaRequired,
      timestamp: new Date().toISOString(),
    });
  }

  logOrderStateChange(orderId: string, from: string, to: string, admin: string) {
    this.logger.log({
      action: 'order_state_change',
      orderId,
      from,
      to,
      admin,
      timestamp: new Date().toISOString(),
    });
  }

  logUnauthorizedAccess(email: string, route: string, reason: string) {
    this.logger.warn({
      action: 'unauthorized_access',
      email,
      route,
      reason,
      timestamp: new Date().toISOString(),
    });
  }
}
```

Inyectar en controllers/services y usar en puntos clave (login, cambios de estado, acceso negado).

**Esfuerzo:** 1 hora (servicio + inyecciones)  
**Impacto:** ALTO (auditoría, cumplimiento L2)

---

### 5. Cifrado de Datos Sensibles (V6)

**Brecha:** BD en PostgreSQL sin cifrado en columnas. Efectivo, tokens de refresh no se guardan localmente.

**Fix:** Identificar datos a cifrar:

En `backend/src/infrastructure/database/entities/`:

```typescript
// Columna cifrada: efectivo (si se guarda)
// Columna cifrada: PII (email, teléfono si se agrega)

// Usar: npm install bcryptjs
import * as bcrypt from 'bcryptjs';

// En entity:
@Column({ type: 'text', select: false }) // No traerlo por defecto
encryptedSensitiveData: string;

// En repositorio/service:
async encryptData(plaintext: string): Promise<string> {
  return bcrypt.hash(plaintext, 10);
}

async compareData(plaintext: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plaintext, hash);
}
```

**Esfuerzo:** 2 horas (mapeo columnas, implementación)  
**Impacto:** ALTO (protege datos en reposo, regla BR-014 privacidad)

---

## 📋 MEDIA — Sprint 3+

### 6. Validación CORS (V9)

**Actual:** En prod exige CORS_ORIGIN.

**Mejora:**

```typescript
// backend/src/main.ts
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:8081'; // frontend URL
const allowedOrigins = corsOrigin.split(',').map((o) => o.trim());

app.enableCors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('CORS policy violated'));
    }
  },
  credentials: true, // Si usa cookies
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
});
```

**Esfuerzo:** 30 min  
**Impacto:** MEDIO (validación estricta origen)

---

### 7. Dependency Scanning (V10)

**Fix:** Agregar a CI/CD (no ahora, para tesis):

```bash
npm audit
npx snyk test
npx trivy fs . --severity HIGH,CRITICAL
```

En `package.json` scripts:

```json
"security:audit": "npm audit --production",
```

**Esfuerzo:** 20 min (setup)  
**Impacto:** MEDIO-ALTO (tesis = demostrar practices)

---

## 🎯 Plan de Implementación

| Sprint | Tarea | Dominio | Esfuerzo | Prioridad |
|--------|-------|---------|----------|-----------|
| 0 (Ahora) | Security Headers (Helmet) | V10 | 30 min | CRÍTICA |
| 0 | Threat Model documentado | V1 | 2h | CRÍTICA |
| 0 | HTTPS local + .env | V7 | 20 min | CRÍTICA |
| 1 | Logging Estructurado (Audit) | V8 | 1h | ALTA |
| 1 | Cifrado datos sensibles | V6 | 2h | ALTA |
| 2 | CORS validación estricta | V9 | 30 min | MEDIA |
| 2 | Dependency scanning (npm audit) | V10 | 20 min | MEDIA |

**Total para L2:** ~7 horas de implementación

---

## Referencias OWASP

- **V1.1.1:** Architecture, design and threat modeling  
- **V6.1.1:** Stored cryptography  
- **V7.1.1:** Transport cryptography  
- **V8.1.1:** Error handling  
- **V9.1.1:** Communications  
- **V10.1.1:** Malicious code  

