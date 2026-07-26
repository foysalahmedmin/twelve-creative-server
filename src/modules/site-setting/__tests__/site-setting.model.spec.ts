import {
  getOrCreateSiteSetting,
  getOrCreateSiteSettingDocument,
  SITE_SETTING_SINGLETON_KEY,
  SiteSettingSingletonIntegrityError,
  SiteSetting,
} from '../site-setting.model';

describe('SiteSetting singleton ensure', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const findQuery = (result: unknown) => {
    const lean = jest.fn().mockResolvedValue(result);
    const select = jest.fn().mockReturnValue({ lean });
    return { query: { select }, select, lean };
  };

  it('returns an existing canonical singleton without attempting an upsert', async () => {
    const existing = {
      singleton_key: SITE_SETTING_SINGLETON_KEY,
      contact_email: 'hello@example.com',
    };
    const canonicalQuery = findQuery(existing);
    jest
      .spyOn(SiteSetting, 'findOne')
      .mockReturnValue(canonicalQuery.query as never);
    jest.spyOn(SiteSetting, 'countDocuments').mockResolvedValue(1);
    const upsert = jest.spyOn(SiteSetting, 'findOneAndUpdate');

    await expect(getOrCreateSiteSetting()).resolves.toEqual({
      contact_email: 'hello@example.com',
    });

    expect(SiteSetting.findOne).toHaveBeenCalledWith({
      singleton_key: SITE_SETTING_SINGLETON_KEY,
    });
    expect(canonicalQuery.select).toHaveBeenCalledWith('+singleton_key');
    expect(upsert).not.toHaveBeenCalled();
  });

  it('backfills the unique key on an existing legacy singleton', async () => {
    const canonicalQuery = findQuery(null);
    const legacyQuery = findQuery({
      _id: '507f1f77bcf86cd799439011',
      contact_email: 'legacy@example.com',
    });
    const migratedQuery = findQuery({
      _id: '507f1f77bcf86cd799439011',
      singleton_key: SITE_SETTING_SINGLETON_KEY,
      contact_email: 'legacy@example.com',
    });
    jest
      .spyOn(SiteSetting, 'findOne')
      .mockReturnValueOnce(canonicalQuery.query as never)
      .mockReturnValueOnce(legacyQuery.query as never);
    jest.spyOn(SiteSetting, 'countDocuments').mockResolvedValue(1);
    const update = jest
      .spyOn(SiteSetting, 'findOneAndUpdate')
      .mockReturnValue(migratedQuery.query as never);

    await expect(getOrCreateSiteSetting()).resolves.toEqual({
      _id: '507f1f77bcf86cd799439011',
      contact_email: 'legacy@example.com',
    });

    expect(update).toHaveBeenCalledWith(
      {
        _id: '507f1f77bcf86cd799439011',
        singleton_key: { $ne: SITE_SETTING_SINGLETON_KEY },
      },
      { $set: { singleton_key: SITE_SETTING_SINGLETON_KEY } },
      { new: true, runValidators: true },
    );
    expect(migratedQuery.select).toHaveBeenCalledWith('+singleton_key');
  });

  it('atomically upserts the fixed unique singleton on an empty database', async () => {
    const created = {
      singleton_key: SITE_SETTING_SINGLETON_KEY,
      contact_email: undefined,
    };
    const canonicalQuery = findQuery(null);
    const legacyQuery = findQuery(null);
    const createdQuery = findQuery(created);
    jest
      .spyOn(SiteSetting, 'findOne')
      .mockReturnValueOnce(canonicalQuery.query as never)
      .mockReturnValueOnce(legacyQuery.query as never);
    jest.spyOn(SiteSetting, 'countDocuments').mockResolvedValue(0);
    const upsert = jest
      .spyOn(SiteSetting, 'findOneAndUpdate')
      .mockReturnValue(createdQuery.query as never);

    await expect(getOrCreateSiteSetting()).resolves.toEqual({
      contact_email: undefined,
    });

    expect(upsert).toHaveBeenCalledWith(
      { singleton_key: SITE_SETTING_SINGLETON_KEY },
      { $setOnInsert: { singleton_key: SITE_SETTING_SINGLETON_KEY } },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    expect(createdQuery.select).toHaveBeenCalledWith('+singleton_key');
    expect(createdQuery.lean).toHaveBeenCalledWith();
  });

  it('fails closed when duplicate legacy or canonical records exist', async () => {
    jest.spyOn(SiteSetting, 'countDocuments').mockResolvedValue(2);
    const findOne = jest.spyOn(SiteSetting, 'findOne');
    const update = jest.spyOn(SiteSetting, 'findOneAndUpdate');

    await expect(getOrCreateSiteSetting()).rejects.toEqual(
      expect.objectContaining({
        name: 'SiteSettingSingletonIntegrityError',
        message: expect.stringContaining('found 2 records'),
      }),
    );
    expect(findOne).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
    expect(new SiteSettingSingletonIntegrityError(3)).toBeInstanceOf(Error);
  });

  it('resolves the managed write document by the fixed singleton key', async () => {
    const leanSetting = {
      _id: '507f1f77bcf86cd799439011',
      singleton_key: SITE_SETTING_SINGLETON_KEY,
      contact_email: 'hello@example.com',
    };
    const canonicalQuery = findQuery(leanSetting);
    const managedDocument = {
      _id: leanSetting._id,
      contact_email: leanSetting.contact_email,
      save: jest.fn(),
    };
    jest.spyOn(SiteSetting, 'countDocuments').mockResolvedValue(1);
    jest
      .spyOn(SiteSetting, 'findOne')
      .mockReturnValueOnce(canonicalQuery.query as never)
      .mockResolvedValueOnce(managedDocument as never);

    await expect(getOrCreateSiteSettingDocument()).resolves.toBe(
      managedDocument,
    );
    expect(SiteSetting.findOne).toHaveBeenLastCalledWith({
      singleton_key: SITE_SETTING_SINGLETON_KEY,
    });
  });

  it('aborts a write lookup if a duplicate appears after singleton ensure', async () => {
    const canonicalQuery = findQuery({
      _id: '507f1f77bcf86cd799439011',
      singleton_key: SITE_SETTING_SINGLETON_KEY,
    });
    jest
      .spyOn(SiteSetting, 'countDocuments')
      .mockResolvedValueOnce(1)
      .mockResolvedValueOnce(2);
    jest
      .spyOn(SiteSetting, 'findOne')
      .mockReturnValueOnce(canonicalQuery.query as never)
      .mockResolvedValueOnce({ _id: '507f1f77bcf86cd799439011' } as never);

    await expect(getOrCreateSiteSettingDocument()).rejects.toMatchObject({
      name: 'SiteSettingSingletonIntegrityError',
      message: expect.stringContaining('found 2 records'),
    });
  });
});

describe('SiteSetting model-managed references', () => {
  it('accepts safe image, link, and HTTP URL values', async () => {
    await expect(
      new SiteSetting({
        social: { instagram: 'https://instagram.com/twelvecreative' },
        faq_section: {
          image: '/uploads/founder.webp',
          contact_link: '/contact',
        },
        contact_map_embed_url: 'https://maps.google.com/maps?output=embed',
      }).validate(),
    ).resolves.toBeUndefined();
  });

  it('rejects executable, protocol-relative, and traversal references', async () => {
    await expect(
      new SiteSetting({
        social: { instagram: 'javascript:alert(1)' },
        faq_section: {
          image: '/uploads/../private.jpg',
          contact_link: '//evil.example/contact',
        },
      }).validate(),
    ).rejects.toThrow();
  });
});
