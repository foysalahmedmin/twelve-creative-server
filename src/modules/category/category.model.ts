import mongoose, { Query, Schema } from 'mongoose';
import { TCategory, TCategoryDocument, TCategoryModel } from './category.type';

const categorySchema = new Schema<TCategoryDocument>(
  {
    icon: { type: String },
    name: {
      type: String,
      required: [true, 'Name is required'],
      unique: true,
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    sequence: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    tags: { type: [String], default: [] },
    layout: { type: String, default: 'default' },
    is_featured: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

categorySchema.index({ status: 1 });
categorySchema.index({ is_featured: 1 });
categorySchema.index({ sequence: 1 });

categorySchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

categorySchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TCategory, TCategory>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

categorySchema.statics.isCategoryExist = async function (_id: string) {
  return await this.findById(_id);
};

categorySchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Category = mongoose.model<TCategoryDocument, TCategoryModel>(
  'Category',
  categorySchema,
);
