import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthMeController } from './auth-me.controller';
import { AuthService } from '../../application/auth/auth.service';
import { KeycloakAdminService } from '../../infrastructure/keycloak/keycloak-admin.service';
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfileEntity])],
  controllers: [AuthController, AuthMeController],
  providers: [AuthService, KeycloakAdminService],
})
export class AuthModule {}
