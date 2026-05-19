import mongoose, { Query, Schema } from 'mongoose';
import { TBooking, TBookingDocument, TBookingModel } from './booking.type';

const bookingSchema = new Schema<TBookingDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      maxlength: [200, 'Email is too long'],
    },
    phone: { type: String, trim: true, maxlength: 40 },
    company: { type: String, trim: true, maxlength: 160 },
    industry: { type: String, trim: true, maxlength: 120 },
    timeline: { type: String, trim: true, maxlength: 80 },
    preferred_date: { type: Date },
    preferred_time: { type: String, trim: true, maxlength: 40 },
    message: { type: String, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ['pending', 'in_progress', 'completed', 'cancelled'],
      default: 'pending',
    },
    internal_note: { type: String, trim: true, maxlength: 2000 },
    source: { type: String, enum: ['booking_form'], default: 'booking_form' },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

bookingSchema.index({ status: 1 });
bookingSchema.index({ created_at: -1 });
bookingSchema.index({ email: 1 });

bookingSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

bookingSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TBooking, TBooking>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

bookingSchema.statics.isBookingExist = async function (_id: string) {
  return await this.findById(_id);
};

bookingSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Booking = mongoose.model<TBookingDocument, TBookingModel>(
  'Booking',
  bookingSchema,
);
