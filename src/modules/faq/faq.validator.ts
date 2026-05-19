import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const baseBody = z.object({
  question: z.string().trim().min(4).max(200),
  answer: z.string().trim().min(4).max(1500),
  group: z.string().trim().max(80).optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const faqIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createFaqValidationSchema = z.object({ body: baseBody });
export const updateFaqValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});

export const reorderFaqsValidationSchema = z.object({
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
