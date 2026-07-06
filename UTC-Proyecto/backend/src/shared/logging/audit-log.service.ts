import { Injectable, Logger } from '@nestjs/common';

/**
 * Servicio de auditoría: registra acciones críticas (login, cambios de estado, accesos denegados).
 * Reutiliza NestJS Logger. NO loguea tokens, passwords, secrets.
 * Formato: JSON estructurado para fácil parsing en logs centralizados.
 */
@Injectable()
export class AuditLogService {
  private readonly logger = new Logger('Audit');

  /**
   * Login exitoso o fallido (regla V2 ASVS — autenticación).
   * NO incluye password ni token en el log.
   */
  logLogin(email: string, success: boolean, method: 'user' | 'admin', reason?: string) {
    this.logger.log(
      JSON.stringify({
        action: 'login',
        email,
        method,
        success,
        reason: reason ?? null,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Cambio de estado de pedido (regla BR-004 — transiciones validadas).
   * Registra quién cambió qué, cuándo (para auditoría y trazabilidad).
   */
  logOrderStateChange(
    orderId: string,
    fromStatus: string,
    toStatus: string,
    adminEmail: string,
  ) {
    this.logger.log(
      JSON.stringify({
        action: 'order_state_change',
        orderId,
        from: fromStatus,
        to: toStatus,
        admin: adminEmail,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Acceso denegado: user intentó ruta que requiere permisos (regla V4 ASVS — access control).
   * Útil para detectar intentos de escalada de privilegios.
   */
  logUnauthorizedAccess(email: string, route: string, reason: 'insufficient_role' | 'mfa_required') {
    this.logger.warn(
      JSON.stringify({
        action: 'unauthorized_access',
        email,
        route,
        reason,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * MFA requerido pero no proporcionado (regla BR-003 — MFA forzado admin).
   */
  logMFARequired(adminEmail: string) {
    this.logger.log(
      JSON.stringify({
        action: 'mfa_required',
        admin: adminEmail,
        timestamp: new Date().toISOString(),
      }),
    );
  }

  /**
   * Intento de acceso con token inválido/expirado.
   */
  logInvalidToken(reason: 'expired' | 'invalid_signature' | 'missing_azp') {
    this.logger.warn(
      JSON.stringify({
        action: 'invalid_token',
        reason,
        timestamp: new Date().toISOString(),
      }),
    );
  }
}
