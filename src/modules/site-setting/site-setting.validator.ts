import { z } from 'zod';
import {
  MAX_NOTIFICATION_RECIPIENTS,
  formatRecipientList,
  isEmailAddress,
  parseRecipientList,
} from '../../utils/notification-recipient';
import {
  isHttpUrl,
  isSafeImageReference,
  isSafeLinkReference,
} from '../cms-content/cms-content.security';

const optionalEmail = z
  .string()
  .trim()
  .max(200)
  .refine((v) => !v || isEmailAddress(v), {
    message: 'Invalid email',
  })
  .optional();

/**
 * A comma-separated recipient list. Normalizes on the way in so the stored
 * value is always canonical (lower-cased, de-duplicated, ", "-joined) no
 * matter how the admin typed or pasted it. Empty means "use the default".
 */
const optionalEmailList = z
  .string()
  .trim()
  .max(500)
  .superRefine((value, ctx) => {
    if (!value) return;
    const addresses = parseRecipientList(value);
    const invalid = addresses.filter((address) => !isEmailAddress(address));
    if (invalid.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Invalid email address: ${invalid.join(', ')}`,
      });
    }
    if (addresses.length > MAX_NOTIFICATION_RECIPIENTS) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Use at most ${MAX_NOTIFICATION_RECIPIENTS} addresses`,
      });
    }
  })
  .transform((value) =>
    value ? formatRecipientList(parseRecipientList(value)) : value,
  )
  .optional();

const optionalSafeReference = (
  validator: (value: string) => boolean,
  message: string,
) =>
  z
    .string()
    .trim()
    .max(2048)
    .refine((value) => !value || validator(value), { message })
    .optional();

const optionalHttpUrl = optionalSafeReference(
  isHttpUrl,
  'URL must use HTTP(S)',
);
const optionalImageReference = optionalSafeReference(
  isSafeImageReference,
  'Image must be a safe HTTP(S) URL or absolute application path',
);
const optionalLinkReference = optionalSafeReference(
  isSafeLinkReference,
  'Link must use a safe supported URL or application path',
);

const sectionCopySchema = z
  .object({
    label: z.string().trim().max(100).optional(),
    title: z.string().trim().max(240).optional(),
    description: z.string().trim().max(1200).optional(),
  })
  .partial();

export const updateSiteSettingValidationSchema = z.object({
  body: z.object({
    contact_email: optionalEmail,
    contact_phone: z.string().trim().max(40).optional(),
    contact_address: z.string().trim().max(400).optional(),
    contact_whatsapp: z.string().trim().max(40).optional(),
    contact_map_embed_url: optionalHttpUrl,
    booking_notification_email: optionalEmailList,
    social: z
      .object({
        instagram: optionalHttpUrl,
        linkedin: optionalHttpUrl,
        youtube: optionalHttpUrl,
        x: optionalHttpUrl,
        facebook: optionalHttpUrl,
      })
      .partial()
      .optional(),
    faq_section: z
      .object({
        image: optionalImageReference,
        image_alt: z.string().trim().max(200).optional(),
        title: z.string().trim().max(200).optional(),
        description: z.string().trim().max(800).optional(),
        name: z.string().trim().max(100).optional(),
        position: z.string().trim().max(100).optional(),
        contact_link: optionalLinkReference,
      })
      .partial()
      .optional(),
    calendly_url: optionalHttpUrl,
    process_thumbnail: optionalImageReference,
    meeting_scene_image: optionalImageReference,
    content_section: z
      .object({
        title: z.string().trim().max(200).optional(),
        subtitle: z.string().trim().max(100).optional(),
        body: z.string().trim().max(1000).optional(),
        image: optionalImageReference,
      })
      .partial()
      .optional(),
    contact_page: z
      .object({
        inquiry: sectionCopySchema.optional(),
        booking: sectionCopySchema.optional(),
        map: sectionCopySchema.optional(),
      })
      .partial()
      .optional(),
    footer: z
      .object({
        description: z.string().trim().max(800).optional(),
        cta_text: z.string().trim().max(240).optional(),
        cta_label: z.string().trim().max(80).optional(),
        cta_href: optionalLinkReference,
      })
      .partial()
      .optional(),
  }),
});
