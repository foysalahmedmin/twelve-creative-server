import { Document, Model, Types } from 'mongoose';
import { TRole } from '../../types/jsonwebtoken.type';

export type TStatus = 'in-progress' | 'blocked';
export type TAuthSource = 'email' | 'google';

export type TUser = {
  _id?: Types.ObjectId | string;
  image?: string;
  name: string;
  email: string;
  password?: string;
  google_id?: string;
  auth_source: TAuthSource;
  password_changed_at?: Date;
  token_version?: number;
  role: TRole;
  status: TStatus;
  is_verified: boolean;
  is_deleted: boolean;
};

export interface TUserDocument extends TUser, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TUserDocument | null>;
}

export type TUserModel = Model<TUserDocument> & {
  isUserExist(_id: string): Promise<TUserDocument | null>;
  isUserExistByEmail(email: string): Promise<TUserDocument | null>;
};
