import mongoose, { Query, Schema } from 'mongoose';
import {
  TShowcaseVideo,
  TShowcaseVideoDocument,
  TShowcaseVideoModel,
} from './showcase-video.type';

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

const showcaseVideoSchema = new Schema<TShowcaseVideoDocument>(
  {
    video: {
      type: videoRefSchema,
      required: [true, 'Video is required'],
    },
    thumbnail: {
      type: String,
      trim: true,
    },
    alt: {
      type: String,
      required: [true, 'Alt text is required'],
      trim: true,
      minlength: [2, 'Alt must be at least 2 characters'],
      maxlength: [180, 'Alt cannot exceed 180 characters'],
    },
    aspect: {
      type: String,
      enum: ['reel', 'landscape'],
      default: 'reel',
      required: true,
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

showcaseVideoSchema.index({ is_active: 1 });
showcaseVideoSchema.index({ aspect: 1 });
showcaseVideoSchema.index({ order: 1 });
showcaseVideoSchema.index({ created_at: -1 });

showcaseVideoSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

showcaseVideoSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TShowcaseVideo, TShowcaseVideo>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

showcaseVideoSchema.statics.isShowcaseVideoExist = async function (
  _id: string,
) {
  return await this.findById(_id);
};

showcaseVideoSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const ShowcaseVideo = mongoose.model<
  TShowcaseVideoDocument,
  TShowcaseVideoModel
>('ShowcaseVideo', showcaseVideoSchema);
