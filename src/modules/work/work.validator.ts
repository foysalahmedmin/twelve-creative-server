import { z } from 'zod';
import {
  isSafeImageReference,
  isSafeLinkReference,
  isSafeVideoReference,
} from '../cms-content/cms-content.security';

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

const videoRefSchema = z
  .object({
    source: z.enum(['youtube', 'url', 'upload']),
    value: z.string().trim().min(1).max(2048),
  })
  .refine((video) => isSafeVideoReference(video.source, video.value), {
    message: 'Video source and value do not form a safe video reference',
    path: ['value'],
  });

const imageReference = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(isSafeImageReference, {
    message: 'Must be a safe HTTP(S) URL or root-relative path',
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
  logo: imageReference.optional(),
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
  avatar_url: imageReference.optional(),
  name: z.string().trim().min(1).max(120),
  role: z.string().trim().min(1).max(160),
});

const baseBody = z.object({
  industry: idSchema,
  slug: slugSchema,
  type: z.string().trim().min(1).max(80),
  title: z.string().trim().min(4).max(200),
  description: z.string().trim().min(1).max(1000),
  image: imageReference,
  image_alt: z.string().trim().min(1).max(200),
  metrics: z.array(metricSchema).max(12).optional(),
  tag_slugs: z.array(z.string().trim().min(1).max(80)).max(30).optional(),
  hero_stats: z.array(heroStatSchema).max(12).optional(),
  client: clientSchema.optional(),
  situation_intro: z.string().trim().max(2000).optional(),
  challenge_intro: z.string().trim().max(2000).optional(),
  challenge_items: z.array(challengeItemSchema).max(20).optional(),
  solution_intro: z.string().trim().max(2000).optional(),
  solution_phases: z.array(solutionPhaseSchema).max(20).optional(),
  outcome_desc: z.string().trim().max(2000).optional(),
  outcome_video: videoRefSchema.optional(),
  outcome_video_thumbnail: imageReference.optional(),
  testimonial: testimonialSchema.optional(),
  calendly_url: z
    .string()
    .trim()
    .max(500)
    .refine(isSafeLinkReference, { message: 'Unsafe link' })
    .optional(),
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

const industrySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);

export const publicWorksQuerySchema = z.object({
  query: z.object({ industry_slug: industrySlugSchema.optional() }),
});

export const adminWorksQuerySchema = z.object({
  query: z.object({
    search: z.string().trim().max(200).optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    filter: z.enum(['published', 'draft']).optional(),
    industry: idSchema.optional(),
    sort: z.string().trim().max(80).optional(),
  }),
});

export const createWorkValidationSchema = z.object({ body: baseBody });

export const updateWorkValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: baseBody.partial().extend({
    client: clientSchema.nullable().optional(),
    situation_intro: z.string().trim().max(2000).nullable().optional(),
    challenge_intro: z.string().trim().max(2000).nullable().optional(),
    solution_intro: z.string().trim().max(2000).nullable().optional(),
    outcome_desc: z.string().trim().max(2000).nullable().optional(),
    outcome_video: videoRefSchema.nullable().optional(),
    outcome_video_thumbnail: imageReference.nullable().optional(),
    testimonial: testimonialSchema.nullable().optional(),
    calendly_url: z
      .string()
      .trim()
      .max(500)
      .refine(isSafeLinkReference, { message: 'Unsafe link' })
      .nullable()
      .optional(),
  }),
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
      .min(1)
      .max(100),
  }),
});
