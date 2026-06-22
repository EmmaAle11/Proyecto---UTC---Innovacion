import { Injectable } from '@nestjs/common';
import {
  KeycloakAdminService,
  Tokens,
} from '../../infrastructure/keycloak/keycloak-admin.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

/** Orquesta el registro y login del cliente contra Keycloak (ver D-014). */
@Injectable()
export class AuthService {
  constructor(private readonly keycloak: KeycloakAdminService) {}

  /** Crea la cuenta (dominio @utc.edu.mx validado en el DTO) y devuelve tokens (auto-login). */
  async register(dto: RegisterDto): Promise<{ message: string } & Tokens> {
    await this.keycloak.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    const tokens = await this.keycloak.login(dto.email, dto.password);
    return { message: 'Cuenta creada', ...tokens };
  }

  async login(dto: LoginDto): Promise<Tokens> {
    return this.keycloak.login(dto.email, dto.password);
  }
}
