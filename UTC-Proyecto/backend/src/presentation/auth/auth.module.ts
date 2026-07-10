import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthMeController } from './auth-me.controller';
import { AuthService } from '../../application/auth/auth.service';
import { KeycloakAdminService } from '../../infrastructure/keycloak/keycloak-admin.service';
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import { USER_PROFILE_REPOSITORY } from '../../application/auth/user-profile.repository.port';
import { TypeOrmUserProfileRepository } from '../../infrastructure/database/repositories/typeorm-user-profile.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserProfileEntity])],
  controllers: [AuthController, AuthMeController],
  providers: [
    AuthService,
    KeycloakAdminService,
    { provide: USER_PROFILE_REPOSITORY, useClass: TypeOrmUserProfileRepository },
  ],
})
export class AuthModule {}
