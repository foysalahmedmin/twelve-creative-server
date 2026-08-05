import { z } from 'zod';
import { WEEKDAYS } from './booking-setting.type';

const stepSchema = z.object({
  title: z.string().trim().min(1).max(80),
  description: z.string().trim().min(1).max(240),
});

const slotSchema = z.object({
  label: z.string().trim().min(1).max(60),
  range: z.string().trim().min(1).max(80),
  is_active: z.boolean().optional(),
});

const contentSchema = z
  .object({
    label: z.string().trim().max(60),
    title: z.string().trim().max(160),
    steps: z.array(stepSchema).max(8),
    card_title: z.string().trim().max(120),
    card_description: z.string().trim().max(400),
    benefits: z.array(z.string().trim().min(1).max(120)).max(8),
    cta_label: z.string().trim().max(60),
    footnote: z.string().trim().max(200),
  })
  .partial();

const questionsSchema = z
  .object({
    sector_title: z.string().trim().max(160),
    schedule_title: z.string().trim().max(160),
    schedule_subtitle: z.string().trim().max(240),
    details_title: z.string().trim().max(160),
  })
  .partial();

const availabilitySchema = z
  .object({
    slots: z.array(slotSchema).max(12),
    // 0 = Sunday … 6 = Saturday, matching Date.prototype.getDay().
    available_weekdays: z
      .array(z.number().int().min(0).max(6))
      .max(WEEKDAYS.length),
    min_lead_days: z.number().int().min(0).max(90),
    max_advance_days: z.number().int().min(1).max(365),
  })
  .partial()
  .refine(
    (v) =>
      v.min_lead_days === undefined ||
      v.max_advance_days === undefined ||
      v.min_lead_days < v.max_advance_days,
    {
      message:
        'Earliest bookable day must fall before the end of the booking window',
      path: ['min_lead_days'],
    },
  );

export const updateBookingSettingValidationSchema = z.object({
  body: z.object({
    content: contentSchema.optional(),
    questions: questionsSchema.optional(),
    availability: availabilitySchema.optional(),
  }),
});
