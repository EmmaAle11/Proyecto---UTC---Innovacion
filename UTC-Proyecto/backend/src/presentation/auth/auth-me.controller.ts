import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';
import { Roles } from './decorators/roles.decorator';
import type { JwtUser } from '../../infrastructure/auth/jwt.strategy';

/** Rutas protegidas de ejemplo/diagnóstico del guard JWT + roles. */
@Controller('auth')
export class AuthMeController {
  /** Devuelve la identidad del token (cualquier usuario autenticado). */
  @Get('me')
  me(@Req() req: Request & { user?: JwtUser }): JwtUser | undefined {
    return req.user;
  }

  /** Solo admin: smoke-test de @Roles('admin') (un `user` recibe 403). */
  @Get('admin-check')
  @Roles('admin')
  adminCheck(@Req() req: Request & { user?: JwtUser }): {
    ok: true;
    sub?: string;
  } {
    return { ok: true, sub: req.user?.sub };
  }
}
