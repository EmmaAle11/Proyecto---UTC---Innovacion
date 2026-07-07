import { UserProfileEntity } from '../../infrastructure/database/entities/user-profile.entity';
import { UserRole } from '../../infrastructure/database/entities/enums';

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
