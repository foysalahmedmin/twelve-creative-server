import mongoose, { Schema } from 'mongoose';
import {
  isEmbeddableMapUrl,
  isHttpUrl,
  isSafeImageReference,
  isSafeLinkReference,
} from '../cms-content/cms-content.security';
import {
  TSiteSetting,
  TSiteSettingDocument,
  TSiteSettingModel,
} from './site-setting.type';

export const SITE_SETTING_SINGLETON_KEY = 'singleton' as const;

export class SiteSettingSingletonIntegrityError extends Error {
  constructor(recordCount: number) {
    super(
      `SiteSetting singleton integrity violation: found ${recordCount} records; resolve duplicate legacy records before reading or updating settings`,
    );
    this.name = 'SiteSettingSingletonIntegrityError';
  }
}

const optionalSafeValidator = (
  validator: (value: string) => boolean,
  message: string,
) => ({
  validator: (value?: string) => !value || validator(value),
  message,
});

const httpUrlValidator = optionalSafeValidator(
  isHttpUrl,
  'URL must use HTTP(S)',
);
const embeddableMapUrlValidator = optionalSafeValidator(
  isEmbeddableMapUrl,
  'This is a Google Maps link, not an embed link, so it will refuse to load.',
);
const imageValidator = optionalSafeValidator(
  isSafeImageReference,
  'Image must be a safe HTTP(S) URL or absolute application path',
);
const linkValidator = optionalSafeValidator(
  isSafeLinkReference,
  'Link must use a safe supported URL or application path',
);

const socialsSchema = new Schema(
  {
    instagram: { type: String, trim: true, validate: httpUrlValidator },
    linkedin: { type: String, trim: true, validate: httpUrlValidator },
    youtube: { type: String, trim: true, validate: httpUrlValidator },
    x: { type: String, trim: true, validate: httpUrlValidator },
    facebook: { type: String, trim: true, validate: httpUrlValidator },
  },
  { _id: false },
);

const faqSectionSchema = new Schema(
  {
    image: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: imageValidator,
    },
    image_alt: { type: String, trim: true, maxlength: 200 },
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 800 },
    name: { type: String, trim: true, maxlength: 100 },
    position: { type: String, trim: true, maxlength: 100 },
    contact_link: {
      type: String,
      trim: true,
      maxlength: 500,
      validate: linkValidator,
    },
  },
  { _id: false },
);

const contentSectionSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 200 },
    subtitle: { type: String, trim: true, maxlength: 100 },
    body: { type: String, trim: true, maxlength: 1000 },
    image: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: imageValidator,
    },
  },
  { _id: false },
);

const sectionCopySchema = new Schema(
  {
    label: { type: String, trim: true, maxlength: 100 },
    title: { type: String, trim: true, maxlength: 240 },
    description: { type: String, trim: true, maxlength: 1200 },
  },
  { _id: false },
);

const contactPageSchema = new Schema(
  {
    inquiry: { type: sectionCopySchema, default: () => ({}) },
    booking: { type: sectionCopySchema, default: () => ({}) },
    map: { type: sectionCopySchema, default: () => ({}) },
  },
  { _id: false },
);

const footerSchema = new Schema(
  {
    description: { type: String, trim: true, maxlength: 800 },
    cta_text: { type: String, trim: true, maxlength: 240 },
    cta_label: { type: String, trim: true, maxlength: 80 },
    cta_href: {
      type: String,
      trim: true,
      maxlength: 500,
      validate: linkValidator,
    },
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
    contact_whatsapp: { type: String, trim: true, maxlength: 40 },
    contact_map_embed_url: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: embeddableMapUrlValidator,
    },
    social: { type: socialsSchema, default: () => ({}) },
    // Comma-separated recipient list, so several people can be notified.
    // Wider than a single-address field to hold the full list.
    booking_notification_email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 500,
    },
    faq_section: { type: faqSectionSchema, default: () => ({}) },
    calendly_url: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: httpUrlValidator,
    },
    process_thumbnail: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: imageValidator,
    },
    meeting_scene_image: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: imageValidator,
    },
    content_section: { type: contentSectionSchema, default: () => ({}) },
    contact_page: { type: contactPageSchema, default: () => ({}) },
    footer: { type: footerSchema, default: () => ({}) },
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
  const recordCount = await SiteSetting.countDocuments({});
  if (recordCount > 1) {
    throw new SiteSettingSingletonIntegrityError(recordCount);
  }

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

/**
 * Returns the managed Mongoose document for writes. The ensure call performs
 * legacy migration and duplicate detection; the fixed key prevents an update
 * from ever landing on an arbitrary legacy record.
 */
export const getOrCreateSiteSettingDocument =
  async (): Promise<TSiteSettingDocument> => {
    await getOrCreateSiteSetting();
    const canonical = await SiteSetting.findOne({
      singleton_key: SITE_SETTING_SINGLETON_KEY,
    });
    if (!canonical) {
      throw new Error('Failed to resolve the canonical site settings document');
    }
    const recordCount = await SiteSetting.countDocuments({});
    if (recordCount > 1) {
      throw new SiteSettingSingletonIntegrityError(recordCount);
    }
    return canonical;
  };

export const SiteSetting = mongoose.model<
  TSiteSettingDocument,
  TSiteSettingModel
>('SiteSetting', siteSettingSchema);
