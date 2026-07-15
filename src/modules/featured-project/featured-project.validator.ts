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
  industry: idSchema,
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

export const publicFeaturedProjectsQuerySchema = z.object({
  query: z.object({
    industry_slug: z
      .string()
      .trim()
      .toLowerCase()
      .min(2)
      .max(80)
      .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/)
      .optional(),
  }),
});

export const adminFeaturedProjectsQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    filter: z.enum(['active', 'inactive']).optional(),
    industry: idSchema.optional(),
    aspect: aspectEnum.optional(),
    sort: z.string().trim().max(80).optional(),
  }),
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
