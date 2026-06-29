import AppQueryFind from '../../builder/app-query-find';
import { Booking } from './booking.model';
import { TBooking, TBookingDocument } from './booking.type';

export const create = async (data: Partial<TBooking>): Promise<TBooking> => {
  const result = await Booking.create(data);
  return result.toObject();
};

export const findById = async (
  id: string,
): Promise<TBookingDocument | null> => {
  return await Booking.findById(id);
};

export const findByIdLean = async (id: string): Promise<TBooking | null> => {
  return await Booking.findById(id).lean();
};

export const findAdminPaginated = async (
  query: Record<string, unknown>,
): Promise<{
  data: TBooking[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  const qp: Record<string, unknown> = { ...query };
  const statuses = ['pending', 'in_progress', 'completed', 'cancelled'];
  if (typeof qp.filter === 'string' && statuses.includes(qp.filter)) {
    qp.status = qp.filter;
  }

  const q = new AppQueryFind(Booking, qp)
    .search(['name', 'email', 'company', 'industry'])
    .filter()
    .sort()
    .paginate()
    .fields()
    .tap((c) => c.lean());

  return await q.execute([
    { key: 'pending', filter: { status: 'pending' } },
    { key: 'in_progress', filter: { status: 'in_progress' } },
    { key: 'completed', filter: { status: 'completed' } },
    { key: 'cancelled', filter: { status: 'cancelled' } },
  ]);
};

export const countPending = async (): Promise<number> => {
  return await Booking.countDocuments({ status: 'pending' });
};

export const updateById = async (
  id: string,
  payload: Partial<TBooking>,
): Promise<TBookingDocument | null> => {
  return await Booking.findByIdAndUpdate(id, payload, {
    new: true,
    runValidators: true,
  });
};

export const softDeleteById = async (id: string): Promise<void> => {
  await Booking.findByIdAndUpdate(id, {
    is_deleted: true,
    deleted_at: new Date(),
  });
};

export const hardDeleteById = async (id: string): Promise<void> => {
  await Booking.findByIdAndDelete(id).setOptions({ bypassDeleted: true });
};
