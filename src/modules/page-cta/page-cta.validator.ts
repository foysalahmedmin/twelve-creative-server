import { z } from 'zod';
import {
  cmsIdSchema,
  imageReferenceSchema,
  linkReferenceSchema,
  optionalBooleanSchema,
} from '../cms-content/cms-content.validator';
import { PAGE_CTA_PLACEMENTS } from './page-cta.type';

const placementSchema = z.enum(PAGE_CTA_PLACEMENTS);

const industrySlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(80)
  .regex(/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/);

const ctaLinkSchema = z.object({
  label: z.string().trim().min(1, 'CTA label is required').max(80),
  href: linkReferenceSchema,
});

const pageCtaFieldsSchema = z.object({
  placement: placementSchema,
  industry: cmsIdSchema.nullable().optional(),
  eyebrow: z.string().trim().max(80).optional(),
  title: z.string().trim().min(1, 'Title is required').max(300),
  description: z.string().trim().min(1, 'Description is required').max(1200),
  image: imageReferenceSchema,
  primary_cta: ctaLinkSchema,
  secondary_cta: ctaLinkSchema.nullable().optional(),
  is_active: optionalBooleanSchema,
});

const pageCtaBodySchema = pageCtaFieldsSchema.superRefine((value, context) => {
  if (value.industry && value.placement !== 'industry-detail') {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['industry'],
      message: 'Industry overrides are only valid for industry-detail CTAs',
    });
  }
});

export const publicPageCtaSchema = z.object({
  params: z.object({ placement: placementSchema }),
  query: z.object({ industry_slug: industrySlugSchema.optional() }),
});

export const pageCtaIdSchema = z.object({
  params: z.object({ id: cmsIdSchema }),
});

export const adminPageCtasQuerySchema = z.object({
  query: z.object({
    placement: placementSchema.optional(),
    industry: cmsIdSchema.optional(),
  }),
});

export const createPageCtaValidationSchema = z.object({
  body: pageCtaBodySchema,
});

export const upsertPageCtaValidationSchema = z.object({
  body: pageCtaBodySchema,
});

export const updatePageCtaValidationSchema = z.object({
  params: z.object({ id: cmsIdSchema }),
  body: pageCtaFieldsSchema.partial().superRefine((value, context) => {
    if (
      value.industry &&
      value.placement &&
      value.placement !== 'industry-detail'
    ) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['industry'],
        message: 'Industry overrides are only valid for industry-detail CTAs',
      });
    }
  }),
});
