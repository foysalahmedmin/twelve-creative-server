import { z } from 'zod';
import { CMS_VIDEO_SOURCES } from './cms-content.type';
import {
  isSafeImageReference,
  isSafeLinkReference,
  isSafeVideoReference,
} from './cms-content.security';

export const cmsIdSchema = z
  .string()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ID format');

export const stableContentIdSchema = z
  .string()
  .trim()
  .min(1)
  .max(64)
  .regex(/^[A-Za-z0-9][A-Za-z0-9_-]*$/, 'Invalid content item id');

export const imageReferenceSchema = z
  .string()
  .trim()
  .min(1, 'Image is required')
  .max(2048)
  .refine(isSafeImageReference, {
    message: 'Image must be a safe HTTP(S) URL or absolute application path',
  });

export const linkReferenceSchema = z
  .string()
  .trim()
  .min(1, 'Link is required')
  .max(2048)
  .refine(isSafeLinkReference, {
    message: 'Link must use a safe supported URL or application path',
  });

export const videoReferenceSchema = z
  .object({
    source: z.enum(CMS_VIDEO_SOURCES),
    value: z.string().trim().min(1, 'Video is required').max(2048),
  })
  .superRefine((video, context) => {
    if (!isSafeVideoReference(video.source, video.value)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['value'],
        message:
          video.source === 'youtube'
            ? 'YouTube video must use a secure, supported video URL'
            : video.source === 'upload'
              ? 'Uploaded video must use an /uploads path or HTTPS storage URL'
              : 'Video URL must use HTTPS',
      });
    }
  });

export const mediaSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('image'),
    image: imageReferenceSchema,
  }),
  z.object({
    type: z.literal('video'),
    video: videoReferenceSchema,
    thumbnail: imageReferenceSchema.optional(),
  }),
]);

export const optionalBooleanSchema = z
  .preprocess((value) => {
    if (typeof value !== 'string') return value;
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  }, z.boolean())
  .optional();
