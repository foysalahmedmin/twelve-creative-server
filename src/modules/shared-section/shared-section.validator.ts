import { z } from 'zod';
import {
  mediaSchema,
  optionalBooleanSchema,
  stableContentIdSchema,
} from '../cms-content/cms-content.validator';
import {
  SHARED_HEADING_SECTION_KEYS,
  SHARED_SECTION_KEYS,
  WHY_CHOOSE_US_ICON_KEYS,
} from './shared-section.type';

const keySchema = z.enum(SHARED_SECTION_KEYS);
const headingKeySchema = z.enum(SHARED_HEADING_SECTION_KEYS);
const optionalIndexSchema = z
  .string()
  .trim()
  .regex(/^\d{2}$/, 'Invalid content item index')
  .optional();

const baseFields = {
  label: z.string().trim().max(100).optional(),
  title: z.string().trim().min(1, 'Title is required').max(400),
  description: z.string().trim().min(1, 'Description is required').max(1600),
  is_active: optionalBooleanSchema,
};

const textItemSchema = z.object({
  id: stableContentIdSchema.optional(),
  index: optionalIndexSchema,
  text: z.string().trim().min(1).max(300),
});

const differenceColumnSchema = z.object({
  title: z.string().trim().min(1).max(160),
  items: z.array(textItemSchema).min(1).max(12),
});

const differenceSchema = z.object({
  ...baseFields,
  key: z.literal('difference'),
  content: z
    .object({
      fragmented: differenceColumnSchema,
      connected: differenceColumnSchema,
    })
    .strict(),
});

const whyChooseUsSchema = z.object({
  ...baseFields,
  key: z.literal('why-choose-us'),
  content: z
    .object({
      features: z
        .array(
          z.object({
            id: stableContentIdSchema.optional(),
            index: optionalIndexSchema,
            icon: z.enum(WHY_CHOOSE_US_ICON_KEYS),
            title: z.string().trim().min(1).max(160),
            description: z.string().trim().min(1).max(800),
            media: mediaSchema.optional(),
          }),
        )
        .min(1)
        .max(12),
    })
    .strict(),
});

const growthSystemSchema = z.object({
  ...baseFields,
  key: z.literal('growth-system'),
  content: z
    .object({
      steps: z
        .array(
          z.object({
            id: stableContentIdSchema.optional(),
            index: optionalIndexSchema,
            title: z.string().trim().min(1).max(160),
            description: z.string().trim().min(1).max(1000),
            media: mediaSchema,
            items: z.array(textItemSchema).min(1).max(12),
          }),
        )
        .min(1)
        .max(12),
    })
    .strict(),
});

const statementSegmentSchema = z.object({
  id: stableContentIdSchema.optional(),
  index: optionalIndexSchema,
  text: z.string().min(1).max(800),
  highlight: z.boolean().optional(),
});

const scrollStatementSchema = z.object({
  ...baseFields,
  key: z.literal('scroll-statement'),
  content: z
    .object({
      paragraphs: z
        .array(
          z.object({
            id: stableContentIdSchema.optional(),
            index: optionalIndexSchema,
            segments: z.array(statementSegmentSchema).min(1).max(20),
          }),
        )
        .min(1)
        .max(8),
    })
    .strict(),
});

const workWithUsSchema = z.object({
  ...baseFields,
  key: z.literal('work-with-us'),
  content: z
    .object({
      cards: z
        .array(
          z.object({
            id: stableContentIdSchema.optional(),
            index: optionalIndexSchema,
            title: z.string().trim().min(1).max(160),
            description: z.string().trim().min(1).max(1000),
            media: mediaSchema.optional(),
          }),
        )
        .min(1)
        .max(12),
    })
    .strict(),
});

const headingSchema = z.object({
  ...baseFields,
  label: z.string().trim().min(1, 'Label is required').max(100),
  key: headingKeySchema,
  content: z.object({}).strict(),
});

export const sharedSectionBodySchema = z.discriminatedUnion('key', [
  differenceSchema,
  whyChooseUsSchema,
  growthSystemSchema,
  scrollStatementSchema,
  workWithUsSchema,
  headingSchema,
]);

export const sharedSectionKeySchema = z.object({
  params: z.object({ key: keySchema }),
});

export const updateSharedSectionValidationSchema = z.object({
  params: z.object({ key: keySchema }),
  body: sharedSectionBodySchema,
});
