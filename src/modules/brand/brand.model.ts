import mongoose, { Query, Schema } from 'mongoose';
import { TBrand, TBrandDocument, TBrandModel } from './brand.type';

const brandSchema = new Schema<TBrandDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    logo: {
      type: String,
      required: [true, 'Logo URL is required'],
      trim: true,
    },
    href: { type: String, trim: true, maxlength: 1024 },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

brandSchema.index({ is_active: 1 });
brandSchema.index({ order: 1 });

brandSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

brandSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TBrand, TBrand>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

brandSchema.statics.isBrandExist = async function (_id: string) {
  return await this.findById(_id);
};

brandSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Brand = mongoose.model<TBrandDocument, TBrandModel>(
  'Brand',
  brandSchema,
);
