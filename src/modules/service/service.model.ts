import mongoose, { Query, Schema } from 'mongoose';
import { TService, TServiceDocument, TServiceModel } from './service.type';

const ICON_KEYS = [
  'positioning',
  'creative',
  'distribution',
  'websites',
  'automation',
  'growth',
] as const;

const serviceSchema = new Schema<TServiceDocument>(
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
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      minlength: [10, 'Description must be at least 10 characters'],
      maxlength: [600, 'Description cannot exceed 600 characters'],
    },
    highlights: {
      type: [String],
      default: [],
      validate: [
        (arr: string[]) => arr.length <= 8,
        'Highlights cannot exceed 8 items',
      ],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    icon: {
      type: String,
      enum: ICON_KEYS,
      default: 'positioning',
      required: true,
    },
    href: {
      type: String,
      trim: true,
      maxlength: [500, 'Href cannot exceed 500 characters'],
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

serviceSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: { $ne: true } },
    name: 'unique_service_slug_not_deleted',
  },
);
serviceSchema.index({ is_active: 1 });
serviceSchema.index({ order: 1 });
serviceSchema.index({ created_at: -1 });

serviceSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

serviceSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TService, TService>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

serviceSchema.statics.isServiceExist = async function (_id: string) {
  return await this.findById(_id);
};

serviceSchema.statics.isServiceExistBySlug = async function (slug: string) {
  return await this.findOne({ slug });
};

serviceSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Service = mongoose.model<TServiceDocument, TServiceModel>(
  'Service',
  serviceSchema,
);
