import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const statusEnum = z.enum(['draft', 'active', 'archived']);
const typeEnum = z.enum(['video', 'podcast']);

export const postIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createPostValidationSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1, 'Title is required'),
    description: z.string().trim().max(1000).optional(),
    content: z.string().min(1, 'Content is required'),
    thumbnail: idSchema.optional(),
    video: idSchema.optional(),
    youtube: z.string().trim().url('Invalid YouTube URL').optional(),
    tags: z.array(z.string().min(1)).optional(),
    categories: z.array(idSchema).optional(),
    type: typeEnum,
    ratio: z.string().optional(),
    status: statusEnum.optional(),
    is_featured: z.boolean().optional(),
  }),
});

export const updatePostValidationSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z.object({
    title: z.string().trim().min(1).optional(),
    description: z.string().trim().max(1000).optional(),
    content: z.string().min(1).optional(),
    thumbnail: idSchema.optional(),
    video: idSchema.optional(),
    youtube: z.string().trim().url('Invalid YouTube URL').optional(),
    tags: z.array(z.string().min(1)).optional(),
    categories: z.array(idSchema).optional(),
    type: typeEnum.optional(),
    ratio: z.string().optional(),
    status: statusEnum.optional(),
    is_featured: z.boolean().optional(),
  }),
});
