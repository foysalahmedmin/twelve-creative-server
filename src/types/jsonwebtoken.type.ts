export type TRole = 'admin' | 'editor';

export type TJwtPayload = {
  _id: string;
  name: string;
  email: string;
  image?: string;
  role?: TRole;
  is_verified?: boolean;
  token_version?: number;
};
