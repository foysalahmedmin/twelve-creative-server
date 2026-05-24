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

export const upsertPageHero = async (
  page: TPageKey,
  payload: Partial<Omit<TPageHero, 'page' | '_id'>>,
): Promise<TPageHero> => {
  const cleaned: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v !== null && v !== undefined) cleaned[k] = v;
  }
  const result = await PageHero.findOneAndUpdate(
    { page },
    { $set: cleaned },
    { upsert: true, new: true, lean: true },
  );
  return result!;
};
