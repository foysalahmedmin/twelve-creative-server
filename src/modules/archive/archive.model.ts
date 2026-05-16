import mongoose, { Query, Schema } from 'mongoose';
import { TPost, TPostDocument, TPostModel } from './archive.type';

const archiveSchema = new Schema<TPostDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
    },
    thumbnail: {
      type: Schema.Types.ObjectId,
      ref: 'File',
    },
    video: {
      type: Schema.Types.ObjectId,
      ref: 'File',
    },
    youtube: {
      type: String,
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    categories: {
      type: [Schema.Types.ObjectId],
      ref: 'Category',
      default: [],
    },
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User is required'],
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft',
    },
    type: {
      type: String,
      enum: ['video', 'podcast'],
      required: [true, 'Type is required'],
    },
    ratio: {
      type: String,
      trim: true,
    },
    is_featured: {
      type: Boolean,
      default: false,
    },
    is_deleted: {
      type: Boolean,
      default: false,
      select: false,
    },
    deleted_at: {
      type: Date,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

archiveSchema.index({ status: 1 });
archiveSchema.index({ type: 1 });
archiveSchema.index({ user: 1 });
archiveSchema.index({ categories: 1 });
archiveSchema.index({ is_featured: 1 });
archiveSchema.index({ created_at: -1 });

archiveSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

archiveSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TPost, TPost>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

archiveSchema.statics.isPostExist = async function (_id: string) {
  return await this.findById(_id);
};

archiveSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Archive = mongoose.model<TPostDocument, TPostModel>(
  'Archive',
  archiveSchema,
);
