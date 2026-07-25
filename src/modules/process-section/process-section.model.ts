import mongoose, { Schema } from 'mongoose';
import {
  PROCESS_ICON_KEYS,
  TProcessSectionDocument,
  TProcessSectionModel,
  TProcessStep,
} from './process-section.type';

export const PROCESS_SECTION_SINGLETON_KEY = 'process' as const;

const processStepSchema = new Schema<TProcessStep>(
  {
    id: {
      type: String,
      required: true,
      trim: true,
      maxlength: 64,
      match: /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
    },
    index: {
      type: String,
      required: true,
      match: /^(0[1-9]|1[0-2])$/,
    },
    icon: { type: String, enum: PROCESS_ICON_KEYS, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 600,
    },
    image: { type: String, required: true, trim: true, maxlength: 2048 },
  },
  { _id: false },
);

const processSectionSchema = new Schema<TProcessSectionDocument>(
  {
    singleton_key: {
      type: String,
      enum: [PROCESS_SECTION_SINGLETON_KEY],
      default: PROCESS_SECTION_SINGLETON_KEY,
      required: true,
      unique: true,
      select: false,
    },
    label: { type: String, required: true, trim: true, maxlength: 80 },
    title: { type: String, required: true, trim: true, maxlength: 300 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    thumbnail: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
    },
    process_steps: {
      type: [processStepSchema],
      required: true,
      validate: {
        validator: (steps: TProcessStep[]) =>
          Array.isArray(steps) && steps.length >= 1 && steps.length <= 12,
        message: 'Process steps must contain between 1 and 12 items',
      },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

export const ProcessSection = mongoose.model<
  TProcessSectionDocument,
  TProcessSectionModel
>('ProcessSection', processSectionSchema);
