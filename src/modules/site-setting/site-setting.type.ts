import { Document, Model, Types } from 'mongoose';

export type TSiteSocials = {
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  x?: string;
  facebook?: string;
};

export type TSiteSetting = {
  _id?: Types.ObjectId | string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  social?: TSiteSocials;
  booking_notification_email?: string;
};

export interface TSiteSettingDocument extends TSiteSetting, Document {
  _id: Types.ObjectId;
}

export type TSiteSettingModel = Model<TSiteSettingDocument>;
