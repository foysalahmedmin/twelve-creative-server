import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum(['active', 'inactive']);

const categoryPublicSortFields = ['sequence', 'name', 'is_featured'] as const;

const categoryPublicSortSchema = z
  .string()
  .trim()
  .min(1)
  .max(100)
  .refine(
    (value) => {
      const fields = value.split(',');
      return (
        fields.length <= categoryPublicSortFields.length &&
        fields.every((field) => {
          const name = field.startsWith('-') ? field.slice(1) : field;
          return categoryPublicSortFields.includes(
            name as (typeof categoryPublicSortFields)[number],
          );
        })
      );
    },
    { message: 'Invalid public category sort field' },
  );

export const publicCategoriesQuerySchema = z.object({
  query: z
    .object({
      page: z.coerce.number().int().min(1).max(10_000).optional(),
      limit: z.coerce.number().int().min(1).max(100).optional(),
      search: z.string().trim().min(1).max(200).optional(),
      sort: categoryPublicSortSchema.optional(),
      is_featured: z.enum(['true', 'false']).optional(),
      layout: z.string().trim().min(1).max(100).optional(),
      tags: z.string().trim().min(1).max(100).optional(),
    })
    .strict(),
});

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
