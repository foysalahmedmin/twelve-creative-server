import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const videoSourceEnum = z.enum(['youtube', 'url', 'upload']);
const urlOrPath = z
  .string()
  .trim()
  .min(1, 'Cannot be empty')
  .max(2048, 'Too long');

const videoRefSchema = z.object({
  source: videoSourceEnum,
  value: urlOrPath,
});

const baseBody = z.object({
  video: videoRefSchema,
  thumbnail: urlOrPath.optional(),
  alt: z.string().trim().min(2).max(180),
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const showcaseVideoIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createShowcaseVideoValidationSchema = z.object({
  body: baseBody,
});

export const updateShowcaseVideoValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});

export const reorderShowcaseVideosValidationSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          _id: idSchema,
          order: z.coerce.number().int().nonnegative(),
        }),
      )
      .min(1, 'At least one item is required'),
  }),
});
