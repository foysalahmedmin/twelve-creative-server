export enum UserRole {
  ADMIN = 'admin',
  EDITOR = 'editor',
}

export type TUserRole = `${UserRole}`;

export const USER_ROLES = Object.values(UserRole) as TUserRole[];
