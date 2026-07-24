import { Model } from 'mongoose';
import { Insight } from '../../insight/insight.model';
import { Service } from '../../service/service.model';
import { Work } from '../../work/work.model';
import { User } from '../user.model';

type IndexKeys = Record<string, number>;

const expectOnePartialUniqueIndex = (
  model: Model<any>,
  field: 'email' | 'slug',
  name: string,
) => {
  const indexesForField = model.schema
    .indexes()
    .filter(
      ([keys]) =>
        Object.keys(keys).length === 1 && (keys as IndexKeys)[field] === 1,
    );

  expect(indexesForField).toHaveLength(1);

  const [[keys, options]] = indexesForField;
  expect(keys).toEqual({ [field]: 1 });
  expect(options).toEqual(
    expect.objectContaining({
      unique: true,
      partialFilterExpression: { is_deleted: false },
      name,
    }),
  );
  expect(
    (model.schema.path(field).options as { unique?: boolean }).unique,
  ).toBe(undefined);
};

describe('Soft-delete-aware unique indexes', () => {
  it('declares exactly one named partial unique index for each reusable key', () => {
    expectOnePartialUniqueIndex(User, 'email', 'unique_email_not_deleted');
    expectOnePartialUniqueIndex(
      Service,
      'slug',
      'unique_service_slug_not_deleted',
    );
    expectOnePartialUniqueIndex(Work, 'slug', 'unique_slug_not_deleted');
    expectOnePartialUniqueIndex(
      Insight,
      'slug',
      'unique_insight_slug_not_deleted',
    );
  });
});
