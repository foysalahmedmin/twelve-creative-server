import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum(['active', 'inactive']);

export const categoryIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createCategoryValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100),
    description: z.string().trim().max(500).optional(),
    sequence: z.coerce.number().int().nonnegative().optional(),
    status: statusEnum.optional(),
    tags: z
      .preprocess((v) => {
        if (typeof v === 'string') {
          try {
            return JSON.parse(v);
          } catch {
            return v ? [v] : [];
          }
        }
        return v;
      }, z.array(z.string()))
      .optional(),
    layout: z.string().optional(),
    is_featured: z
      .preprocess(
        (v) => (typeof v === 'string' ? v === 'true' : v),
        z.boolean(),
      )
      .optional(),
  }),
});

export const updateCategoryValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z.object({
    name: z.string().trim().min(2).max(100).optional(),
    description: z.string().trim().max(500).optional(),
    sequence: z.coerce.number().int().nonnegative().optional(),
    status: statusEnum.optional(),
    tags: z
      .preprocess((v) => {
        if (typeof v === 'string') {
          try {
            return JSON.parse(v);
          } catch {
            return v ? [v] : [];
          }
        }
        return v;
      }, z.array(z.string()))
      .optional(),
    layout: z.string().optional(),
    is_featured: z
      .preprocess(
        (v) => (typeof v === 'string' ? v === 'true' : v),
        z.boolean(),
      )
      .optional(),
  }),
});
