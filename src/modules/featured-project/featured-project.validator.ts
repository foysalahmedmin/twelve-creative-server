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

const aspectEnum = z.enum(['reel', 'landscape']);

const baseBody = z.object({
  title: z.string().trim().min(2).max(200),
  category: z.string().trim().min(2).max(80),
  aspect: aspectEnum.optional(),
  thumbnail: urlOrPath,
  video: videoRefSchema,
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const featuredProjectIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createFeaturedProjectValidationSchema = z.object({
  body: baseBody,
});

export const updateFeaturedProjectValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});

export const reorderFeaturedProjectsValidationSchema = z.object({
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
