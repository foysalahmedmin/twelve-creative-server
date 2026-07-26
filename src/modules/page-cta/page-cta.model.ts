import mongoose, { Schema } from 'mongoose';
import {
  isSafeImageReference,
  isSafeLinkReference,
} from '../cms-content/cms-content.security';
import {
  PAGE_CTA_PLACEMENTS,
  TPageCtaDocument,
  TPageCtaModel,
} from './page-cta.type';

const ctaLinkSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    href: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeLinkReference,
        message: 'CTA link must use a safe supported URL or application path',
      },
    },
  },
  { _id: false },
);

const pageCtaSchema = new Schema<TPageCtaDocument>(
  {
    placement: {
      type: String,
      enum: PAGE_CTA_PLACEMENTS,
      required: true,
      trim: true,
    },
    industry: {
      type: Schema.Types.ObjectId,
      ref: 'Industry',
      default: null,
    },
    eyebrow: { type: String, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1200,
    },
    image: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'CTA image must be a safe HTTP(S) URL or application path',
      },
    },
    primary_cta: { type: ctaLinkSchema, required: true },
    secondary_cta: { type: ctaLinkSchema, default: null },
    is_active: { type: Boolean, default: true, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

pageCtaSchema.index(
  { placement: 1, industry: 1 },
  { unique: true, name: 'unique_page_cta_placement_industry' },
);
pageCtaSchema.index({ placement: 1, is_active: 1 });

export const PageCta = mongoose.model<TPageCtaDocument, TPageCtaModel>(
  'PageCta',
  pageCtaSchema,
);
