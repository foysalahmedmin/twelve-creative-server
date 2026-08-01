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

export type TSectionCopy = {
  label?: string;
  title?: string;
  description?: string;
};

export type TContactPageContent = {
  inquiry?: TSectionCopy;
  booking?: TSectionCopy;
  map?: TSectionCopy;
};

export type TFooterContent = {
  description?: string;
  cta_text?: string;
  cta_label?: string;
  cta_href?: string;
};

export type TSiteSetting = {
  _id?: Types.ObjectId | string;
  singleton_key?: 'singleton';
  contact_email?: string;
  contact_phone?: string;
  contact_address?: string;
  contact_whatsapp?: string;
  contact_map_embed_url?: string;
  social?: TSiteSocials;
  booking_notification_email?: string;
  faq_section?: TFaqSection;
  calendly_url?: string;
  process_thumbnail?: string;
  meeting_scene_image?: string;
  content_section?: TContentSection;
  contact_page?: TContactPageContent;
  footer?: TFooterContent;
};

/**
 * Admin read shape. `notification_recipients_effective` is derived, never
 * stored: it answers "where would a lead notification actually land right
 * now", including the configured fallback when the field is left empty.
 */
export type TAdminSiteSetting = TSiteSetting & {
  notification_recipients_effective: string[];
};

export type TPublicSiteSetting = Pick<
  TSiteSetting,
  | 'contact_email'
  | 'contact_phone'
  | 'contact_address'
  | 'contact_whatsapp'
  | 'contact_map_embed_url'
  | 'social'
  | 'faq_section'
  | 'calendly_url'
  | 'process_thumbnail'
  | 'meeting_scene_image'
  | 'content_section'
  | 'contact_page'
  | 'footer'
>;

export interface TSiteSettingDocument extends TSiteSetting, Document {
  _id: Types.ObjectId;
}

export type TSiteSettingModel = Model<TSiteSettingDocument>;
