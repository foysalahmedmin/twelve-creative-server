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

export type TContentSection = {
  title?: string;
  subtitle?: string;
  body?: string;
  image?: string;
};

export type TSiteSetting = {
  _id?: Types.ObjectId | string;
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  social?: TSiteSocials;
  booking_notification_email?: string;
  faq_section?: TFaqSection;
  calendly_url?: string;
  process_thumbnail?: string;
  how_we_structure_image?: string;
  meeting_scene_image?: string;
  content_section?: TContentSection;
};

export interface TSiteSettingDocument extends TSiteSetting, Document {
  _id: Types.ObjectId;
}

export type TSiteSettingModel = Model<TSiteSettingDocument>;
