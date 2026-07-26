import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import {
  isSafeImageReference,
  isSafeVideoReference,
} from '../cms-content/cms-content.security';
import * as IndustryRepository from '../industry/industry.repository';
import * as TestimonialRepository from './testimonial.repository';
import {
  TTestimonial,
  TTestimonialCategory,
  TTestimonialPopulated,
  TVideoRef,
} from './testimonial.type';

const ensureIndustryExists = async (
  industry: TTestimonial['industry'] | undefined,
): Promise<string> => {
  const industryId = industry?.toString() ?? '';
  if (!industryId) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Industry is required');
  }

  const exists = await IndustryRepository.findByIdLean(industryId);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  }
  return industryId;
};

type TRenderableTestimonialState = {
  image?: string;
  category?: TTestimonialCategory;
  message?: string;
  video_message?: TVideoRef;
  thumbnail?: string;
};

const ensureRenderableCategoryState = (
  testimonial: TRenderableTestimonialState,
): void => {
  if (!testimonial.image?.trim() || !isSafeImageReference(testimonial.image)) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'A safe testimonial image is required',
    );
  }

  if (testimonial.category === 'message') {
    if (
      !testimonial.message?.trim() ||
      testimonial.message.trim().length < 10
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Message text is required (min 10 chars) for a text testimonial',
      );
    }
    return;
  }

  if (testimonial.category === 'video_message') {
    if (!testimonial.video_message?.value?.trim()) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Video is required for a video testimonial',
      );
    }
    if (
      !isSafeVideoReference(
        testimonial.video_message.source,
        testimonial.video_message.value,
      )
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'A safe video is required for a video testimonial',
      );
    }

    if (
      testimonial.video_message.source !== 'youtube' &&
      (!testimonial.thumbnail?.trim() ||
        !isSafeImageReference(testimonial.thumbnail))
    ) {
      throw new AppError(
        httpStatus.BAD_REQUEST,
        'Thumbnail is required for URL and uploaded video testimonials',
      );
    }
    return;
  }

  throw new AppError(
    httpStatus.BAD_REQUEST,
    'Testimonial category is required',
  );
};

export const createTestimonial = async (
  data: Partial<TTestimonial>,
): Promise<TTestimonialPopulated> => {
  const industry = await ensureIndustryExists(data.industry);
  ensureRenderableCategoryState(data);

  const nextData = { ...data, industry };
  if (data.category === 'message') {
    delete nextData.video_message;
    delete nextData.thumbnail;
  } else {
    delete nextData.message;
  }

  const created = await TestimonialRepository.create(nextData);
  return (await TestimonialRepository.findByIdLean(created._id.toString()))!;
};

export const getPublicTestimonials = async (
  query: { industry_slug?: string } = {},
): Promise<{
  data: TTestimonialPopulated[];
}> => {
  const data = await TestimonialRepository.findPublic(
    query.industry_slug?.trim().toLowerCase(),
  );
  return { data };
};

export const getTestimonials = async (
  query: Record<string, unknown>,
): Promise<{
  data: TTestimonialPopulated[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await TestimonialRepository.findAdminPaginated(query);
};

export const getTestimonial = async (
  id: string,
): Promise<TTestimonialPopulated> => {
  const result = await TestimonialRepository.findByIdLean(id);
  if (!result) {
    throw new AppError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  return result;
};

export const updateTestimonial = async (
  id: string,
  payload: Partial<TTestimonial>,
): Promise<TTestimonialPopulated> => {
  const exists = await TestimonialRepository.findByIdLean(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  const nextPayload = { ...payload };
  if (payload.industry !== undefined) {
    nextPayload.industry = await ensureIndustryExists(payload.industry);
  }

  const finalState: TRenderableTestimonialState = {
    image: payload.image ?? exists.image,
    category: payload.category ?? exists.category,
    message: payload.message ?? exists.message,
    video_message: payload.video_message ?? exists.video_message,
    thumbnail: payload.thumbnail ?? exists.thumbnail,
  };
  ensureRenderableCategoryState(finalState);

  const unsetFields: TestimonialRepository.TTestimonialUnsetField[] = [];
  if (finalState.category === 'message') {
    delete nextPayload.video_message;
    delete nextPayload.thumbnail;
    unsetFields.push('video_message', 'thumbnail');
  } else {
    delete nextPayload.message;
    unsetFields.push('message');
  }

  await TestimonialRepository.updateById(id, nextPayload, unsetFields);
  return (await TestimonialRepository.findByIdLean(id))!;
};

export const reorderTestimonials = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  const ids = items.map((item) => item._id);
  if (new Set(ids).size !== ids.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Testimonial reorder items must be unique',
    );
  }

  if ((await TestimonialRepository.countExistingByIds(ids)) !== ids.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'One or more testimonials were not found',
    );
  }

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

export const restoreTestimonial = async (
  id: string,
): Promise<TTestimonialPopulated> => {
  const exists = await TestimonialRepository.findByIdWithDeleted(id);
  if (!exists) {
    throw new AppError(httpStatus.NOT_FOUND, 'Testimonial not found');
  }
  await ensureIndustryExists(exists.industry);
  ensureRenderableCategoryState(exists);

  const result = await TestimonialRepository.restoreById(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Testimonial not found or not deleted',
    );
  }
  return (await TestimonialRepository.findByIdLean(id))!;
};
