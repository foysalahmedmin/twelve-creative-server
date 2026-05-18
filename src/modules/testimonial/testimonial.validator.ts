import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const categoryEnum = z.enum(['message', 'video_message']);
const videoSourceEnum = z.enum(['youtube', 'url', 'upload']);

const urlOrPath = z
  .string()
  .trim()
  .min(1, 'Cannot be empty')
  .max(2048, 'Too long');

const videoRefSchema = z.object({
  source: videoSourceEnum,
  value: urlOrPath,
});

const baseBody = z.object({
  name: z.string().trim().min(2).max(80),
  designation: z.string().trim().min(2).max(120),
  image: urlOrPath,
  category: categoryEnum,
  message: z.string().trim().max(400).optional(),
  video_message: videoRefSchema.optional(),
  thumbnail: urlOrPath.optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  is_active: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const testimonialIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createTestimonialValidationSchema = z.object({
  body: baseBody.superRefine((data, ctx) => {
    if (data.category === 'message') {
      if (!data.message || data.message.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Message text is required (min 10 chars) when category is "message"',
          path: ['message'],
        });
      }
    } else {
      // video_message
      if (!data.video_message || !data.video_message.value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Video is required when category is "video_message" — provide a YouTube URL, direct video URL, or upload',
          path: ['video_message'],
        });
      }
    }
  }),
});

const updateBody = baseBody.partial();

export const updateTestimonialValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: updateBody.superRefine((data, ctx) => {
    if (data.category === 'message' && data.message !== undefined) {
      if (!data.message || data.message.trim().length < 10) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Message text must be at least 10 characters',
          path: ['message'],
        });
      }
    }
    if (data.category === 'video_message' && data.video_message !== undefined) {
      if (!data.video_message.value) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Video value is required',
          path: ['video_message', 'value'],
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
