import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum([
  'pending',
  'in_progress',
  'completed',
  'cancelled',
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
    timeline: z.string().trim().max(80).optional(),
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
    })
    .refine((data) => data.status !== undefined || data.internal_note !== undefined, {
      message: 'Either status or internal_note is required',
    }),
});
