import { z } from 'zod';
import { PAGE_KEYS } from './page-hero.type';

const optionalUrl = z.string().trim().min(1).max(2048).optional();

const videoRefSchema = z
  .object({
    source: z.enum(['youtube', 'url', 'upload']),
    value: z.string().trim().min(1).max(2048),
    poster: optionalUrl,
  })
  .optional()
  .nullable();

const ctaSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    href: z.string().trim().min(1).max(500),
  })
  .optional()
  .nullable();

const pageKeyEnum = z.enum(PAGE_KEYS as unknown as [string, ...string[]]);

export const pageHeroParamSchema = z.object({
  params: z.object({ page: pageKeyEnum }),
});

export const upsertPageHeroValidationSchema = z.object({
  params: z.object({ page: pageKeyEnum }),
  body: z.object({
    label: z.string().trim().max(80).optional(),
    title: z.string().trim().max(300).optional(),
    description: z.string().trim().max(600).optional(),
    thumbnail: optionalUrl.nullable(),
    video: videoRefSchema,
    trust_label: z.string().trim().max(100).optional(),
    primary_cta: ctaSchema,
    secondary_cta: ctaSchema,
    is_active: z
      .preprocess(
        (v) => (typeof v === 'string' ? v === 'true' : v),
        z.boolean(),
      )
      .optional(),
  }),
});
