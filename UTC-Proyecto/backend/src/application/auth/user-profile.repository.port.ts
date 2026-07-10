// Puerto de persistencia de perfiles. Habla en la entidad TypeORM como modelo compartido
// (tradeoff clásico anémico, D-041); su implementación vive en infrastructure/.
import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import { UserRole } from '../../domain/enums';

export interface IUserProfileRepository {
  findByKeycloakId(keycloakId: string): Promise<UserProfileEntity | null>;
  create(data: {
    keycloakId: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
  }): Promise<UserProfileEntity>;
}

export const USER_PROFILE_REPOSITORY = Symbol('IUserProfileRepository');
