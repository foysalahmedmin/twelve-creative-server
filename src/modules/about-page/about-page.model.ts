import mongoose, { Schema } from 'mongoose';
import {
  isSafeImageReference,
  isSafeVideoReference,
} from '../cms-content/cms-content.security';
import { CMS_VIDEO_SOURCES } from '../cms-content/cms-content.type';
import { TAboutPageDocument, TAboutPageModel } from './about-page.type';

export const ABOUT_PAGE_SINGLETON_KEY = 'about' as const;

const stableIdField = {
  type: String,
  required: true,
  trim: true,
  maxlength: 64,
  match: /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
};

const videoRefSchema = new Schema(
  {
    source: { type: String, enum: CMS_VIDEO_SOURCES, required: true },
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: {
        validator(
          this: { source: 'youtube' | 'url' | 'upload' },
          value: string,
        ) {
          return isSafeVideoReference(this.source, value);
        },
        message: 'Invalid video reference for the selected source',
      },
    },
  },
  { _id: false },
);

const mediaSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    image: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Invalid image reference',
      },
    },
    video: { type: videoRefSchema },
    thumbnail: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Invalid thumbnail reference',
      },
    },
  },
  { _id: false },
);

mediaSchema.pre('validate', function () {
  if (this.type === 'image') {
    if (!this.image || this.video || this.thumbnail) {
      this.invalidate('type', 'Image media must contain only an image');
    }
  } else if (this.type === 'video' && (!this.video || this.image)) {
    this.invalidate('type', 'Video media must contain a video and no image');
  }
});

const sectionHeaderSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    is_visible: { type: Boolean, default: true, required: true },
  },
  { _id: false },
);

const valueCardSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    is_visible: { type: Boolean, default: true, required: true },
  },
  { _id: false },
);

const storyCardSchema = new Schema(
  {
    id: stableIdField,
    index: { type: String, required: true, match: /^\d{2}$/ },
    title: { type: String, required: true, trim: true, maxlength: 180 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1600,
    },
    media: { type: mediaSchema, required: true },
    is_visible: { type: Boolean, default: true, required: true },
  },
  { _id: false },
);

const founderSchema = new Schema(
  {
    eyebrow: { type: String, trim: true, maxlength: 100 },
    first_name: { type: String, required: true, trim: true, maxlength: 80 },
    last_name: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    biography: {
      type: [String],
      required: true,
      validate: {
        validator: (items: string[]) => items.length >= 1 && items.length <= 6,
        message: 'Founder biography must contain between 1 and 6 paragraphs',
      },
    },
    media: { type: mediaSchema, required: true },
    is_visible: { type: Boolean, default: true, required: true },
  },
  { _id: false },
);

const galleryItemSchema = new Schema(
  {
    id: stableIdField,
    index: { type: String, required: true, match: /^\d{2}$/ },
    alt: { type: String, required: true, trim: true, maxlength: 200 },
    media: { type: mediaSchema, required: true },
    is_visible: { type: Boolean, default: true, required: true },
  },
  { _id: false },
);

const aboutPageSchema = new Schema<TAboutPageDocument>(
  {
    singleton_key: {
      type: String,
      enum: [ABOUT_PAGE_SINGLETON_KEY],
      default: ABOUT_PAGE_SINGLETON_KEY,
      required: true,
      unique: true,
      select: false,
    },
    mission_section: { type: sectionHeaderSchema, required: true },
    mission: { type: valueCardSchema, required: true },
    vision: { type: valueCardSchema, required: true },
    story_section: { type: sectionHeaderSchema, required: true },
    story_cards: {
      type: [storyCardSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) =>
          items.length >= 1 && items.length <= 12,
        message: 'Story cards must contain between 1 and 12 items',
      },
    },
    founder: { type: founderSchema, required: true },
    gallery_section: { type: sectionHeaderSchema, required: true },
    gallery: {
      type: [galleryItemSchema],
      required: true,
      validate: {
        validator: (items: unknown[]) =>
          items.length >= 1 && items.length <= 24,
        message: 'Gallery must contain between 1 and 24 items',
      },
    },
    is_active: { type: Boolean, default: true, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const AboutPage = mongoose.model<TAboutPageDocument, TAboutPageModel>(
  'AboutPage',
  aboutPageSchema,
);
