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

const BOOKING_SORT_FIELDS = [
  'created_at',
  'updated_at',
  'name',
  'email',
  'company',
  'status',
  'preferred_date',
  'lead_source',
] as const;

const BOOKING_SELECT_FIELDS = [
  '_id',
  'name',
  'email',
  'phone',
  'company',
  'industry_id',
  'industry_name_snapshot',
  'industry',
  'timeline',
  'preferred_date',
  'preferred_time',
  'message',
  'status',
  'internal_note',
  'source',
  'lead_source',
  'created_at',
  'updated_at',
] as const;

const commaSeparatedFieldList = (
  fields: readonly string[],
  maxItems: number,
  label: string,
  projectionRules = false,
) =>
  z
    .string()
    .trim()
    .min(1)
    .max(512)
    .superRefine((value, context) => {
      const items = value.split(',');
      if (items.length > maxItems) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${label} accepts at most ${maxItems} fields`,
        });
      }

      const seen = new Set<string>();
      const includedFields: string[] = [];
      const excludedFields: string[] = [];
      for (const item of items) {
        const isExcluded = item.startsWith('-');
        const field = isExcluded ? item.slice(1) : item;
        if (!field || !fields.includes(field)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Unsupported ${label.toLowerCase()} field: ${field || item}`,
          });
        }
        if (seen.has(field)) {
          context.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Duplicate ${label.toLowerCase()} field: ${field}`,
          });
        }
        seen.add(field);
        (isExcluded ? excludedFields : includedFields).push(field);
      }

      if (
        projectionRules &&
        includedFields.length > 0 &&
        excludedFields.some((field) => field !== '_id')
      ) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message:
            'Selection cannot mix included and excluded fields except for -_id',
        });
      }
    });

export const bookingIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createBookingValidationSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().trim().email('Invalid email').max(200),
    phone: z.string().trim().max(40).optional(),
    company: z.string().trim().max(160).optional(),
    industry_id: idSchema.optional(),
    industry_name_snapshot: z.string().trim().min(1).max(120).optional(),
    industry: z.string().trim().max(120).optional(),
    preferred_date: z.coerce.date().optional(),
    preferred_time: z.string().trim().max(40).optional(),
    message: z.string().trim().max(2000).optional(),
  }),
});

export const adminBookingsQuerySchema = z.object({
  query: z
    .object({
      search: z.string().trim().min(1).max(200).optional(),
      page: z.coerce.number().int().positive().max(100_000).optional(),
      limit: z.coerce.number().int().positive().max(100).optional(),
      filter: statusEnum.optional(),
      status: statusEnum.optional(),
      industry_id: idSchema.optional(),
      lead_source: leadSourceEnum.optional(),
      sort: commaSeparatedFieldList(BOOKING_SORT_FIELDS, 8, 'Sort').optional(),
      fields: commaSeparatedFieldList(
        BOOKING_SELECT_FIELDS,
        20,
        'Selection',
        true,
      ).optional(),
    })
    .strict()
    .superRefine((query, context) => {
      if (query.filter && query.status && query.filter !== query.status) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['status'],
          message: 'status and filter cannot select different booking states',
        });
      }
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
