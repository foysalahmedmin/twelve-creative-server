import { z } from 'zod';
import {
  CONTACT_FIELD_KEYS,
  LOCKED_CONTACT_FIELD_KEYS,
} from './contact-setting.type';

const fieldSchema = z.object({
  key: z.enum(CONTACT_FIELD_KEYS),
  label: z.string().trim().min(1).max(120),
  placeholder: z.string().trim().max(160).optional(),
  is_visible: z.boolean().optional(),
  is_required: z.boolean().optional(),
});

const optionSchema = z.object({
  label: z.string().trim().min(1).max(80),
  value: z.string().trim().min(1).max(60),
  is_active: z.boolean().optional(),
});

/**
 * Name and email are what ContactMessage requires, so hiding or un-requiring
 * either would produce a form whose submissions the API rejects — a silently
 * broken contact page. The admin UI locks these too; this is the guarantee
 * that holds even if a request is crafted by hand.
 */
const fieldsSchema = z
  .array(fieldSchema)
  .max(CONTACT_FIELD_KEYS.length)
  .superRefine((fields, ctx) => {
    const seen = new Set<string>();
    for (const field of fields) {
      if (seen.has(field.key)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate field: ${field.key}`,
          path: ['fields'],
        });
      }
      seen.add(field.key);
    }

    for (const locked of LOCKED_CONTACT_FIELD_KEYS) {
      const field = fields.find((f) => f.key === locked);
      if (!field) continue;
      if (field.is_visible === false || field.is_required === false) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `"${locked}" must stay visible and required — the contact form cannot accept a submission without it`,
          path: ['fields'],
        });
      }
    }
  });

/** At least one selectable entry, or the dropdown is a dead end. */
const optionsSchema = z
  .array(optionSchema)
  .max(12)
  .refine((opts) => opts.some((o) => o.is_active !== false), {
    message: 'Keep at least one option active',
  });

export const updateContactSettingValidationSchema = z.object({
  body: z.object({
    content: z
      .object({
        submit_label: z.string().trim().max(60),
        submitting_label: z.string().trim().max(60),
        industry_placeholder: z.string().trim().max(80),
        industry_other_label: z.string().trim().max(80),
        timeline_placeholder: z.string().trim().max(80),
        budget_placeholder: z.string().trim().max(80),
      })
      .partial()
      .optional(),
    fields: fieldsSchema.optional(),
    timeline_options: optionsSchema.optional(),
    budget_options: optionsSchema.optional(),
  }),
});
