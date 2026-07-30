import mongoose, { Schema } from 'mongoose';
import {
  isSafeImageReference,
  isSafeVideoReference,
} from '../cms-content/cms-content.security';
import { CMS_VIDEO_SOURCES } from '../cms-content/cms-content.type';
import {
  SHARED_SECTION_KEYS,
  TSharedSection,
  TSharedSectionModel,
  WHY_CHOOSE_US_ICON_KEYS,
} from './shared-section.type';

const stableIdField = {
  type: String,
  required: true,
  trim: true,
  maxlength: 64,
  match: /^[A-Za-z0-9][A-Za-z0-9_-]*$/,
};

const indexField = {
  type: String,
  required: true,
  match: /^\d{2}$/,
};

const videoRefSchema = new Schema(
  {
    source: { type: String, enum: CMS_VIDEO_SOURCES, required: true },
    value: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2048,
      validate: {
        validator(
          this: { source: 'youtube' | 'url' | 'upload' },
          value: string,
        ) {
          return isSafeVideoReference(this.source, value);
        },
        message: 'Invalid video reference for the selected source',
      },
    },
  },
  { _id: false },
);

const mediaSchema = new Schema(
  {
    type: { type: String, enum: ['image', 'video'], required: true },
    image: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Invalid image reference',
      },
    },
    video: { type: videoRefSchema },
    thumbnail: {
      type: String,
      trim: true,
      maxlength: 2048,
      validate: {
        validator: isSafeImageReference,
        message: 'Invalid thumbnail reference',
      },
    },
  },
  { _id: false },
);

mediaSchema.pre('validate', function () {
  if (this.type === 'image') {
    if (!this.image || this.video || this.thumbnail) {
      this.invalidate(
        'type',
        'Image media must contain only a valid image reference',
      );
    }
  } else if (this.type === 'video' && (!this.video || this.image)) {
    this.invalidate(
      'type',
      'Video media must contain a video and cannot contain an image',
    );
  }
});

const textItemSchema = new Schema(
  {
    id: stableIdField,
    index: indexField,
    text: { type: String, required: true, trim: true, maxlength: 300 },
  },
  { _id: false },
);

const differenceColumnSchema = new Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    items: { type: [textItemSchema], required: true },
  },
  { _id: false },
);

const featureSchema = new Schema(
  {
    id: stableIdField,
    index: indexField,
    icon: { type: String, enum: WHY_CHOOSE_US_ICON_KEYS, required: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 800,
    },
    media: { type: mediaSchema },
  },
  { _id: false },
);

const growthStepSchema = new Schema(
  {
    id: stableIdField,
    index: indexField,
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    media: { type: mediaSchema, required: true },
    items: { type: [textItemSchema], required: true },
  },
  { _id: false },
);

const statementSegmentSchema = new Schema(
  {
    id: stableIdField,
    index: indexField,
    text: { type: String, required: true, maxlength: 800 },
    highlight: { type: Boolean, default: false, required: true },
  },
  { _id: false },
);

const statementParagraphSchema = new Schema(
  {
    id: stableIdField,
    index: indexField,
    segments: { type: [statementSegmentSchema], required: true },
  },
  { _id: false },
);

const workCardSchema = new Schema(
  {
    id: stableIdField,
    index: indexField,
    title: { type: String, required: true, trim: true, maxlength: 160 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    media: { type: mediaSchema },
  },
  { _id: false },
);

const sharedContentSchema = new Schema(
  {
    fragmented: { type: differenceColumnSchema },
    connected: { type: differenceColumnSchema },
    features: { type: [featureSchema], default: undefined },
    steps: { type: [growthStepSchema], default: undefined },
    paragraphs: { type: [statementParagraphSchema], default: undefined },
    cards: { type: [workCardSchema], default: undefined },
  },
  { _id: false, strict: 'throw' },
);

const hasItems = (value: unknown, minimum = 1, maximum = 12): boolean =>
  Array.isArray(value) && value.length >= minimum && value.length <= maximum;

const sharedSectionSchema = new Schema<TSharedSection>(
  {
    key: {
      type: String,
      enum: SHARED_SECTION_KEYS,
      required: true,
      unique: true,
      trim: true,
    },
    label: { type: String, trim: true, maxlength: 100 },
    title: { type: String, required: true, trim: true, maxlength: 400 },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1600,
    },
    content: { type: sharedContentSchema, required: true },
    is_active: { type: Boolean, default: true, required: true },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

sharedSectionSchema.pre('validate', function () {
  const content = this.content as Record<string, unknown>;
  let valid: boolean;

  if (this.key === 'difference') {
    const fragmented = content.fragmented as { items?: unknown } | undefined;
    const connected = content.connected as { items?: unknown } | undefined;
    valid =
      hasItems(fragmented?.items) &&
      hasItems(connected?.items) &&
      !content.features &&
      !content.steps &&
      !content.paragraphs &&
      !content.cards;
  } else if (this.key === 'why-choose-us') {
    valid = hasItems(content.features);
  } else if (this.key === 'growth-system') {
    valid = hasItems(content.steps);
  } else if (this.key === 'scroll-statement') {
    valid = hasItems(content.paragraphs, 1, 8);
  } else if (this.key === 'work-with-us') {
    valid = hasItems(content.cards);
  } else {
    valid =
      !content.fragmented &&
      !content.connected &&
      !content.features &&
      !content.steps &&
      !content.paragraphs &&
      !content.cards;
  }

  if (!valid) {
    this.invalidate(
      'content',
      `Content does not match shared section key ${this.key}`,
    );
  }
});

sharedSectionSchema.index({ is_active: 1, key: 1 });

export const SharedSection = mongoose.model<
  TSharedSection,
  TSharedSectionModel
>('SharedSection', sharedSectionSchema);
