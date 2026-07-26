import { z } from 'zod';
import {
  isHttpUrl,
  isSafeImageReference,
  isSafeLinkReference,
  isSafeVideoReference,
} from '../cms-content/cms-content.security';
import { PAGE_KEYS } from './page-hero.type';

const imageReferenceSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(isSafeImageReference, {
    message: 'Must be an HTTP(S) URL or a safe absolute application path',
  });

const httpUrlSchema = z
  .string()
  .trim()
  .min(1)
  .max(2048)
  .refine(isHttpUrl, 'Must be a valid HTTP(S) URL');

const videoRefSchema = z
  .object({
    source: z.enum(['youtube', 'url', 'upload']),
    value: z.string().trim().min(1).max(2048),
    poster: imageReferenceSchema.optional(),
  })
  .superRefine((video, context) => {
    if (!isSafeVideoReference(video.source, video.value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message: 'Video source and value do not form a safe video reference',
      });
    }
  })
  .optional()
  .nullable();

const ctaSchema = z
  .object({
    label: z.string().trim().min(1).max(80),
    href: z.string().trim().min(1).max(500).refine(isSafeLinkReference, {
      message: 'CTA link must use a safe supported URL or application path',
    }),
  })
  .optional()
  .nullable();

const seoSchema = z
  .object({
    title: z.string().trim().max(200).optional(),
    description: z.string().trim().max(320).optional(),
    og_image: imageReferenceSchema.optional(),
    canonical_url: httpUrlSchema.optional(),
    no_index: z.boolean().optional(),
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
    thumbnail: imageReferenceSchema.optional().nullable(),
    video: videoRefSchema,
    trust_label: z.string().trim().max(100).optional(),
    primary_cta: ctaSchema,
    secondary_cta: ctaSchema,
    seo: seoSchema,
    is_active: z
      .preprocess(
        (v) => (typeof v === 'string' ? v === 'true' : v),
        z.boolean(),
      )
      .optional(),
  }),
});
