import {
  getOrCreateSiteSetting,
  SITE_SETTING_SINGLETON_KEY,
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
});
