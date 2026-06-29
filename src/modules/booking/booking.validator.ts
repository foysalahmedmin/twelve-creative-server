import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum(['pending', 'in_progress', 'completed', 'cancelled']);

const leadSourceEnum = z.enum([
  'organic',
  'meta_ad',
  'google_ad',
  'referral',
  'direct',
  'email',
  'other',
]);

export const bookingIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createBookingValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email('Invalid email').max(200),
    phone: z.string().trim().max(40).optional(),
    company: z.string().trim().max(160).optional(),
    industry: z.string().trim().max(120).optional(),
    preferred_date: z.coerce.date().optional(),
    preferred_time: z.string().trim().max(40).optional(),
    message: z.string().trim().max(2000).optional(),
  }),
});

export const updateBookingValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z
    .object({
      status: statusEnum.optional(),
      internal_note: z.string().trim().max(2000).optional(),
      lead_source: leadSourceEnum.optional().nullable(),
    })
    .refine(
      (data) =>
        data.status !== undefined ||
        data.internal_note !== undefined ||
        data.lead_source !== undefined,
      { message: 'At least one field is required' },
    ),
});
