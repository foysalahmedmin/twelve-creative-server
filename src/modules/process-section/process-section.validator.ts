import { z } from 'zod';
import { PROCESS_ICON_KEYS } from './process-section.type';

const imageReferenceSchema = z
  .string()
  .trim()
  .min(1, 'Image is required')
  .max(2048)
  .refine((value) => {
    const hasControlCharacter = Array.from(value).some((character) => {
      const code = character.charCodeAt(0);
      return code <= 31 || code === 127;
    });
    if (hasControlCharacter || value.includes('\\')) {
      return false;
    }

    if (value.startsWith('/')) {
      if (value.startsWith('//')) return false;

      const path = value.split(/[?#]/, 1)[0];
      try {
        return !decodeURIComponent(path).split('/').includes('..');
      } catch {
        return false;
      }
    }

    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Image must be an HTTP(S) URL or an absolute path');

const safeStepIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Invalid process step id');

const processStepSchema = z.object({
  id: safeStepIdSchema.optional(),
  // Accepted for API round trips only. The service always derives this value
  // from array order, so clients cannot create stale or duplicate indexes.
  index: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])$/, 'Invalid process step index')
    .optional(),
  icon: z.enum(PROCESS_ICON_KEYS),
  title: z.string().trim().min(1, 'Step title is required').max(160),
  description: z
    .string()
    .trim()
    .min(1, 'Step description is required')
    .max(600),
  image: imageReferenceSchema,
});

export const updateProcessSectionValidationSchema = z.object({
  body: z.object({
    label: z.string().trim().min(1, 'Label is required').max(80),
    title: z.string().trim().min(1, 'Title is required').max(300),
    description: z.string().trim().min(1, 'Description is required').max(800),
    thumbnail: imageReferenceSchema,
    process_steps: z
      .array(processStepSchema)
      .min(1, 'At least one process step is required')
      .max(12, 'A maximum of 12 process steps is allowed'),
  }),
});
