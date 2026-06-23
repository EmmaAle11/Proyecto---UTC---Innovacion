import { postJson } from '../../../shared/api/client';

interface TokenPayload {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  message?: string;
}

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** Resultado del registro: tokens para auto-login; pueden faltar si el auto-login falló (la cuenta SÍ se creó). */
export type RegisterResult = Partial<TokenPayload>;

/** Crea la cuenta del cliente (backend valida @utc.edu.mx). Devuelve tokens si el auto-login funcionó. */
export function registerCliente(input: RegisterInput): Promise<RegisterResult> {
  return postJson<RegisterResult>('/auth/register', input);
}

/** Inicia sesión del cliente contra el backend. */
export function loginCliente(email: string, password: string): Promise<TokenPayload> {
  return postJson<TokenPayload>('/auth/login', { email, password });
}

/** Inicia sesión del administrador: correo + contraseña + código MFA (totp). Ver rules §6. */
export function loginAdmin(
  email: string,
  password: string,
  totp: string,
): Promise<TokenPayload> {
  return postJson<TokenPayload>('/auth/admin/login', { email, password, totp });
}
