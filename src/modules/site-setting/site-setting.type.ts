import { Document, Model, Types } from 'mongoose';

export type TSiteSocials = {
  instagram?: string;
  linkedin?: string;
  youtube?: string;
  x?: string;
  facebook?: string;
};

export type TFaqSection = {
  image?: string;
  image_alt?: string;
  title?: string;
  description?: string;
  name?: string;
  position?: string;
  contact_link?: string;
};

export type TSiteSetting = {
  _id?: Types.ObjectId | string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  social?: TSiteSocials;
  booking_notification_email?: string;
  faq_section?: TFaqSection;
};

export interface TSiteSettingDocument extends TSiteSetting, Document {
  _id: Types.ObjectId;
}

export type TSiteSettingModel = Model<TSiteSettingDocument>;
