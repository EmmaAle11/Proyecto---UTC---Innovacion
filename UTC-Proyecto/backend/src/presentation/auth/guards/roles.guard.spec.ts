import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from '../decorators/roles.decorator';

/**
 * Autorización por rol en el backend (rules §5, BR-003). Prueba la matriz de roles
 * operativos sobre la puerta de transición de estado de pedido: cocina/mostrador/admin
 * pasan; user e inventario reciben 403. El FE puede ocultar UI, pero aquí se decide.
 */
describe('RolesGuard', () => {
  // Construye guard + contexto con el MISMO reflector mockeado que consulta el guard,
  // para que el test ejercite de verdad la lógica de autorización.
  const setup = (userRoles: string[], required: string[] | undefined) => {
    const reflector = new Reflector();
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(required);
    const logUnauthorizedAccess = jest.fn();
    const auditLog = {
      logUnauthorizedAccess,
    } as unknown as import('../../../shared/logging/audit-log.service').AuditLogService;
    const guard = new RolesGuard(reflector, auditLog);
    const ctx = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({
          user: { roles: userRoles, email: 'actor@edu.utc.mx' },
          url: '/orders/x/status',
        }),
      }),
    } as unknown as ExecutionContext;
    return { guard, ctx, logUnauthorizedAccess };
  };

  // Puerta de PATCH /orders/:id/status: @Roles('admin','cocina','mostrador').
  const STATUS_ROLES = ['admin', 'cocina', 'mostrador'];

  it.each(['admin', 'cocina', 'mostrador'])(
    'permite a %s cambiar el estado del pedido (BR-004)',
    (role) => {
      const { guard, ctx } = setup([role], STATUS_ROLES);
      expect(guard.canActivate(ctx)).toBe(true);
    },
  );

  it.each(['user', 'inventario'])(
    'niega a %s el cambio de estado (403) y registra el intento',
    (role) => {
      const { guard, ctx, logUnauthorizedAccess } = setup([role], STATUS_ROLES);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
      // V4 ASVS: el acceso denegado se audita (detección de escalada de privilegios).
      expect(logUnauthorizedAccess).toHaveBeenCalledWith(
        'actor@edu.utc.mx',
        '/orders/x/status',
        'insufficient_role',
      );
    },
  );

  it('sin @Roles (metadata vacía) deja pasar a cualquier autenticado', () => {
    const { guard, ctx } = setup(['user'], undefined);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('ROLES_KEY es la clave usada por el decorador', () => {
    expect(ROLES_KEY).toBe('roles');
  });
});
