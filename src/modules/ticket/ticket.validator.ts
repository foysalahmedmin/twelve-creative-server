import { z } from 'zod';

const idSchema = z.string().refine((val) => /^[0-9a-fA-F]{24}$/.test(val), {
  message: 'Invalid ID format',
});

const priorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
const statusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);

export const ticketIdSchema = z.object({
  params: z.object({ id: idSchema }),
});

export const createTicketSchema = z.object({
  body: z.object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(2000).optional(),
    priority: priorityEnum.optional(),
  }),
});

export const updateTicketSchema = z.object({
  params: z.object({ id: idSchema }),
  body: z
    .object({
      title: z.string().trim().min(1).max(200).optional(),
      description: z.string().trim().max(2000).optional().nullable(),
      priority: priorityEnum.optional(),
      status: statusEnum.optional(),
    })
    .refine(
      (d) =>
        d.title !== undefined ||
        d.description !== undefined ||
        d.priority !== undefined ||
        d.status !== undefined,
      { message: 'At least one field is required' },
    ),
});
