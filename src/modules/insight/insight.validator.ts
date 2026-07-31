import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  });

const baseBody = z.object({
  slug: slugSchema,
  title: z.string().trim().min(4).max(160),
  excerpt: z.string().trim().min(10).max(280),
  cover: z.string().trim().min(1).max(2048),
  content: z.string().trim().min(50),
  category: z.string().trim().max(80).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

export const insightIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const insightSlugSchema = z.object({
  params: z.object({ slug: slugSchema }),
});

export const createInsightValidationSchema = z.object({ body: baseBody });

export const updateInsightValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});
