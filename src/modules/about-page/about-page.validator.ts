import { z } from 'zod';
import {
  mediaSchema,
  stableContentIdSchema,
} from '../cms-content/cms-content.validator';

const optionalIndexSchema = z
  .string()
  .trim()
  .regex(/^\d{2}$/)
  .optional();

const sectionHeaderSchema = z.object({
  label: z.string().trim().min(1).max(100),
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().min(1).max(1200),
  is_visible: z.boolean(),
});

const valueCardSchema = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().min(1).max(1200),
  is_visible: z.boolean(),
});

const storyCardSchema = z.object({
  id: stableContentIdSchema.optional(),
  index: optionalIndexSchema,
  title: z.string().trim().min(1).max(180),
  description: z.string().trim().min(1).max(1600),
  media: mediaSchema,
  is_visible: z.boolean(),
});

const founderSchema = z.object({
  eyebrow: z.string().trim().max(100).optional(),
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  biography: z.array(z.string().trim().min(1).max(1600)).min(1).max(6),
  media: mediaSchema,
  is_visible: z.boolean(),
});

const galleryItemSchema = z.object({
  id: stableContentIdSchema.optional(),
  index: optionalIndexSchema,
  alt: z.string().trim().min(1).max(200),
  media: mediaSchema,
  is_visible: z.boolean(),
});

export const updateAboutPageValidationSchema = z.object({
  body: z.object({
    mission_section: sectionHeaderSchema,
    mission: valueCardSchema,
    vision: valueCardSchema,
    story_section: sectionHeaderSchema,
    story_cards: z.array(storyCardSchema).min(1).max(12),
    founder: founderSchema,
    gallery_section: sectionHeaderSchema,
    gallery: z.array(galleryItemSchema).min(1).max(24),
    is_active: z.boolean(),
  }),
});
