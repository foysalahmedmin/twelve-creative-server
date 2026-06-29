import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as BrandRepository from './brand.repository';
import { TBrand } from './brand.type';

export const createBrand = async (data: Partial<TBrand>): Promise<TBrand> => {
  return await BrandRepository.create(data);
};

export const getPublicBrands = async (): Promise<{ data: TBrand[] }> => {
  const data = await BrandRepository.findPublic();
  return { data };
};

export const getBrands = async (
  query: Record<string, unknown>,
): Promise<{
  data: TBrand[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await BrandRepository.findAdminPaginated(query);
};

export const getBrand = async (id: string): Promise<TBrand> => {
  const result = await BrandRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Brand not found');
  return result;
};

export const updateBrand = async (
  id: string,
  payload: Partial<TBrand>,
): Promise<TBrand> => {
  const exists = await BrandRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Brand not found');
  const result = await BrandRepository.updateById(id, payload);
  return result!;
};

export const reorderBrands = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await BrandRepository.updateOrder(items);
};

export const deleteBrand = async (id: string): Promise<void> => {
  const brand = await BrandRepository.findById(id);
  if (!brand) throw new AppError(httpStatus.NOT_FOUND, 'Brand not found');
  await brand.softDelete();
};

export const deleteBrandPermanent = async (id: string): Promise<void> => {
  const exists = await BrandRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Brand not found');
  await BrandRepository.hardDeleteById(id);
};
