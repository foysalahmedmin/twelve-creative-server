import mongoose, { Query, Schema } from 'mongoose';
import { TWork, TWorkDocument, TWorkModel } from './work.type';

const metricSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    value: { type: String, required: true, trim: true, maxlength: 60 },
    sub: { type: String, trim: true, maxlength: 120 },
  },
  { _id: false },
);

const heroStatSchema = new Schema(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    value: { type: String, required: true, trim: true, maxlength: 60 },
  },
  { _id: false },
);

const clientSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 160 },
    industry: { type: String, trim: true, maxlength: 120 },
    domain: { type: String, trim: true, maxlength: 200 },
    employees: { type: String, trim: true, maxlength: 60 },
    tags: { type: [String], default: [] },
    desc: { type: String, trim: true, maxlength: 1000 },
    logo: { type: String, trim: true },
  },
  { _id: false },
);

const challengeItemSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    desc: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

const solutionPhaseSchema = new Schema(
  {
    phase: { type: String, required: true, trim: true, maxlength: 160 },
    time: { type: String, trim: true, maxlength: 80 },
    desc: { type: String, required: true, trim: true, maxlength: 1000 },
  },
  { _id: false },
);

const testimonialSchema = new Schema(
  {
    quote: { type: String, required: true, trim: true, maxlength: 600 },
    avatar_url: { type: String, trim: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    role: { type: String, required: true, trim: true, maxlength: 160 },
  },
  { _id: false },
);

const videoRefSchema = new Schema(
  {
    source: {
      type: String,
      enum: ['youtube', 'url', 'upload'],
      required: true,
    },
    value: { type: String, required: true, trim: true },
  },
  { _id: false },
);

const workSchema = new Schema<TWorkDocument>(
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
    type: {
      type: String,
      required: [true, 'Type is required'],
      trim: true,
      maxlength: 80,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: 4,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: 1000,
    },
    image: {
      type: String,
      required: [true, 'Image URL is required'],
      trim: true,
    },
    image_alt: {
      type: String,
      required: [true, 'Image alt is required'],
      trim: true,
      maxlength: 200,
    },
    metrics: { type: [metricSchema], default: [] },
    tag_slugs: { type: [String], default: [] },
    hero_stats: { type: [heroStatSchema], default: [] },
    client: { type: clientSchema, default: undefined },
    situation_intro: { type: String, trim: true, maxlength: 2000 },
    challenge_intro: { type: String, trim: true, maxlength: 2000 },
    challenge_items: { type: [challengeItemSchema], default: [] },
    solution_intro: { type: String, trim: true, maxlength: 2000 },
    solution_phases: { type: [solutionPhaseSchema], default: [] },
    outcome_desc: { type: String, trim: true, maxlength: 2000 },
    outcome_video: { type: videoRefSchema, default: undefined },
    outcome_video_thumbnail: { type: String, trim: true },
    testimonial: { type: testimonialSchema, default: undefined },
    calendly_url: { type: String, trim: true, maxlength: 500 },
    order: { type: Number, default: 0 },
    is_published: { type: Boolean, default: false },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

workSchema.index(
  { slug: 1 },
  {
    unique: true,
    partialFilterExpression: { is_deleted: { $ne: true } },
    name: 'unique_slug_not_deleted',
  },
);
workSchema.index({ is_published: 1 });
workSchema.index({ order: 1 });
workSchema.index({ created_at: -1 });

workSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

workSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TWork, TWork>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

workSchema.statics.isWorkExist = async function (_id: string) {
  return await this.findById(_id);
};

workSchema.statics.isWorkExistBySlug = async function (slug: string) {
  return await this.findOne({ slug });
};

workSchema.methods.softDelete = async function () {
  this.is_deleted = true;
  this.deleted_at = new Date();
  return await this.save();
};

export const Work = mongoose.model<TWorkDocument, TWorkModel>(
  'Work',
  workSchema,
);
