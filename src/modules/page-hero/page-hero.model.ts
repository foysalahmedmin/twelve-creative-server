import mongoose, { Schema } from 'mongoose';
import {
  isHttpUrl,
  isSafeImageReference,
  isSafeLinkReference,
  isSafeVideoReference,
} from '../cms-content/cms-content.security';
import { PAGE_KEYS, TPageHeroDocument, TPageHeroModel } from './page-hero.type';

const videoRefSchema = new Schema(
  {
    source: {
      type: String,
      enum: ['youtube', 'url', 'upload'],
      required: true,
    },
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
    poster: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Video poster must be a safe image reference',
      },
    },
  },
  { _id: false },
);

const ctaSchema = new Schema(
  {
    label: { type: String, trim: true, maxlength: 80 },
    href: {
      type: String,
      trim: true,
      maxlength: 500,
      validate: {
        validator: isSafeLinkReference,
        message: 'CTA link must use a safe supported URL or application path',
      },
    },
  },
  { _id: false },
);

const seoSchema = new Schema(
  {
    title: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 320 },
    og_image: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Open Graph image must be a safe image reference',
      },
    },
    canonical_url: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isHttpUrl,
        message: 'Canonical URL must use HTTP(S)',
      },
    },
    no_index: { type: Boolean, default: false },
  },
  { _id: false },
);

const pageHeroSchema = new Schema<TPageHeroDocument>(
  {
    page: {
      type: String,
      enum: PAGE_KEYS,
      required: true,
      unique: true,
      index: true,
    },
    label: { type: String, trim: true, maxlength: 80 },
    title: { type: String, trim: true, maxlength: 300 },
    description: { type: String, trim: true, maxlength: 600 },
    thumbnail: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Thumbnail must be a safe image reference',
      },
    },
    video: { type: videoRefSchema },
    trust_label: { type: String, trim: true, maxlength: 100 },
    primary_cta: { type: ctaSchema },
    secondary_cta: { type: ctaSchema },
    seo: { type: seoSchema, default: undefined },
    is_active: { type: Boolean, default: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const PageHero = mongoose.model<TPageHeroDocument, TPageHeroModel>(
  'PageHero',
  pageHeroSchema,
);
