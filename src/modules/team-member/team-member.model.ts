import mongoose, { Query, Schema } from 'mongoose';
import {
  TTeamMember,
  TTeamMemberDocument,
  TTeamMemberModel,
} from './team-member.type';

const socialsSchema = new Schema(
  {
    linkedin: { type: String, trim: true },
    instagram: { type: String, trim: true },
    x: { type: String, trim: true },
  },
  { _id: false },
);

const teamMemberSchema = new Schema<TTeamMemberDocument>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      trim: true,
      minlength: 2,
      maxlength: 120,
    },
    bio: { type: String, trim: true, maxlength: 240 },
    image: {
      type: String,
      required: [true, 'Image is required'],
      trim: true,
    },
    socials: { type: socialsSchema, default: undefined },
    order: { type: Number, default: 0 },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

teamMemberSchema.index({ is_active: 1 });
teamMemberSchema.index({ order: 1 });

teamMemberSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

teamMemberSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TTeamMember, TTeamMember>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

teamMemberSchema.statics.isTeamMemberExist = async function (_id: string) {
  return await this.findById(_id);
};

teamMemberSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const TeamMember = mongoose.model<TTeamMemberDocument, TTeamMemberModel>(
  'TeamMember',
  teamMemberSchema,
);
