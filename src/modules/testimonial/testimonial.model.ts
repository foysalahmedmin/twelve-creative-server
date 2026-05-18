import mongoose, { Query, Schema } from 'mongoose';
import {
  TTestimonial,
  TTestimonialDocument,
  TTestimonialModel,
} from './testimonial.type';

const testimonialSchema = new Schema<TTestimonialDocument>(
  {
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
      type: String,
      trim: true,
    },
    thumbnail: {
      type: String,
      trim: true,
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

testimonialSchema.index({ is_active: 1 });
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
