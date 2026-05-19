import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

export const contactMessageIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createContactMessageValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email('Invalid email').max(200),
    phone: z.string().trim().max(40).optional(),
    subject: z.string().trim().max(200).optional(),
    message: z.string().trim().min(5, 'Message is too short').max(2000),
  }),
});

export const updateContactMessageValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z
    .object({
      is_read: z
        .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
        .optional(),
      is_archived: z
        .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
        .optional(),
    })
    .refine(
      (data) =>
        data.is_read !== undefined || data.is_archived !== undefined,
      { message: 'Either is_read or is_archived is required' },
    ),
});
