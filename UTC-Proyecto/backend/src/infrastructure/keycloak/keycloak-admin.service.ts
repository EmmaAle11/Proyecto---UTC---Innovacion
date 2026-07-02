import {
  ConflictException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in?: number;
}

export interface NewUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

export interface Tokens {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

/**
 * Acceso de bajo nivel a Keycloak (token endpoint + Admin API) vía `fetch` global.
 * Usa el client service-account `backend-svc` (manage-users + view-realm) para crear
 * usuarios, y el client público `mobile-app` para el login (password grant). Ver D-014.
 */
@Injectable()
export class KeycloakAdminService {
  private readonly logger = new Logger(KeycloakAdminService.name);
  private readonly baseUrl: string;
  private readonly realm: string;
  private readonly appClientId: string;
  private readonly svcClientId: string;
  private readonly svcSecret: string;

  constructor(config: ConfigService) {
    this.baseUrl = config.getOrThrow<string>('KEYCLOAK_URL');
    this.realm = config.getOrThrow<string>('KEYCLOAK_REALM');
    this.appClientId = config.getOrThrow<string>('KEYCLOAK_CLIENT_ID');
    this.svcClientId = config.getOrThrow<string>('KEYCLOAK_BACKEND_CLIENT_ID');
    this.svcSecret = config.getOrThrow<string>(
      'KEYCLOAK_BACKEND_CLIENT_SECRET',
    );
  }

  private tokenUrl(): string {
    return `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`;
  }

  private adminUrl(path: string): string {
    return `${this.baseUrl}/admin/realms/${this.realm}${path}`;
  }

  /** `fetch` envuelto: mapea errores de red (Keycloak caído, DNS) a 503 con mensaje claro. */
  private async safeFetch(url: string, init?: RequestInit): Promise<Response> {
    try {
      return await fetch(url, init);
    } catch {
      throw new ServiceUnavailableException(
        'No se pudo conectar con el servicio de autenticación',
      );
    }
  }

  /** Token de servicio (client_credentials de backend-svc) para la Admin API. */
  private async serviceToken(): Promise<string> {
    const res = await this.safeFetch(this.tokenUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.svcClientId,
        client_secret: this.svcSecret,
      }),
    });
    if (!res.ok) {
      throw new InternalServerErrorException(
        'No se pudo autenticar el backend con Keycloak',
      );
    }
    const data = (await res.json()) as TokenResponse;
    return data.access_token;
  }

  /**
   * Crea el usuario (contraseña permanente) y le asigna el rol realm `user`.
   * Atómico: si falla la asignación de rol tras crear, borra el usuario (compensación)
   * para no dejar cuentas huérfanas sin rol.
   */
  async createUser(input: NewUser): Promise<string> {
    const token = await this.serviceToken();
    const createRes = await this.safeFetch(this.adminUrl('/users'), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        username: input.email,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        enabled: true,
        emailVerified: true,
        credentials: [
          { type: 'password', value: input.password, temporary: false },
        ],
      }),
    });
    if (createRes.status === 409) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    if (!createRes.ok) {
      throw new InternalServerErrorException(
        'No se pudo crear la cuenta en Keycloak',
      );
    }

    const userId = await this.findUserId(token, input.email);
    try {
      await this.assignRealmRole(token, userId, 'user');
    } catch (err) {
      // Compensación: deshacer el usuario creado para no dejarlo sin rol.
      await this.deleteUser(token, userId);
      throw err;
    }
    return userId;
  }

  /** Borra un usuario por id (compensación desde la capa de aplicación). */
  async removeUser(userId: string): Promise<void> {
    const token = await this.serviceToken();
    await this.deleteUser(token, userId);
  }

  private async findUserId(token: string, email: string): Promise<string> {
    const res = await this.safeFetch(
      this.adminUrl(`/users?exact=true&username=${encodeURIComponent(email)}`),
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!res.ok) {
      throw new InternalServerErrorException(
        'No se pudo consultar el usuario en Keycloak',
      );
    }
    const users = (await res.json()) as Array<{ id: string }>;
    if (!Array.isArray(users) || users.length === 0) {
      throw new InternalServerErrorException(
        'Usuario creado pero no encontrado',
      );
    }
    return users[0].id;
  }

  private async assignRealmRole(
    token: string,
    userId: string,
    roleName: string,
  ): Promise<void> {
    const roleRes = await this.safeFetch(this.adminUrl(`/roles/${roleName}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!roleRes.ok) {
      throw new InternalServerErrorException(`Rol '${roleName}' no encontrado`);
    }
    const role = (await roleRes.json()) as { id: string; name: string };
    const res = await this.safeFetch(
      this.adminUrl(`/users/${userId}/role-mappings/realm`),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify([{ id: role.id, name: role.name }]),
      },
    );
    if (!res.ok) {
      throw new InternalServerErrorException('No se pudo asignar el rol');
    }
  }

  /** Borra un usuario (compensación de registro). Best-effort: no propaga errores de limpieza. */
  private async deleteUser(token: string, userId: string): Promise<void> {
    try {
      const res = await this.safeFetch(this.adminUrl(`/users/${userId}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // No propagamos (es compensación), pero dejamos traza: posible usuario huérfano.
        this.logger.warn(
          `Compensación deleteUser respondió ${res.status}: usuario ${userId} podría quedar huérfano en Keycloak.`,
        );
      }
    } catch {
      // Si la compensación falla por red, igual se relanza el error original del registro.
      this.logger.warn(
        `Compensación deleteUser sin conexión: usuario ${userId} podría quedar huérfano en Keycloak.`,
      );
    }
  }

  /** Login del usuario: password grant contra el client público de la app. */
  async login(email: string, password: string): Promise<Tokens> {
    const res = await this.safeFetch(this.tokenUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: this.appClientId,
        username: email,
        password,
      }),
    });
    if (!res.ok) {
      throw new UnauthorizedException('Correo o contraseña inválidos');
    }
    const data = (await res.json()) as TokenResponse;
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? '',
      expires_in: data.expires_in ?? 0,
    };
  }

  /**
   * Login del administrador: password grant **con código MFA (`totp`)**, y exige rol `admin`
   * en el token (un `user` recibe 403). Keycloak rechaza si falta/erra el OTP. Ver rules §6.
   */
  async loginAdmin(
    email: string,
    password: string,
    totp: string,
  ): Promise<Tokens> {
    const res = await this.safeFetch(this.tokenUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'password',
        client_id: this.appClientId,
        username: email,
        password,
        totp,
      }),
    });
    if (!res.ok) {
      // Si el admin aún NO enroló TOTP, Keycloak rechaza el direct-grant con
      // "Account is not fully set up" (required action CONFIGURE_TOTP pendiente).
      // Damos la causa real: hay que enrolar el 2º factor en la consola de cuenta.
      const body = (await res.json().catch(() => ({}))) as {
        error_description?: string;
      };
      if (/not fully set up|CONFIGURE_TOTP/i.test(body.error_description ?? '')) {
        throw new UnauthorizedException(
          'Tu cuenta de administrador requiere segundo factor (MFA). Configura el TOTP en la consola de cuenta de Keycloak y vuelve a iniciar sesión.',
        );
      }
      throw new UnauthorizedException('Correo, contraseña o código inválidos');
    }
    const data = (await res.json()) as TokenResponse;
    if (!this.rolesFromToken(data.access_token).includes('admin')) {
      throw new ForbiddenException('Esta cuenta no es de administrador');
    }
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token ?? '',
      expires_in: data.expires_in ?? 0,
    };
  }

  /** Lee `realm_access.roles` del access_token recién emitido por nuestro Keycloak. */
  private rolesFromToken(accessToken: string): string[] {
    try {
      const payload = accessToken.split('.')[1];
      const json = JSON.parse(
        Buffer.from(payload, 'base64url').toString('utf8'),
      ) as { realm_access?: { roles?: string[] } };
      return json.realm_access?.roles ?? [];
    } catch {
      return [];
    }
  }
}
