import mongoose, { Query, Schema } from 'mongoose';
import {
  TFeaturedProject,
  TFeaturedProjectDocument,
  TFeaturedProjectModel,
} from './featured-project.type';

const videoRefSchema = new Schema(
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

const featuredProjectSchema = new Schema<TFeaturedProjectDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [2, 'Title must be at least 2 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      minlength: [2, 'Category must be at least 2 characters'],
      maxlength: [80, 'Category cannot exceed 80 characters'],
    },
    aspect: {
      type: String,
      enum: ['reel', 'landscape'],
      default: 'landscape',
      required: true,
    },
    thumbnail: {
      type: String,
      required: [true, 'Thumbnail is required'],
      trim: true,
    },
    video: {
      type: videoRefSchema,
      required: [true, 'Video is required'],
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

featuredProjectSchema.index({ is_active: 1 });
featuredProjectSchema.index({ category: 1 });
featuredProjectSchema.index({ order: 1 });
featuredProjectSchema.index({ created_at: -1 });

featuredProjectSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

featuredProjectSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TFeaturedProject, TFeaturedProject>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

featuredProjectSchema.statics.isFeaturedProjectExist = async function (
  _id: string,
) {
  return await this.findById(_id);
};

featuredProjectSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const FeaturedProject = mongoose.model<
  TFeaturedProjectDocument,
  TFeaturedProjectModel
>('FeaturedProject', featuredProjectSchema);
