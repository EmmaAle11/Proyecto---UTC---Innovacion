import { Injectable } from '@nestjs/common';
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
  realm_access?: { roles?: string[] };
}

/**
 * Valida tokens emitidos por Keycloak: firma verificada contra el JWKS del realm
 * (clave pública RS256) + issuer. Expone sub/email/roles del realm. Ver rules §6.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService) {
    const baseUrl = config.getOrThrow<string>('KEYCLOAK_URL');
    const realm = config.getOrThrow<string>('KEYCLOAK_REALM');
    const issuer = `${baseUrl}/realms/${realm}`;
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      issuer,
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksUri: `${issuer}/protocol/openid-connect/certs`,
      }),
    });
  }

  validate(payload: KeycloakJwtPayload): JwtUser {
    return {
      sub: payload.sub,
      email: payload.email,
      roles: payload.realm_access?.roles ?? [],
    };
  }
}
