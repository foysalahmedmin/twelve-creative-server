import { PageHero } from './page-hero.model';
import { TPageHero, TPageKey } from './page-hero.type';

export const getAllPageHeroes = async (): Promise<TPageHero[]> => {
  return await PageHero.find().sort({ page: 1 }).lean();
};

export const getPageHeroByPage = async (
  page: TPageKey,
): Promise<TPageHero | null> => {
  return await PageHero.findOne({ page }).lean();
};

export const getPublicPageHeroByPage = async (
  page: TPageKey,
): Promise<TPageHero | null> => {
  return await PageHero.findOne({ page, is_active: true })
    .select(
      'page label title description thumbnail video trust_label primary_cta secondary_cta is_active -_id',
    )
    .lean();
};

export const upsertPageHero = async (
  page: TPageKey,
  payload: Partial<Omit<TPageHero, 'page' | '_id'>>,
): Promise<TPageHero> => {
  const set: Record<string, unknown> = {};
  const unset: Record<string, 1> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === null) unset[k] = 1;
    else if (v !== undefined) set[k] = v;
  }
  const update: Record<string, unknown> = {};
  if (Object.keys(set).length) update.$set = set;
  if (Object.keys(unset).length) update.$unset = unset;
  const result = await PageHero.findOneAndUpdate({ page }, update, {
    upsert: true,
    new: true,
    lean: true,
  });
  return result!;
};
