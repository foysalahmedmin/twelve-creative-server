import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const optionalUrl = z.string().trim().max(2048).optional();

const baseBody = z.object({
  name: z.string().trim().min(2).max(120),
  role: z.string().trim().min(2).max(120),
  bio: z.string().trim().max(240).optional(),
  image: z.string().trim().min(1).max(2048),
  socials: z
    .object({
      linkedin: optionalUrl,
      instagram: optionalUrl,
      x: optionalUrl,
    })
    .partial()
    .optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const teamMemberIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createTeamMemberValidationSchema = z.object({ body: baseBody });
export const updateTeamMemberValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});

export const reorderTeamMembersValidationSchema = z.object({
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
