import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  KeycloakAdminService,
  Tokens,
} from '../../infrastructure/keycloak/keycloak-admin.service';
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import { UserRole } from '../../infrastructure/database/entities/enums';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';

/** Orquesta el registro y login del cliente contra Keycloak + perfil local (ver D-014). */
@Injectable()
export class AuthService {
  constructor(
    private readonly keycloak: KeycloakAdminService,
    @InjectRepository(UserProfileEntity)
    private readonly profiles: Repository<UserProfileEntity>,
  ) {}

  /**
   * Crea la cuenta en Keycloak (dominio @utc.edu.mx validado en el DTO), inserta el
   * perfil local (orders lo requiere) y devuelve tokens (auto-login). Atómico: si falla
   * el perfil local, deshace el usuario de Keycloak.
   */
  async register(
    dto: RegisterDto,
  ): Promise<{ message: string } & Partial<Tokens>> {
    const keycloakId = await this.keycloak.createUser({
      email: dto.email,
      password: dto.password,
      firstName: dto.firstName,
      lastName: dto.lastName,
    });
    try {
      await this.profiles.save(
        this.profiles.create({
          keycloakId,
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: UserRole.USER,
        }),
      );
    } catch (err) {
      // Compensación: si falla el perfil local, deshacer el usuario de Keycloak.
      await this.keycloak.removeUser(keycloakId);
      throw err;
    }
    try {
      const tokens = await this.keycloak.login(dto.email, dto.password);
      return { message: 'Cuenta creada', ...tokens };
    } catch {
      // La cuenta ya quedó creada y consistente; si el auto-login falla (red/throttle),
      // el cliente inicia sesión con /auth/login. No es un fallo del registro.
      return { message: 'Cuenta creada. Inicia sesión.' };
    }
  }

  async login(dto: LoginDto): Promise<Tokens> {
    return this.keycloak.login(dto.email, dto.password);
  }

  /** Login del administrador: credenciales + MFA contra Keycloak, exige rol admin (ver D-014, rules §6). */
  async loginAdmin(dto: AdminLoginDto): Promise<Tokens> {
    return this.keycloak.loginAdmin(dto.email, dto.password, dto.totp);
  }
}
