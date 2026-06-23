import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** Exige uno de los roles de realm indicados (validado por RolesGuard en el backend, rules §5). */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
