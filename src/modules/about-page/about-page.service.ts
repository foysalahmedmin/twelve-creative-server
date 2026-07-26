import { randomUUID } from 'node:crypto';
import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { ABOUT_PAGE_SINGLETON_KEY, AboutPage } from './about-page.model';
import {
  TAboutGalleryItemInput,
  TAboutPage,
  TAboutPageInput,
  TAboutStoryCardInput,
  TPublicAboutPage,
} from './about-page.type';

const assertUniqueIds = (
  items: { id?: string }[],
  collectionName: string,
): void => {
  const ids = items
    .map((item) => item.id?.trim())
    .filter((id): id is string => Boolean(id));
  if (new Set(ids).size !== ids.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      `${collectionName} ids must be unique`,
    );
  }
};

const normalizeStoryCards = (items: TAboutStoryCardInput[]) => {
  assertUniqueIds(items, 'Story card');
  return items.map((item, position) => ({
    ...item,
    id: item.id?.trim() || randomUUID(),
    index: String(position + 1).padStart(2, '0'),
  }));
};

const normalizeGallery = (items: TAboutGalleryItemInput[]) => {
  assertUniqueIds(items, 'Gallery item');
  return items.map((item, position) => ({
    ...item,
    id: item.id?.trim() || randomUUID(),
    index: String(position + 1).padStart(2, '0'),
  }));
};

export const getAboutPage = async (): Promise<TAboutPage | null> =>
  await AboutPage.findOne({ singleton_key: ABOUT_PAGE_SINGLETON_KEY }).lean();

export const getPublicAboutPage =
  async (): Promise<TPublicAboutPage | null> => {
    const page = await AboutPage.findOne({
      singleton_key: ABOUT_PAGE_SINGLETON_KEY,
      is_active: true,
    }).lean();
    if (!page) return null;

    const missionVisible = page.mission_section.is_visible;
    const storyVisible = page.story_section.is_visible;
    const galleryVisible = page.gallery_section.is_visible;

    return {
      mission_section: missionVisible ? page.mission_section : null,
      mission: missionVisible && page.mission.is_visible ? page.mission : null,
      vision: missionVisible && page.vision.is_visible ? page.vision : null,
      story_section: storyVisible ? page.story_section : null,
      story_cards: storyVisible
        ? page.story_cards.filter((item) => item.is_visible)
        : [],
      founder: page.founder.is_visible ? page.founder : null,
      gallery_section: galleryVisible ? page.gallery_section : null,
      gallery: galleryVisible
        ? page.gallery.filter((item) => item.is_visible)
        : [],
    };
  };

export const updateAboutPage = async (
  payload: TAboutPageInput,
): Promise<TAboutPage> => {
  const normalized = {
    ...payload,
    story_cards: normalizeStoryCards(payload.story_cards),
    gallery: normalizeGallery(payload.gallery),
  };

  const updated = await AboutPage.findOneAndUpdate(
    { singleton_key: ABOUT_PAGE_SINGLETON_KEY },
    {
      $set: normalized,
      $setOnInsert: { singleton_key: ABOUT_PAGE_SINGLETON_KEY },
    },
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
