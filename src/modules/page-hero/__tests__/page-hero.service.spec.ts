jest.mock('../page-hero.model', () => ({
  PageHero: {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

import { PageHero } from '../page-hero.model';
import * as PageHeroService from '../page-hero.service';

const hero = {
  _id: '507f1f77bcf86cd799439011',
  page: 'home' as const,
  title: 'Creative stories that move people',
  is_active: true,
};

describe('PageHeroService', () => {
  it('returns all page heroes sorted by page', async () => {
    const lean = jest.fn().mockResolvedValue([hero]);
    const sort = jest.fn().mockReturnValue({ lean });
    (PageHero.find as jest.Mock).mockReturnValue({ sort });

    await expect(PageHeroService.getAllPageHeroes()).resolves.toEqual([hero]);
    expect(PageHero.find).toHaveBeenCalledWith();
    expect(sort).toHaveBeenCalledWith({ page: 1 });
    expect(lean).toHaveBeenCalledWith();
  });

  it('returns the page hero or null by page key', async () => {
    const lean = jest
      .fn()
      .mockResolvedValueOnce(hero)
      .mockResolvedValueOnce(null);
    (PageHero.findOne as jest.Mock).mockReturnValue({ lean });

    await expect(PageHeroService.getPageHeroByPage('home')).resolves.toEqual(
      hero,
    );
    await expect(
      PageHeroService.getPageHeroByPage('about'),
    ).resolves.toBeNull();
    expect(PageHero.findOne).toHaveBeenNthCalledWith(1, { page: 'home' });
    expect(PageHero.findOne).toHaveBeenNthCalledWith(2, { page: 'about' });
  });

  it('only returns active public hero fields', async () => {
    const lean = jest.fn().mockResolvedValueOnce(hero).mockResolvedValue(null);
    const select = jest.fn().mockReturnValue({ lean });
    (PageHero.findOne as jest.Mock).mockReturnValue({ select });

    await expect(
      PageHeroService.getPublicPageHeroByPage('home'),
    ).resolves.toEqual(hero);
    await expect(
      PageHeroService.getPublicPageHeroByPage('about'),
    ).resolves.toBeNull();

    expect(PageHero.findOne).toHaveBeenNthCalledWith(1, {
      page: 'home',
      is_active: true,
    });
    expect(PageHero.findOne).toHaveBeenNthCalledWith(2, {
      page: 'about',
      is_active: true,
    });
    expect(select).toHaveBeenCalledWith(
      'page label title description thumbnail video trust_label primary_cta secondary_cta is_active -_id',
    );
  });

  it('upserts defined values and unsets explicit null values', async () => {
    (PageHero.findOneAndUpdate as jest.Mock).mockResolvedValue(hero);

    const result = await PageHeroService.upsertPageHero('home', {
      title: 'Updated title',
      description: null as unknown as string,
      label: undefined,
      is_active: false,
    });

    expect(PageHero.findOneAndUpdate).toHaveBeenCalledWith(
      { page: 'home' },
      {
        $set: { title: 'Updated title', is_active: false },
        $unset: { description: 1 },
      },
      { upsert: true, new: true, lean: true },
    );
    expect(result).toEqual(hero);
  });

  it('uses an empty update when the payload contains only undefined values', async () => {
    (PageHero.findOneAndUpdate as jest.Mock).mockResolvedValue(hero);

    await PageHeroService.upsertPageHero('home', { title: undefined });

    expect(PageHero.findOneAndUpdate).toHaveBeenCalledWith(
      { page: 'home' },
      {},
      { upsert: true, new: true, lean: true },
    );
  });
});
