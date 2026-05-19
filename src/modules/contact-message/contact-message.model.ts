import mongoose, { Query, Schema } from 'mongoose';
import {
  TContactMessage,
  TContactMessageDocument,
  TContactMessageModel,
} from './contact-message.type';

const contactMessageSchema = new Schema<TContactMessageDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      maxlength: 200,
    },
    phone: { type: String, trim: true, maxlength: 40 },
    subject: { type: String, trim: true, maxlength: 200 },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: 5,
      maxlength: 2000,
    },
    is_read: { type: Boolean, default: false },
    is_archived: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

contactMessageSchema.index({ is_read: 1 });
contactMessageSchema.index({ is_archived: 1 });
contactMessageSchema.index({ created_at: -1 });
contactMessageSchema.index({ email: 1 });

contactMessageSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

contactMessageSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TContactMessage, TContactMessage>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

contactMessageSchema.statics.isContactMessageExist = async function (
  _id: string,
) {
  return await this.findById(_id);
};

contactMessageSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const ContactMessage = mongoose.model<
  TContactMessageDocument,
  TContactMessageModel
>('ContactMessage', contactMessageSchema);
