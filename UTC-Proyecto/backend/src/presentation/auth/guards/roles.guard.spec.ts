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
    const guard = new RolesGuard(reflector);
    const ctx = {
      getHandler: () => undefined,
      getClass: () => undefined,
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: userRoles } }),
      }),
    } as unknown as ExecutionContext;
    return { guard, ctx };
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
    'niega a %s el cambio de estado (403)',
    (role) => {
      const { guard, ctx } = setup([role], STATUS_ROLES);
      expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
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
