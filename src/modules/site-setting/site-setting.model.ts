import mongoose, { Schema } from 'mongoose';
import {
  TSiteSetting,
  TSiteSettingDocument,
  TSiteSettingModel,
} from './site-setting.type';

export const SITE_SETTING_SINGLETON_KEY = 'singleton' as const;

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
    singleton_key: {
      type: String,
      enum: [SITE_SETTING_SINGLETON_KEY],
      default: SITE_SETTING_SINGLETON_KEY,
      unique: true,
      select: false,
    },
    contact_email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 200,
    },
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

const withoutSingletonKey = (
  setting: TSiteSetting & { singleton_key?: string },
): TSiteSetting => {
  const { singleton_key: _singletonKey, ...publicSetting } = setting;
  return publicSetting as TSiteSetting;
};

/**
 * Preserve and backfill the existing legacy singleton, while making first-time
 * creation an atomic upsert guarded by a unique key.
 */
export const getOrCreateSiteSetting = async (): Promise<TSiteSetting> => {
  const canonical = await SiteSetting.findOne({
    singleton_key: SITE_SETTING_SINGLETON_KEY,
  })
    .select('+singleton_key')
    .lean();
  if (canonical) return withoutSingletonKey(canonical);

  const legacy = await SiteSetting.findOne().select('+singleton_key').lean();
  if (legacy) {
    const migrated = await SiteSetting.findOneAndUpdate(
      {
        _id: legacy._id,
        singleton_key: { $ne: SITE_SETTING_SINGLETON_KEY },
      },
      { $set: { singleton_key: SITE_SETTING_SINGLETON_KEY } },
      { new: true, runValidators: true },
    )
      .select('+singleton_key')
      .lean();

    if (migrated) return withoutSingletonKey(migrated);

    // Another request may have completed the same migration first.
    const concurrentlyMigrated = await SiteSetting.findOne({
      singleton_key: SITE_SETTING_SINGLETON_KEY,
    })
      .select('+singleton_key')
      .lean();
    if (concurrentlyMigrated) {
      return withoutSingletonKey(concurrentlyMigrated);
    }
  }

  const created = await SiteSetting.findOneAndUpdate(
    { singleton_key: SITE_SETTING_SINGLETON_KEY },
    { $setOnInsert: { singleton_key: SITE_SETTING_SINGLETON_KEY } },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    },
  )
    .select('+singleton_key')
    .lean();

  return withoutSingletonKey(created!);
};

export const SiteSetting = mongoose.model<
  TSiteSettingDocument,
  TSiteSettingModel
>('SiteSetting', siteSettingSchema);
