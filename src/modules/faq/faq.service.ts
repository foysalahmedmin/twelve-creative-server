import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as FaqRepository from './faq.repository';
import { TFaq } from './faq.type';

export const createFaq = async (data: Partial<TFaq>): Promise<TFaq> => {
  return await FaqRepository.create(data);
};

export const getPublicFaqs = async (): Promise<{ data: TFaq[] }> => {
  const data = await FaqRepository.findPublic();
  return { data };
};

export const getFaqs = async (
  query: Record<string, unknown>,
): Promise<{
  data: TFaq[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await FaqRepository.findAdminPaginated(query);
};

export const getFaq = async (id: string): Promise<TFaq> => {
  const result = await FaqRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'FAQ not found');
  return result;
};

export const updateFaq = async (
  id: string,
  payload: Partial<TFaq>,
): Promise<TFaq> => {
  const exists = await FaqRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'FAQ not found');
  const result = await FaqRepository.updateById(id, payload);
  return result!;
};

export const reorderFaqs = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await FaqRepository.updateOrder(items);
};

export const deleteFaq = async (id: string): Promise<void> => {
  const faq = await FaqRepository.findById(id);
  if (!faq) throw new AppError(httpStatus.NOT_FOUND, 'FAQ not found');
  await faq.softDelete();
};

export const deleteFaqPermanent = async (id: string): Promise<void> => {
  const exists = await FaqRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'FAQ not found');
  await FaqRepository.hardDeleteById(id);
};

export const restoreFaq = async (id: string): Promise<TFaq> => {
  const exists = await FaqRepository.findByIdWithDeleted(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'FAQ not found');

  const restored = await FaqRepository.restoreById(id);
  if (!restored) {
    throw new AppError(httpStatus.NOT_FOUND, 'FAQ not found or not deleted');
  }
  return (await FaqRepository.findByIdLean(id))!;
};
