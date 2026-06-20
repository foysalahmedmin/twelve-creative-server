import mongoose, { Schema } from 'mongoose';
import {
  TSiteSetting,
  TSiteSettingDocument,
  TSiteSettingModel,
} from './site-setting.type';

const socialsSchema = new Schema(
  {
    instagram: { type: String, trim: true },
    linkedin: { type: String, trim: true },
    youtube: { type: String, trim: true },
    x: { type: String, trim: true },
    facebook: { type: String, trim: true },
  },
  { _id: false },
);

const faqSectionSchema = new Schema(
  {
    image: { type: String, trim: true, maxlength: 2048 },
    image_alt: { type: String, trim: true, maxlength: 200 },
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 800 },
    name: { type: String, trim: true, maxlength: 100 },
    position: { type: String, trim: true, maxlength: 100 },
    contact_link: { type: String, trim: true, maxlength: 500 },
  },
  { _id: false },
);

const contentSectionSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 100 },
    body: { type: String, trim: true, maxlength: 1000 },
    image: { type: String, trim: true, maxlength: 2048 },
  },
  { _id: false },
);

const siteSettingSchema = new Schema<TSiteSettingDocument>(
  {
    contact_email: { type: String, trim: true, lowercase: true, maxlength: 200 },
    contact_phone: { type: String, trim: true, maxlength: 40 },
    contact_address: { type: String, trim: true, maxlength: 400 },
    social: { type: socialsSchema, default: () => ({}) },
    booking_notification_email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
    faq_section: { type: faqSectionSchema, default: () => ({}) },
    calendly_url: { type: String, trim: true, maxlength: 2048 },
    process_thumbnail: { type: String, trim: true, maxlength: 2048 },
    how_we_structure_image: { type: String, trim: true, maxlength: 2048 },
    meeting_scene_image: { type: String, trim: true, maxlength: 2048 },
    content_section: { type: contentSectionSchema, default: () => ({}) },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const SITE_SETTING_SINGLETON_KEY = 'singleton';

/** Ensures only one document exists by always using the same _id-less ensure. */
export const getOrCreateSiteSetting = async (): Promise<TSiteSetting> => {
  const existing = await SiteSetting.findOne().lean();
  if (existing) return existing;
  const created = await SiteSetting.create({});
  return created.toObject();
};

export const SiteSetting = mongoose.model<
  TSiteSettingDocument,
  TSiteSettingModel
>('SiteSetting', siteSettingSchema);
