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

/** Crea la cuenta del cliente (backend valida @utc.edu.mx) y devuelve tokens. */
export function registerCliente(input: RegisterInput): Promise<TokenPayload> {
  return postJson<TokenPayload>('/auth/register', input);
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
