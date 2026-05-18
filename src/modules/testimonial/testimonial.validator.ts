import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const categoryEnum = z.enum(['message', 'video_message']);

const urlOrPath = z
  .string()
  .trim()
  .min(1, 'Cannot be empty')
  .max(2048, 'Too long');

const baseBody = z.object({
  name: z.string().trim().min(2).max(80),
  designation: z.string().trim().min(2).max(120),
  image: urlOrPath,
  category: categoryEnum,
  message: z.string().trim().max(400).optional(),
  video_message: urlOrPath.optional(),
  thumbnail: urlOrPath.optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

const categoryConstraint = (body: z.infer<typeof baseBody>) => {
  if (body.category === 'message') {
    return !!body.message && body.message.length >= 10;
  }
  return !!body.video_message;
};

const constraintMessage = (body: z.infer<typeof baseBody>) =>
  body.category === 'message'
    ? 'Message text is required (min 10 chars) when category is "message"'
    : 'Video URL is required when category is "video_message"';

export const testimonialIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createTestimonialValidationSchema = z.object({
  body: baseBody.refine(categoryConstraint, {
    message: 'Required field missing for the selected category',
  }).superRefine((data, ctx) => {
    if (!categoryConstraint(data)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: constraintMessage(data),
        path: data.category === 'message' ? ['message'] : ['video_message'],
      });
    }
  }),
});

const updateBody = baseBody.partial();

export const updateTestimonialValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: updateBody.superRefine((data, ctx) => {
    // If category provided, enforce matching field
    if (data.category === 'message' && data.message !== undefined) {
      if (!data.message || data.message.length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Message text is required (min 10 chars)',
          path: ['message'],
        });
      }
    }
    if (data.category === 'video_message' && data.video_message !== undefined) {
      if (!data.video_message) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Video URL is required',
          path: ['video_message'],
        });
      }
    }
  }),
});

export const reorderTestimonialsValidationSchema = z.object({
  body: z.object({
    items: z
      .array(
        z.object({
          _id: idSchema,
          order: z.coerce.number().int().nonnegative(),
        }),
      )
      .min(1, 'At least one item is required'),
  }),
});
