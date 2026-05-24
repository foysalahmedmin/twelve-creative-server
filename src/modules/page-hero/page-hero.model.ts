import mongoose, { Schema } from 'mongoose';
import {
  PAGE_KEYS,
  TPageHeroDocument,
  TPageHeroModel,
} from './page-hero.type';

const videoRefSchema = new Schema(
  {
    source: {
      type: String,
      enum: ['youtube', 'url', 'upload'],
      required: true,
    },
    value: { type: String, required: true, trim: true, maxlength: 2048 },
    poster: { type: String, trim: true, maxlength: 2048 },
  },
  { _id: false },
);

const ctaSchema = new Schema(
  {
    label: { type: String, trim: true, maxlength: 80 },
    href: { type: String, trim: true, maxlength: 500 },
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
    video: { type: videoRefSchema },
    trust_label: { type: String, trim: true, maxlength: 100 },
    primary_cta: { type: ctaSchema },
    secondary_cta: { type: ctaSchema },
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
