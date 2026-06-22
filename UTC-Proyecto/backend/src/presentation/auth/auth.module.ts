import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from '../../application/auth/auth.service';
import { KeycloakAdminService } from '../../infrastructure/keycloak/keycloak-admin.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, KeycloakAdminService],
})
export class AuthModule {}
