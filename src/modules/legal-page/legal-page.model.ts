import mongoose, { Schema } from 'mongoose';
import { isSafeMarkdown } from '../cms-content/cms-content.security';
import {
  LEGAL_PAGE_SLUGS,
  TLegalPageDocument,
  TLegalPageModel,
} from './legal-page.type';

const seoSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false },
);

const legalPageSchema = new Schema<TLegalPageDocument>(
  {
    slug: {
      type: String,
      enum: LEGAL_PAGE_SLUGS,
      required: true,
      unique: true,
      trim: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    markdown: {
      type: String,
      required: true,
      trim: true,
      maxlength: 50000,
      validate: {
        validator: isSafeMarkdown,
        message: 'Markdown cannot contain raw HTML or unsafe protocols',
      },
    },
    effective_date: { type: Date, default: null },
    seo: { type: seoSchema, required: true },
    is_published: { type: Boolean, default: false, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

legalPageSchema.pre('validate', function () {
  if (this.is_published && !this.effective_date) {
    this.invalidate(
      'effective_date',
      'An effective date is required before publishing a legal page',
    );
  }
});

legalPageSchema.index({ is_published: 1, slug: 1 });

export const LegalPage = mongoose.model<TLegalPageDocument, TLegalPageModel>(
  'LegalPage',
  legalPageSchema,
);
