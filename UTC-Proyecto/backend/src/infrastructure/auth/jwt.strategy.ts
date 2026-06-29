import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';

/** Usuario autenticado que queda en `request.user` tras validar el JWT. */
export interface JwtUser {
  sub: string;
  email?: string;
  roles: string[];
}

interface KeycloakJwtPayload {
  sub: string;
  email?: string;
  azp?: string; // authorized party = client al que se emitió el token
  realm_access?: { roles?: string[] };
}

/**
 * Valida tokens emitidos por Keycloak: firma verificada contra el JWKS del realm
 * (clave pública RS256) + issuer. Expone sub/email/roles del realm. Ver rules §6.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  private readonly expectedAzp: string;

  constructor(config: ConfigService) {
    const baseUrl = config.getOrThrow<string>('KEYCLOAK_URL');
    const realm = config.getOrThrow<string>('KEYCLOAK_REALM');
    const issuer = `${baseUrl}/realms/${realm}`;
    const clientId = config.getOrThrow<string>('KEYCLOAK_CLIENT_ID');
    // Validación de `aud` (defensa OIDC canónica), OPT-IN por env: si `KEYCLOAK_AUDIENCE`
    // está definida, el token debe incluir ese audience; si no, se conserva el
    // comportamiento actual (firma+JWKS+issuer+azp) sin riesgo de romper el login.
    // Para activarla: configurar el client en Keycloak para emitir ese `aud` y verificar
    // con un token real antes de fijar la variable.
    const audience = config.get<string>('KEYCLOAK_AUDIENCE');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer,
      ...(audience ? { audience } : {}),
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `${issuer}/protocol/openid-connect/certs`,
      }),
    });
    this.expectedAzp = clientId;
  }

  validate(payload: KeycloakJwtPayload): JwtUser {
    // Endurecimiento OIDC: el token debe haberse emitido para el client de la app
    // (azp = authorized party). Rechaza tokens de otros clients del realm.
    if (payload.azp !== this.expectedAzp) {
      throw new UnauthorizedException(
        'Token emitido para un cliente no autorizado',
      );
    }
    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.realm_access?.roles ?? [],
    };
  }
}
