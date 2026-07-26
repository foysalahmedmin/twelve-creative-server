import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { normalizeMarkdown } from '../cms-content/cms-content.security';
import { LegalPage } from './legal-page.model';
import {
  TLegalPage,
  TLegalPageInput,
  TLegalPageSlug,
  TPublicLegalPage,
} from './legal-page.type';

const toPublicLegalPage = (page: TLegalPage): TPublicLegalPage => ({
  slug: page.slug,
  title: page.title,
  markdown: page.markdown,
  effective_date: page.effective_date,
  seo: page.seo,
});

export const getPublicLegalPage = async (
  slug: TLegalPageSlug,
): Promise<TPublicLegalPage | null> => {
  const page = await LegalPage.findOne({ slug, is_published: true }).lean();
  return page ? toPublicLegalPage(page) : null;
};

export const getLegalPages = async (): Promise<TLegalPage[]> =>
  await LegalPage.find().sort({ slug: 1 }).lean();

export const getLegalPage = async (
  slug: TLegalPageSlug,
): Promise<TLegalPage | null> => await LegalPage.findOne({ slug }).lean();

export const upsertLegalPage = async (
  slug: TLegalPageSlug,
  payload: TLegalPageInput,
): Promise<TLegalPage> => {
  if (slug !== payload.slug) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'Route slug must match the legal page payload slug',
    );
  }
  if (payload.is_published && !payload.effective_date) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'An effective date is required before publishing',
    );
  }

  const updated = await LegalPage.findOneAndUpdate(
    { slug },
    { $set: { ...payload, markdown: normalizeMarkdown(payload.markdown) } },
    {
      upsert: true,
      new: true,
      lean: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );
  return updated!;
};
