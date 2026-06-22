import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
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
 * Usa el client service-account `backend-svc` (rol manage-users) para crear usuarios,
 * y el client público `mobile-app` para el login (password grant). Ver D-014.
 */
@Injectable()
export class KeycloakAdminService {
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
    this.svcSecret = config.getOrThrow<string>('KEYCLOAK_BACKEND_CLIENT_SECRET');
  }

  private tokenUrl(): string {
    return `${this.baseUrl}/realms/${this.realm}/protocol/openid-connect/token`;
  }

  private adminUrl(path: string): string {
    return `${this.baseUrl}/admin/realms/${this.realm}${path}`;
  }

  /** Token de servicio (client_credentials de backend-svc) para la Admin API. */
  private async serviceToken(): Promise<string> {
    const res = await fetch(this.tokenUrl(), {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: this.svcClientId,
        client_secret: this.svcSecret,
      }),
    });
    if (!res.ok) {
      throw new InternalServerErrorException('No se pudo autenticar el backend con Keycloak');
    }
    const data = (await res.json()) as TokenResponse;
    return data.access_token;
  }

  /** Crea el usuario (contraseña permanente) y le asigna el rol realm `user`. */
  async createUser(input: NewUser): Promise<void> {
    const token = await this.serviceToken();
    const createRes = await fetch(this.adminUrl('/users'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        username: input.email,
        email: input.email,
        firstName: input.firstName,
        lastName: input.lastName,
        enabled: true,
        emailVerified: true,
        credentials: [{ type: 'password', value: input.password, temporary: false }],
      }),
    });
    if (createRes.status === 409) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    if (!createRes.ok) {
      throw new InternalServerErrorException('No se pudo crear la cuenta en Keycloak');
    }
    const userId = await this.findUserId(token, input.email);
    await this.assignRealmRole(token, userId, 'user');
  }

  private async findUserId(token: string, email: string): Promise<string> {
    const res = await fetch(
      this.adminUrl(`/users?exact=true&username=${encodeURIComponent(email)}`),
      { headers: { Authorization: `Bearer ${token}` } },
    );
    const users = (await res.json()) as Array<{ id: string }>;
    if (!Array.isArray(users) || users.length === 0) {
      throw new InternalServerErrorException('Usuario creado pero no encontrado');
    }
    return users[0].id;
  }

  private async assignRealmRole(token: string, userId: string, roleName: string): Promise<void> {
    const roleRes = await fetch(this.adminUrl(`/roles/${roleName}`), {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!roleRes.ok) {
      throw new InternalServerErrorException(`Rol '${roleName}' no encontrado`);
    }
    const role = (await roleRes.json()) as { id: string; name: string };
    const res = await fetch(this.adminUrl(`/users/${userId}/role-mappings/realm`), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify([{ id: role.id, name: role.name }]),
    });
    if (!res.ok) {
      throw new InternalServerErrorException('No se pudo asignar el rol');
    }
  }

  /** Login del usuario: password grant contra el client público de la app. */
  async login(email: string, password: string): Promise<Tokens> {
    const res = await fetch(this.tokenUrl(), {
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
}
