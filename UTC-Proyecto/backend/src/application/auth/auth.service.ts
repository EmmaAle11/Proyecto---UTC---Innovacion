import { Inject, Injectable, Logger } from '@nestjs/common';
import type { IUserProfileRepository } from './user-profile.repository.port';
import { USER_PROFILE_REPOSITORY } from './user-profile.repository.port';
import {
  KeycloakAdminService,
  Tokens,
} from '../../infrastructure/keycloak/keycloak-admin.service';
import { AuditLogService } from '../../shared/logging/audit-log.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AdminLoginDto } from './dto/admin-login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { UserRole } from '../../domain/enums';

/** Orquesta el registro y login del cliente contra Keycloak + perfil local (ver D-014). */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly keycloak: KeycloakAdminService,
    @Inject(USER_PROFILE_REPOSITORY)
    private readonly profiles: IUserProfileRepository,
    private readonly auditLog: AuditLogService,
  ) {}

  /**
   * Crea la cuenta en Keycloak (dominio @edu.utc.mx validado en el DTO), inserta el
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
      await this.profiles.create({
        keycloakId,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: UserRole.USER,
      });
    } catch (err) {
      // Compensación: si falla el perfil local, deshacer el usuario de Keycloak.
      await this.keycloak.removeUser(keycloakId);
      throw err;
    }
    try {
      const tokens = await this.keycloak.login(dto.email, dto.password);
      return { message: 'Cuenta creada', ...tokens };
    } catch (err) {
      // La cuenta ya quedó creada y consistente; si el auto-login falla (red/throttle),
      // el cliente inicia sesión con /auth/login. No es un fallo del registro, pero se
      // registra: un cliente mal configurado fallaría el auto-login en CADA registro.
      this.logger.warn(
        `Auto-login post-registro falló para ${dto.email}: ${err instanceof Error ? err.message : String(err)}`,
      );
      return { message: 'Cuenta creada. Inicia sesión.' };
    }
  }

  async login(dto: LoginDto): Promise<Tokens> {
    try {
      const tokens = await this.keycloak.login(dto.email, dto.password);
      this.auditLog.logLogin(dto.email, true, 'user');
      return tokens;
    } catch (err) {
      this.auditLog.logLogin(dto.email, false, 'user', err.message);
      throw err;
    }
  }

  /** Login del administrador: credenciales + MFA contra Keycloak, exige rol admin (ver D-014, rules §6). */
  async loginAdmin(dto: AdminLoginDto): Promise<Tokens> {
    try {
      const tokens = await this.keycloak.loginAdmin(dto.email, dto.password, dto.totp);
      this.auditLog.logLogin(dto.email, true, 'admin');
      return tokens;
    } catch (err) {
      this.auditLog.logLogin(dto.email, false, 'admin', err.message);
      throw err;
    }
  }

  /** Renueva la sesión (cliente o admin) con el refresh_token. */
  async refresh(dto: RefreshDto): Promise<Tokens> {
    return this.keycloak.refresh(dto.refresh_token);
  }
}
