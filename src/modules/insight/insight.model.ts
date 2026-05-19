import mongoose, { Query, Schema } from 'mongoose';
import { TInsight, TInsightDocument, TInsightModel } from './insight.type';

const insightSchema = new Schema<TInsightDocument>(
  {
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 2,
      maxlength: 160,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 4,
      maxlength: 160,
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      minlength: 10,
      maxlength: 280,
    },
    cover: {
      type: String,
      required: [true, 'Cover image is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true,
      minlength: 50,
    },
    category: { type: String, trim: true, maxlength: 80 },
    read_minutes: { type: Number, default: 0 },
    author: { type: Schema.Types.ObjectId, ref: 'TeamMember' },
    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
    published_at: { type: Date },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

insightSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: { $ne: true } },
    name: 'unique_insight_slug_not_deleted',
  },
);
insightSchema.index({ status: 1 });
insightSchema.index({ published_at: -1 });
insightSchema.index({ created_at: -1 });

insightSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

insightSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TInsight, TInsight>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

// Auto-compute read time from content length (~200 words/min)
insightSchema.pre('save', function (next) {
  if (this.isModified('content') && this.content) {
    const words = this.content.trim().split(/\s+/).length;
    this.read_minutes = Math.max(1, Math.round(words / 200));
  }
  if (
    this.isModified('status') &&
    this.status === 'published' &&
    !this.published_at
  ) {
    this.published_at = new Date();
  }
  next();
});

insightSchema.statics.isInsightExist = async function (_id: string) {
  return await this.findById(_id);
};

insightSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Insight = mongoose.model<TInsightDocument, TInsightModel>(
  'Insight',
  insightSchema,
);
