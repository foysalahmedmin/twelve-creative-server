import mongoose, { Query, Schema } from 'mongoose';
import {
  isSafeImageReference,
  isSafeVideoReference,
} from '../cms-content/cms-content.security';
import {
  TTestimonial,
  TTestimonialDocument,
  TTestimonialModel,
} from './testimonial.type';

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
  },
  { _id: false },
);

const testimonialSchema = new Schema<TTestimonialDocument>(
  {
    industry: {
      type: Schema.Types.ObjectId,
      ref: 'Industry',
      required: [true, 'Industry is required'],
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    designation: {
      type: String,
      required: [true, 'Designation is required'],
      trim: true,
      maxlength: [120, 'Designation cannot exceed 120 characters'],
    },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Invalid testimonial image reference',
      },
    },
    category: {
      type: String,
      enum: ['message', 'video_message'],
      required: [true, 'Category is required'],
    },
    message: {
      type: String,
      trim: true,
      maxlength: [400, 'Message cannot exceed 400 characters'],
    },
    video_message: {
      type: videoRefSchema,
      default: undefined,
    },
    thumbnail: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Invalid testimonial thumbnail reference',
      },
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

testimonialSchema.pre('validate', function () {
  if (this.category === 'message') {
    if (!this.message?.trim() || this.message.trim().length < 10) {
      this.invalidate(
        'message',
        'Message text is required (min 10 chars) for a text testimonial',
      );
    }
    return;
  }

  if (!this.video_message?.value?.trim()) {
    this.invalidate(
      'video_message',
      'Video is required for a video testimonial',
    );
  } else if (
    this.video_message.source !== 'youtube' &&
    !this.thumbnail?.trim()
  ) {
    this.invalidate(
      'thumbnail',
      'Thumbnail is required for URL and uploaded video testimonials',
    );
  }
});

testimonialSchema.index({ industry: 1, is_active: 1, order: 1 });
testimonialSchema.index({ order: 1 });
testimonialSchema.index({ category: 1 });
testimonialSchema.index({ created_at: -1 });

testimonialSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

testimonialSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TTestimonial, TTestimonial>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

testimonialSchema.statics.isTestimonialExist = async function (_id: string) {
  return await this.findById(_id);
};

testimonialSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Testimonial = mongoose.model<
  TTestimonialDocument,
  TTestimonialModel
>('Testimonial', testimonialSchema);
