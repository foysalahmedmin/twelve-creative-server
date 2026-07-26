import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as BookingRepository from '../booking/booking.repository';
import * as FeaturedProjectRepository from '../featured-project/featured-project.repository';
import * as PageCtaRepository from '../page-cta/page-cta.repository';
import * as ShowcaseVideoRepository from '../showcase-video/showcase-video.repository';
import * as TestimonialRepository from '../testimonial/testimonial.repository';
import * as WorkRepository from '../work/work.repository';
import { Industry } from './industry.model';
import * as IndustryRepository from './industry.repository';
import { TIndustry, TIndustryOption } from './industry.type';

const ensureSlugUnique = async (
  slug: string,
  excludeId?: string,
): Promise<void> => {
  const existing = await Industry.findOne({ slug });
  if (existing && existing._id.toString() !== excludeId) {
    throw new AppError(
      httpStatus.CONFLICT,
      `An industry with slug "${slug}" already exists`,
    );
  }
};

const ensureIndustryHasNoReferences = async (
  id: string,
  includeHistoricalBookings = false,
): Promise<void> => {
  const [featuredProjects, showcaseVideos, testimonials, works, pageCtas] =
    await Promise.all([
      FeaturedProjectRepository.countByIndustry(id),
      ShowcaseVideoRepository.countByIndustry(id),
      TestimonialRepository.countByIndustry(id),
      WorkRepository.countByIndustry(id),
      PageCtaRepository.countByIndustry(id),
    ]);
  const bookings = includeHistoricalBookings
    ? await BookingRepository.countByIndustry(id)
    : 0;

  if (
    featuredProjects > 0 ||
    showcaseVideos > 0 ||
    testimonials > 0 ||
    works > 0 ||
    pageCtas > 0 ||
    bookings > 0
  ) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Industry is referenced by ${featuredProjects} featured project(s), ${showcaseVideos} showcase video(s), ${testimonials} testimonial(s), ${works} work(s), ${pageCtas} page CTA override(s), and ${bookings} historical booking(s). Reassign or permanently delete content records first; booking history must be retained.`,
    );
  }
};

export const createIndustry = async (
  data: Partial<TIndustry>,
): Promise<TIndustry> => {
  if (data.slug) await ensureSlugUnique(data.slug);
  return await IndustryRepository.create(data);
};

export const getPublicIndustries = async (): Promise<{
  data: TIndustry[];
}> => {
  const data = await IndustryRepository.findPublic();
  return { data };
};

export const getIndustryOptions = async (): Promise<TIndustryOption[]> => {
  return await IndustryRepository.findOptions();
};

export const getIndustries = async (
  query: Record<string, unknown>,
): Promise<{
  data: TIndustry[];
  meta: { total: number; page: number; limit: number; total_pages: number };
}> => {
  return await IndustryRepository.findAdminPaginated(query);
};

export const getIndustry = async (id: string): Promise<TIndustry> => {
  const result = await IndustryRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  return result;
};

export const updateIndustry = async (
  id: string,
  payload: Partial<TIndustry>,
): Promise<TIndustry> => {
  const exists = await IndustryRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  if (payload.slug && payload.slug !== exists.slug) {
    await ensureSlugUnique(payload.slug, id);
  }
  const result = await IndustryRepository.updateById(id, payload);
  return result!;
};

export const reorderIndustries = async (
  items: { _id: string; order: number }[],
): Promise<void> => {
  const ids = items.map((item) => item._id);
  if (new Set(ids).size !== ids.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Industry reorder items must be unique',
    );
  }

  if ((await IndustryRepository.countExistingByIds(ids)) !== ids.length) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'One or more industries were not found',
    );
  }

  await IndustryRepository.updateOrder(items);
};

export const deleteIndustry = async (id: string): Promise<void> => {
  const industry = await IndustryRepository.findById(id);
  if (!industry) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  await ensureIndustryHasNoReferences(id);
  await industry.softDelete();
};

export const deleteIndustryPermanent = async (id: string): Promise<void> => {
  const exists = await IndustryRepository.findByIdWithDeletedLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  await ensureIndustryHasNoReferences(id, true);
  await IndustryRepository.hardDeleteById(id);
};

export const restoreIndustry = async (id: string): Promise<TIndustry> => {
  const exists = await IndustryRepository.findByIdWithDeletedLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  await ensureSlugUnique(exists.slug, id);

  const result = await IndustryRepository.restoreById(id);
  if (!result) {
    throw new AppError(
      httpStatus.NOT_FOUND,
      'Industry not found or not deleted',
    );
  }
  return result;
};
