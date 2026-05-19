import mongoose, { Query, Schema } from 'mongoose';
import { TFaq, TFaqDocument, TFaqModel } from './faq.type';

const faqSchema = new Schema<TFaqDocument>(
  {
    question: {
      type: String,
      required: [true, 'Question is required'],
      trim: true,
      minlength: 4,
      maxlength: 200,
    },
    answer: {
      type: String,
      required: [true, 'Answer is required'],
      trim: true,
      minlength: 4,
      maxlength: 1500,
    },
    group: { type: String, trim: true, maxlength: 80 },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

faqSchema.index({ is_active: 1 });
faqSchema.index({ order: 1 });
faqSchema.index({ group: 1 });

faqSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

faqSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TFaq, TFaq>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

faqSchema.statics.isFaqExist = async function (_id: string) {
  return await this.findById(_id);
};

faqSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Faq = mongoose.model<TFaqDocument, TFaqModel>('Faq', faqSchema);
