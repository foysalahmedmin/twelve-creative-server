import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const baseBody = z.object({
  name: z.string().trim().min(1).max(120),
  logo: z.string().trim().min(1).max(2048),
  href: z.string().trim().max(1024).optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const brandIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createBrandValidationSchema = z.object({ body: baseBody });
export const updateBrandValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});

export const reorderBrandsValidationSchema = z.object({
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
