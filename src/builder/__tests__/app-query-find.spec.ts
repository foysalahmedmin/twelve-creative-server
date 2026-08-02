import AppQueryFind from '../app-query-find';

/**
 * Only the sort is exercised here, because the sort is what makes pagination
 * trustworthy. `skip`/`limit` over a non-total ordering is free to return the
 * same document on two pages and never return another one at all — which is
 * exactly what production did: the default sort named `createdAt`, every
 * schema maps its timestamps to `created_at`, and sorting by an absent field
 * leaves Mongo free to answer in storage order.
 */

type Recorded = { sort?: string; skip?: number; limit?: number };

const makeModel = (recorded: Recorded) => {
  const query = {
    sort(value: string) {
      recorded.sort = value;
      return this;
    },
    skip(value: number) {
      recorded.skip = value;
      return this;
    },
    limit(value: number) {
      recorded.limit = value;
      return this;
    },
    find() {
      return this;
    },
  };
  return { find: () => query } as never;
};

describe('AppQueryFind.sort', () => {
  it('defaults to the timestamp field the schemas actually declare', () => {
    const recorded: Recorded = {};
    new AppQueryFind(makeModel(recorded), {}).sort();

    expect(recorded.sort).toContain('-created_at');
    expect(recorded.sort).not.toContain('createdAt');
  });

  it('always ends with _id so the ordering is total', () => {
    const recorded: Recorded = {};
    new AppQueryFind(makeModel(recorded), {}).sort();

    expect(recorded.sort?.trim().split(/\s+/).pop()).toBe('-_id');
  });

  it('keeps an explicit sort but still breaks ties deterministically', () => {
    const recorded: Recorded = {};
    new AppQueryFind(makeModel(recorded), { sort: 'order' }).sort();

    const fields = recorded.sort?.trim().split(/\s+/) ?? [];
    expect(fields[0]).toBe('order');
    expect(fields).toContain('-_id');
  });

  it('does not append _id twice when the caller already sorted by it', () => {
    const recorded: Recorded = {};
    new AppQueryFind(makeModel(recorded), { sort: '-_id' }).sort();

    const idFields = (recorded.sort?.trim().split(/\s+/) ?? []).filter(
      (field) => field === '_id' || field === '-_id',
    );
    expect(idFields).toHaveLength(1);
  });

  it('pairs a stable sort with the skip/limit that relies on it', () => {
    const recorded: Recorded = {};
    new AppQueryFind(makeModel(recorded), { page: '3', limit: '5' })
      .sort()
      .paginate();

    expect(recorded.skip).toBe(10);
    expect(recorded.limit).toBe(5);
    expect(recorded.sort).toContain('-_id');
  });
});
