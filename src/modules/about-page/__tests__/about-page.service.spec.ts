jest.mock('../about-page.model', () => ({
  ABOUT_PAGE_SINGLETON_KEY: 'about',
  AboutPage: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

import httpStatus from 'http-status';
import { ABOUT_PAGE_SEED } from '../../../scripts/seeds/about-page.seed';
import { AboutPage } from '../about-page.model';
import * as AboutPageService from '../about-page.service';

const stored = {
  ...ABOUT_PAGE_SEED,
  singleton_key: 'about' as const,
  story_cards: ABOUT_PAGE_SEED.story_cards.map((item, index) => ({
    ...item,
    index: String(index + 1).padStart(2, '0'),
  })),
  gallery: ABOUT_PAGE_SEED.gallery.map((item, index) => ({
    ...item,
    index: String(index + 1).padStart(2, '0'),
  })),
  created_at: new Date(),
  updated_at: new Date(),
};

describe('AboutPageService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns null publicly when the active singleton is absent', async () => {
    (AboutPage.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(null),
    });
    await expect(AboutPageService.getPublicAboutPage()).resolves.toBeNull();
  });

  it('returns an explicit public allowlist', async () => {
    (AboutPage.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(stored),
    });
    const result = await AboutPageService.getPublicAboutPage();
    expect(result).toMatchObject({
      founder: stored.founder,
      gallery: stored.gallery,
    });
    expect(result).not.toHaveProperty('singleton_key');
    expect(result).not.toHaveProperty('is_active');
    expect(result).not.toHaveProperty('updated_at');
  });

  it('does not expose hidden public sections or nested items', async () => {
    const hidden = {
      ...stored,
      mission_section: { ...stored.mission_section, is_visible: false },
      story_cards: stored.story_cards.map((item, index) => ({
        ...item,
        is_visible: index === 0,
      })),
      founder: { ...stored.founder, is_visible: false },
      gallery_section: { ...stored.gallery_section, is_visible: false },
    };
    (AboutPage.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue(hidden),
    });

    const result = await AboutPageService.getPublicAboutPage();

    expect(result).toMatchObject({
      mission_section: null,
      mission: null,
      vision: null,
      founder: null,
      gallery_section: null,
      gallery: [],
    });
    expect(result?.story_cards).toHaveLength(1);
    expect(result?.story_cards[0].is_visible).toBe(true);
  });

  it('rejects duplicate story ids before accessing the database', async () => {
    await expect(
      AboutPageService.updateAboutPage({
        ...ABOUT_PAGE_SEED,
        story_cards: [
          ABOUT_PAGE_SEED.story_cards[0],
          { ...ABOUT_PAGE_SEED.story_cards[1], id: ' where-it-started ' },
        ],
      }),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Story card ids must be unique',
    });
    expect(AboutPage.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('atomically upserts and derives story/gallery indexes', async () => {
    (AboutPage.findOneAndUpdate as jest.Mock).mockResolvedValue(stored);

    await expect(
      AboutPageService.updateAboutPage(ABOUT_PAGE_SEED),
    ).resolves.toEqual(stored);
    const [, update, options] = (AboutPage.findOneAndUpdate as jest.Mock).mock
      .calls[0];
    expect(update.$set.story_cards[0].index).toBe('01');
    expect(update.$set.gallery[0].index).toBe('01');
    expect(update.$setOnInsert).toEqual({ singleton_key: 'about' });
    expect(options).toMatchObject({ upsert: true, runValidators: true });
  });
});
