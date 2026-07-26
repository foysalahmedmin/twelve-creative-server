import { z } from 'zod';
import { isSafeMarkdown } from '../cms-content/cms-content.security';
import { LEGAL_PAGE_SLUGS } from './legal-page.type';

const legalPageSlugSchema = z.enum(LEGAL_PAGE_SLUGS);

const ISO_DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_UTC_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{3})?Z$/;

const isRealIsoDate = (value: string): boolean => {
  const match =
    ISO_DATE_ONLY_PATTERN.exec(value) ?? ISO_UTC_DATE_TIME_PATTERN.exec(value);
  if (!match) return false;

  const [, year, month, day] = match;
  const parsed = new Date(value);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.getUTCFullYear() === Number(year) &&
    parsed.getUTCMonth() + 1 === Number(month) &&
    parsed.getUTCDate() === Number(day)
  );
};

const effectiveDateSchema = z
  .union([
    z.date(),
    z
      .string()
      .trim()
      .refine(isRealIsoDate, {
        message: 'Effective date must be a valid ISO calendar date',
      })
      .transform((value) => new Date(value)),
  ])
  .nullable();

const legalPageBodySchema = z
  .object({
    slug: legalPageSlugSchema,
    title: z.string().trim().min(1).max(200),
    markdown: z
      .string()
      .trim()
      .min(1, 'Legal page content is required')
      .max(50000)
      .refine(isSafeMarkdown, {
        message: 'Markdown cannot contain raw HTML or unsafe protocols',
      }),
    effective_date: effectiveDateSchema,
    seo: z.object({
      title: z.string().trim().min(1).max(200),
      description: z.string().trim().min(1).max(500),
    }),
    is_published: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.is_published && !value.effective_date) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['effective_date'],
        message: 'An effective date is required before publishing',
      });
    }
  });

export const legalPageSlugParamsSchema = z.object({
  params: z.object({ slug: legalPageSlugSchema }),
});

export const upsertLegalPageValidationSchema = z.object({
  params: z.object({ slug: legalPageSlugSchema }),
  body: legalPageBodySchema,
});
