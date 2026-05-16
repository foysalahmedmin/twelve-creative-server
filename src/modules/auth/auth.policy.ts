import { TRole } from '../../types/jsonwebtoken.type';

export const AUTH_CHANGE_PASSWORD_ROLES: TRole[] = ['admin', 'editor'];

export const AUTH_MANAGE_SESSIONS_ROLES: TRole[] = ['admin', 'editor'];

export const AUTH_IMPERSONATE_ROLES: TRole[] = ['admin'];
