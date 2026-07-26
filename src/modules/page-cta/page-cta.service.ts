import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as IndustryRepository from '../industry/industry.repository';
import { PageCta } from './page-cta.model';
import {
  TPageCta,
  TPageCtaPlacement,
  TPageCtaPopulated,
  TPublicPageCta,
} from './page-cta.type';

const INDUSTRY_PROJECTION = '_id name slug order is_active';

type TPageCtaInput = Omit<
  TPageCta,
  '_id' | 'created_at' | 'updated_at' | 'industry' | 'is_active'
> & {
  industry?: string | null;
  is_active?: boolean;
};

const ensureIndustryExists = async (
  industry: string | null | undefined,
): Promise<string | null> => {
  if (!industry) return null;
  const exists = await IndustryRepository.findByIdLean(industry);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Industry not found');
  return industry;
};

const ensureValidScope = (
  placement: TPageCtaPlacement,
  industry: string | null,
): void => {
  if (industry && placement !== 'industry-detail') {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Industry overrides are only valid for industry-detail CTAs',
    );
  }
};

const toPublicPageCta = (cta: TPageCta): TPublicPageCta => ({
  placement: cta.placement,
  eyebrow: cta.eyebrow,
  title: cta.title,
  description: cta.description,
  image: cta.image,
  primary_cta: cta.primary_cta,
  secondary_cta: cta.secondary_cta,
});

const findPopulatedById = async (
  id: string,
): Promise<TPageCtaPopulated | null> =>
  await PageCta.findById(id)
    .populate('industry', INDUSTRY_PROJECTION)
    .lean<TPageCtaPopulated>();

export const getPublicPageCta = async (
  placement: TPageCtaPlacement,
  industrySlug?: string,
): Promise<TPublicPageCta | null> => {
  let industryId: string | null = null;
  if (industrySlug) {
    const normalizedSlug = industrySlug.trim().toLowerCase();
    const industry = await IndustryRepository.findBySlugLean(normalizedSlug);
    if (industry?.is_active) industryId = industry._id!.toString();
  }

  const scopes = industryId
    ? [
        { placement, industry: industryId },
        { placement, industry: null },
      ]
    : [{ placement, industry: null }];

  for (const scope of scopes) {
    const cta = await PageCta.findOne({ ...scope, is_active: true }).lean();
    if (cta) return toPublicPageCta(cta);
  }
  return null;
};

export const getPageCtas = async (query: {
  placement?: TPageCtaPlacement;
  industry?: string;
}): Promise<TPageCtaPopulated[]> => {
  const filter: Record<string, unknown> = {};
  if (query.placement) filter.placement = query.placement;
  if (query.industry) filter.industry = query.industry;

  return await PageCta.find(filter)
    .populate('industry', INDUSTRY_PROJECTION)
    .sort({ placement: 1, created_at: 1 })
    .lean<TPageCtaPopulated[]>();
};

export const getPageCta = async (id: string): Promise<TPageCtaPopulated> => {
  const cta = await findPopulatedById(id);
  if (!cta) throw new AppError(httpStatus.NOT_FOUND, 'Page CTA not found');
  return cta;
};

export const createPageCta = async (
  payload: TPageCtaInput,
): Promise<TPageCtaPopulated> => {
  const industry = await ensureIndustryExists(payload.industry);
  ensureValidScope(payload.placement, industry);

  const duplicate = await PageCta.findOne({
    placement: payload.placement,
    industry,
  }).lean();
  if (duplicate) {
    throw new AppError(
      httpStatus.CONFLICT,
      'A Page CTA already exists for this placement and industry scope',
    );
  }

  const created = await PageCta.create({ ...payload, industry });
  return (await findPopulatedById(created._id.toString()))!;
};

export const upsertPageCta = async (
  payload: TPageCtaInput,
): Promise<TPageCtaPopulated> => {
  const industry = await ensureIndustryExists(payload.industry);
  ensureValidScope(payload.placement, industry);

  const updated = await PageCta.findOneAndUpdate(
    { placement: payload.placement, industry },
    { $set: { ...payload, industry } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
  );
  return (await findPopulatedById(updated!._id.toString()))!;
};

export const updatePageCta = async (
  id: string,
  payload: Partial<TPageCtaInput>,
): Promise<TPageCtaPopulated> => {
  const existing = await PageCta.findById(id).lean();
  if (!existing) throw new AppError(httpStatus.NOT_FOUND, 'Page CTA not found');

  const industry =
    payload.industry === undefined
      ? (existing.industry?.toString() ?? null)
      : await ensureIndustryExists(payload.industry);
  const placement = payload.placement ?? existing.placement;
  ensureValidScope(placement, industry);

  const duplicate = await PageCta.findOne({
    _id: { $ne: id },
    placement,
    industry,
  }).lean();
  if (duplicate) {
    throw new AppError(
      httpStatus.CONFLICT,
      'A Page CTA already exists for this placement and industry scope',
    );
  }

  await PageCta.findByIdAndUpdate(
    id,
    { $set: { ...payload, industry } },
    { new: true, runValidators: true },
  );
  return (await findPopulatedById(id))!;
};

export const deletePageCta = async (id: string): Promise<void> => {
  const deleted = await PageCta.findByIdAndDelete(id);
  if (!deleted) throw new AppError(httpStatus.NOT_FOUND, 'Page CTA not found');
};
