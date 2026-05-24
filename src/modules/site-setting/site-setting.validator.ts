import { z } from 'zod';

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), {
    message: 'Invalid email',
  })
  .optional();

const optionalUrl = z.string().trim().max(2048).optional();

export const updateSiteSettingValidationSchema = z.object({
  body: z.object({
    contact_email: optionalEmail,
    contact_phone: z.string().trim().max(40).optional(),
    contact_address: z.string().trim().max(400).optional(),
    booking_notification_email: optionalEmail,
    social: z
      .object({
        instagram: optionalUrl,
        linkedin: optionalUrl,
        youtube: optionalUrl,
        x: optionalUrl,
        facebook: optionalUrl,
      })
      .partial()
      .optional(),
    faq_section: z
      .object({
        image: optionalUrl,
        image_alt: z.string().trim().max(200).optional(),
        title: z.string().trim().max(200).optional(),
        description: z.string().trim().max(800).optional(),
        name: z.string().trim().max(100).optional(),
        position: z.string().trim().max(100).optional(),
        contact_link: z.string().trim().max(500).optional(),
      })
      .partial()
      .optional(),
  }),
});
