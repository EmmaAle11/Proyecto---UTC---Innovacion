import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from '../../application/auth/auth.service';
import { RegisterDto } from '../../application/auth/dto/register.dto';
import { LoginDto } from '../../application/auth/dto/login.dto';
import { AdminLoginDto } from '../../application/auth/dto/admin-login.dto';
import { Public } from './decorators/public.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  // rate-limit estricto en auth (rules §8): 5/min. @Public: omiten el JwtAuthGuard global.
  @Post('register')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post('login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  /** Login del administrador: correo + contraseña + código MFA (totp). Ver rules §6. */
  @Post('admin/login')
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  adminLogin(@Body() dto: AdminLoginDto) {
    return this.auth.loginAdmin(dto);
  }
}
