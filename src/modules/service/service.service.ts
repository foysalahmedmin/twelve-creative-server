import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { Service } from './service.model';
import * as ServiceRepository from './service.repository';
import { TService } from './service.type';

const ensureSlugUnique = async (
  slug: string,
  excludeId?: string,
): Promise<void> => {
  const existing = await Service.findOne({ slug });
  if (existing && existing._id.toString() !== excludeId) {
    throw new AppError(
      httpStatus.CONFLICT,
      `A service with slug "${slug}" already exists`,
    );
  }
};

export const createService = async (
  data: Partial<TService>,
): Promise<TService> => {
  if (data.slug) await ensureSlugUnique(data.slug);
  return await ServiceRepository.create(data);
};

export const getPublicServices = async (): Promise<{
  data: TService[];
}> => {
  const data = await ServiceRepository.findPublic();
  return { data };
};

export const getServices = async (
  query: Record<string, unknown>,
): Promise<{
  data: TService[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await ServiceRepository.findAdminPaginated(query);
};

export const getService = async (id: string): Promise<TService> => {
  const result = await ServiceRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  return result;
};

export const updateService = async (
  id: string,
  payload: Partial<TService>,
): Promise<TService> => {
  const exists = await ServiceRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  if (payload.slug && payload.slug !== exists.slug) {
    await ensureSlugUnique(payload.slug, id);
  }
  const result = await ServiceRepository.updateById(id, payload);
  return result!;
};

export const reorderServices = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await ServiceRepository.updateOrder(items);
};

export const deleteService = async (id: string): Promise<void> => {
  const service = await ServiceRepository.findById(id);
  if (!service) throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  await service.softDelete();
};

export const deleteServicePermanent = async (id: string): Promise<void> => {
  const exists = await ServiceRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Service not found');
  await ServiceRepository.hardDeleteById(id);
};

export const restoreService = async (id: string): Promise<TService> => {
  const result = await ServiceRepository.restoreById(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Service not found or not deleted',
    );
  }
  return result;
};
