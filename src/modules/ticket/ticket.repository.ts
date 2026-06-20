import { Ticket } from './ticket.model';
import { TTicket, TTicketDocument } from './ticket.type';

export const create = async (data: Partial<TTicket>): Promise<TTicket> => {
  const result = await Ticket.create(data);
  return result.toObject();
};

export const findAll = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTicket[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 50;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.priority) filter.priority = query.priority;
  if (query.search) filter.title = { $regex: query.search, $options: 'i' };

  const [data, total] = await Promise.all([
    Ticket.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    Ticket.countDocuments(filter),
  ]);

  return {
    data: data as TTicket[],
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
  };
};

export const findById = async (id: string): Promise<TTicketDocument | null> => {
  return await Ticket.findById(id);
};

export const findByIdLean = async (id: string): Promise<TTicket | null> => {
  return await Ticket.findById(id).lean();
};

export const updateById = async (
  id: string,
  payload: Partial<TTicket>,
): Promise<TTicketDocument | null> => {
  return await Ticket.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Ticket.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};
