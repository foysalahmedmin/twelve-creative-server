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
  'hospitality',
  'real-estate',
  'aviation',
  'professional-services',
]);

const baseBody = z.object({
  slug: slugSchema,
  name: z.string().trim().min(2).max(80),
  headline: z.string().trim().min(4).max(200),
  description: z.string().trim().min(10).max(800),
  image: z.string().trim().min(1).max(2048),
  icon: iconEnum.optional(),
  work: z
    .array(z.string().trim().min(1).max(80))
    .max(12, 'Work list cannot exceed 12 items')
    .optional(),
  cta_label: z.string().trim().max(60).optional(),
  cta_href: z.string().trim().max(500).optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const industryIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createIndustryValidationSchema = z.object({ body: baseBody });

export const updateIndustryValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});

export const reorderIndustriesValidationSchema = z.object({
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
