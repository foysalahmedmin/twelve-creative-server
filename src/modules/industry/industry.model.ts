import mongoose, { Query, Schema } from 'mongoose';
import { TIndustry, TIndustryDocument, TIndustryModel } from './industry.type';

const ICON_KEYS = [
  'hospitality',
  'real-estate',
  'aviation',
  'professional-services',
] as const;

const industryVideoRefSchema = new Schema(
  {
    source: {
      type: String,
      enum: ['youtube', 'url', 'upload'],
      required: true,
    },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const industrySchema = new Schema<TIndustryDocument>(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [2, 'Slug must be at least 2 characters'],
      maxlength: [80, 'Slug cannot exceed 80 characters'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    headline: {
      type: String,
      required: [true, 'Headline is required'],
      trim: true,
      minlength: [4, 'Headline must be at least 4 characters'],
      maxlength: [200, 'Headline cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [800, 'Description cannot exceed 800 characters'],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    icon: {
      type: String,
      enum: ICON_KEYS,
      default: 'hospitality',
      required: true,
    },
    work: {
      type: [String],
      default: [],
      validate: [
        (arr: string[]) => arr.length <= 12,
        'Work list cannot exceed 12 items',
      ],
    },
    cta_label: {
      type: String,
      trim: true,
      maxlength: [60, 'CTA label cannot exceed 60 characters'],
    },
    cta_href: {
      type: String,
      trim: true,
      maxlength: [500, 'CTA href cannot exceed 500 characters'],
    },
    tagline: {
      type: String,
      trim: true,
      maxlength: [120, 'Tagline cannot exceed 120 characters'],
    },
    thumbnail: {
      type: String,
      trim: true,
      maxlength: [2048, 'Thumbnail URL cannot exceed 2048 characters'],
    },
    video: {
      type: industryVideoRefSchema,
    },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

industrySchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: { $ne: true } },
    name: 'unique_industry_slug_not_deleted',
  },
);
industrySchema.index({ is_active: 1 });
industrySchema.index({ order: 1 });
industrySchema.index({ created_at: -1 });

industrySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

industrySchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TIndustry, TIndustry>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

industrySchema.statics.isIndustryExist = async function (_id: string) {
  return await this.findById(_id);
};

industrySchema.statics.isIndustryExistBySlug = async function (slug: string) {
  return await this.findOne({ slug });
};

industrySchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Industry = mongoose.model<TIndustryDocument, TIndustryModel>(
  'Industry',
  industrySchema,
);
