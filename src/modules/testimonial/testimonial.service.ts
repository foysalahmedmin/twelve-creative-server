import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as TestimonialRepository from './testimonial.repository';
import { TTestimonial } from './testimonial.type';

export const createTestimonial = async (
  data: Partial<TTestimonial>,
): Promise<TTestimonial> => {
  return await TestimonialRepository.create(data);
};

export const getPublicTestimonials = async (): Promise<{
  data: TTestimonial[];
}> => {
  const data = await TestimonialRepository.findPublic();
  return { data };
};

export const getTestimonials = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTestimonial[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await TestimonialRepository.findAdminPaginated(query);
};

export const getTestimonial = async (id: string): Promise<TTestimonial> => {
  const result = await TestimonialRepository.findByIdLean(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  return result;
};

export const updateTestimonial = async (
  id: string,
  payload: Partial<TTestimonial>,
): Promise<TTestimonial> => {
  const exists = await TestimonialRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  const result = await TestimonialRepository.updateById(id, payload);
  return result!;
};

export const reorderTestimonials = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  await TestimonialRepository.updateOrder(items);
};

export const deleteTestimonial = async (id: string): Promise<void> => {
  const testimonial = await TestimonialRepository.findById(id);
  if (!testimonial) {
    throw new AppError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  await testimonial.softDelete();
};

export const deleteTestimonialPermanent = async (id: string): Promise<void> => {
  const exists = await TestimonialRepository.findByIdWithDeleted(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  await TestimonialRepository.hardDeleteById(id);
};

export const restoreTestimonial = async (id: string): Promise<TTestimonial> => {
  const result = await TestimonialRepository.restoreById(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Testimonial not found or not deleted',
    );
  }
  return result;
};
