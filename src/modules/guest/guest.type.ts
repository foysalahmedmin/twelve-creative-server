import { Document, Model, Types } from 'mongoose';

export type TGuestPreferences = {
  theme?: 'light' | 'dark' | 'system';
  timezone?: string;
  language?: string;
};

export type TGuest = {
  _id?: Types.ObjectId | string;
  token: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
  fingerprint?: string;
  preferences: TGuestPreferences;
  created_at?: Date | string;
  updated_at?: Date | string;
};

export interface TGuestDocument extends TGuest, Document {
  _id: Types.ObjectId;
}

export type TGuestModel = Model<TGuestDocument>;
