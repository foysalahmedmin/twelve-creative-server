import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  });

const iconEnum = z.enum([
  'positioning',
  'creative',
  'distribution',
  'websites',
  'automation',
  'growth',
]);

const baseBody = z.object({
  slug: slugSchema,
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(600),
  highlights: z
    .array(z.string().trim().min(1).max(80))
    .max(8, 'Highlights cannot exceed 8 items')
    .optional(),
  image: z.string().trim().min(1).max(2048),
  icon: iconEnum.optional(),
  href: z.string().trim().max(500).optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const serviceIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createServiceValidationSchema = z.object({ body: baseBody });

export const updateServiceValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});

export const reorderServicesValidationSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          _id: idSchema,
          order: z.coerce.number().int().nonnegative(),
        }),
      )
      .min(1),
  }),
});
