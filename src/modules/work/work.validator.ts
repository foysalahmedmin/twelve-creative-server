import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(160)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/, {
    message: 'Slug can only contain lowercase letters, numbers, and hyphens',
  });

const videoRefSchema = z.object({
  source: z.enum(['youtube', 'url', 'upload']),
  value: z.string().trim().min(1).max(2048),
});

const metricSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(60),
  sub: z.string().trim().max(120).optional(),
});

const heroStatSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(60),
});

const clientSchema = z.object({
  name: z.string().trim().min(1).max(160),
  industry: z.string().trim().max(120).optional(),
  domain: z.string().trim().max(200).optional(),
  employees: z.string().trim().max(60).optional(),
  tags: z.array(z.string().trim()).optional(),
  desc: z.string().trim().max(1000).optional(),
  logo: z.string().trim().max(2048).optional(),
});

const challengeItemSchema = z.object({
  title: z.string().trim().min(1).max(160),
  desc: z.string().trim().min(1).max(1000),
});

const solutionPhaseSchema = z.object({
  phase: z.string().trim().min(1).max(160),
  time: z.string().trim().max(80).optional(),
  desc: z.string().trim().min(1).max(1000),
});

const testimonialSchema = z.object({
  quote: z.string().trim().min(1).max(600),
  avatar_url: z.string().trim().max(2048).optional(),
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(160),
});

const baseBody = z.object({
  slug: slugSchema,
  type: z.string().trim().min(1).max(80),
  title: z.string().trim().min(4).max(200),
  description: z.string().trim().min(1).max(1000),
  image: z.string().trim().min(1).max(2048),
  image_alt: z.string().trim().min(1).max(200),
  metrics: z.array(metricSchema).optional(),
  tag_slugs: z.array(z.string().trim()).optional(),
  hero_stats: z.array(heroStatSchema).optional(),
  client: clientSchema.optional(),
  situation_intro: z.string().trim().max(2000).optional(),
  challenge_intro: z.string().trim().max(2000).optional(),
  challenge_items: z.array(challengeItemSchema).optional(),
  solution_intro: z.string().trim().max(2000).optional(),
  solution_phases: z.array(solutionPhaseSchema).optional(),
  outcome_desc: z.string().trim().max(2000).optional(),
  outcome_video: videoRefSchema.optional(),
  outcome_video_thumbnail: z.string().trim().max(2048).optional(),
  testimonial: testimonialSchema.optional(),
  calendly_url: z.string().trim().max(500).optional(),
  order: z.coerce.number().int().nonnegative().optional(),
  is_published: z
    .preprocess((v) => (typeof v === 'string' ? v === 'true' : v), z.boolean())
    .optional(),
});

export const workIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const workSlugSchema = z.object({
  params: z.object({ slug: slugSchema }),
});

export const createWorkValidationSchema = z.object({ body: baseBody });

export const updateWorkValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial(),
});

export const reorderWorksValidationSchema = z.object({
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
