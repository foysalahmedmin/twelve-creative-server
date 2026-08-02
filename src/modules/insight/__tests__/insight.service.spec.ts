import httpStatus from 'http-status';

jest.mock('../insight.repository');
jest.mock('../insight.model', () => ({
  Insight: { findOne: jest.fn() },
}));

import { Insight } from '../insight.model';
import * as InsightRepository from '../insight.repository';
import * as InsightService from '../insight.service';

const INSIGHT_ID = '507f1f77bcf86cd799439011';
const OTHER_ID = '507f1f77bcf86cd799439012';
const insight = {
  _id: INSIGHT_ID,
  slug: 'brand-strategy',
  title: 'Brand strategy guide',
  excerpt: 'A practical introduction to brand strategy.',
  cover: '/brand-strategy.jpg',
  content: 'Long-form insight content used by the service tests.',
  status: 'published' as const,
};
const page = {
  data: [insight],
  meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
};

describe('InsightService', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('creates an insight when its slug is available', async () => {
    (Insight.findOne as jest.Mock).mockResolvedValue(null);
    (InsightRepository.create as jest.Mock).mockResolvedValue(insight);

    await expect(InsightService.createInsight(insight)).resolves.toBe(insight);

    expect(Insight.findOne).toHaveBeenCalledWith({ slug: insight.slug });
    expect(InsightRepository.create).toHaveBeenCalledWith(insight);
  });

  it('creates an insight without querying slug uniqueness when no slug is provided', async () => {
    const draft = { title: 'Draft title' };
    (InsightRepository.create as jest.Mock).mockResolvedValue(draft);

    await expect(InsightService.createInsight(draft)).resolves.toBe(draft);

    expect(Insight.findOne).not.toHaveBeenCalled();
  });

  it('throws 409 when creating an insight with an existing slug', async () => {
    (Insight.findOne as jest.Mock).mockResolvedValue({
      _id: { toString: () => OTHER_ID },
    });

    await expect(InsightService.createInsight(insight)).rejects.toMatchObject({
      status: httpStatus.CONFLICT,
      message: `An insight with slug "${insight.slug}" already exists`,
    });

    expect(InsightRepository.create).not.toHaveBeenCalled();
  });

  it('returns the public insight list', async () => {
    (InsightRepository.findPublicList as jest.Mock).mockResolvedValue([
      insight,
    ]);

    await expect(InsightService.getPublicInsights()).resolves.toEqual({
      data: [insight],
    });
  });

  it('returns a published insight by slug', async () => {
    (InsightRepository.findBySlugLean as jest.Mock).mockResolvedValue(insight);

    await expect(
      InsightService.getPublicInsightBySlug(insight.slug),
    ).resolves.toBe(insight);

    expect(InsightRepository.findBySlugLean).toHaveBeenCalledWith(insight.slug);
  });

  it('throws 404 when no published insight matches the slug', async () => {
    (InsightRepository.findBySlugLean as jest.Mock).mockResolvedValue(null);

    await expect(
      InsightService.getPublicInsightBySlug('missing-insight'),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Insight not found',
    });
  });

  it('returns the paginated admin insight list', async () => {
    const query = { page: 2, filter: 'draft' };
    (InsightRepository.findAdminPaginated as jest.Mock).mockResolvedValue(page);

    await expect(InsightService.getInsights(query)).resolves.toEqual(page);

    expect(InsightRepository.findAdminPaginated).toHaveBeenCalledWith(query);
  });

  it('returns an insight by id', async () => {
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(insight);

    await expect(InsightService.getInsight(INSIGHT_ID)).resolves.toBe(insight);
  });

  it('throws 404 when an insight id is not found', async () => {
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(InsightService.getInsight(INSIGHT_ID)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Insight not found',
    });
  });

  it('updates an insight after checking a changed slug', async () => {
    const payload = { slug: 'updated-brand-strategy', title: 'Updated title' };
    const updated = { ...insight, ...payload };
    const updatedDocument = { toObject: jest.fn().mockReturnValue(updated) };
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(insight);
    (Insight.findOne as jest.Mock).mockResolvedValue(null);
    (InsightRepository.updateById as jest.Mock).mockResolvedValue(
      updatedDocument,
    );

    await expect(
      InsightService.updateInsight(INSIGHT_ID, payload),
    ).resolves.toEqual(updated);

    expect(Insight.findOne).toHaveBeenCalledWith({ slug: payload.slug });
    expect(InsightRepository.updateById).toHaveBeenCalledWith(
      INSIGHT_ID,
      payload,
    );
    expect(updatedDocument.toObject).toHaveBeenCalledTimes(1);
  });

  it('does not run a uniqueness query when the slug is unchanged', async () => {
    const payload = { slug: insight.slug, title: 'Updated title' };
    const updatedDocument = {
      toObject: jest.fn().mockReturnValue({ ...insight, ...payload }),
    };
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(insight);
    (InsightRepository.updateById as jest.Mock).mockResolvedValue(
      updatedDocument,
    );

    await InsightService.updateInsight(INSIGHT_ID, payload);

    expect(Insight.findOne).not.toHaveBeenCalled();
  });

  it('rejects an update when the insight does not exist', async () => {
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      InsightService.updateInsight(INSIGHT_ID, { title: 'Updated title' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(InsightRepository.updateById).not.toHaveBeenCalled();
  });

  it('throws 409 when an updated slug belongs to another insight', async () => {
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(insight);
    (Insight.findOne as jest.Mock).mockResolvedValue({
      _id: { toString: () => OTHER_ID },
    });

    await expect(
      InsightService.updateInsight(INSIGHT_ID, { slug: 'existing-slug' }),
    ).rejects.toMatchObject({ status: httpStatus.CONFLICT });

    expect(InsightRepository.updateById).not.toHaveBeenCalled();
  });

  it('soft deletes an existing insight', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (InsightRepository.findById as jest.Mock).mockResolvedValue({
      ...insight,
      softDelete,
    });

    await InsightService.deleteInsight(INSIGHT_ID);

    expect(softDelete).toHaveBeenCalledTimes(1);
  });

  it('rejects a soft delete when the insight does not exist', async () => {
    (InsightRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(
      InsightService.deleteInsight(INSIGHT_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
  });

  it('permanently deletes an existing insight', async () => {
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(insight);

    await InsightService.deleteInsightPermanent(INSIGHT_ID);

    expect(InsightRepository.hardDeleteById).toHaveBeenCalledWith(INSIGHT_ID);
  });

  it('rejects permanent deletion when the insight does not exist', async () => {
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      InsightService.deleteInsightPermanent(INSIGHT_ID),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });

    expect(InsightRepository.hardDeleteById).not.toHaveBeenCalled();
  });
});

// Restore is the counterpart to the soft delete these modules already had:
// without it a soft-deleted record was unreachable from the API entirely, and
// could only be brought back by editing the database by hand.
describe('InsightService.restoreInsight', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('restores a soft-deleted record and returns the fresh copy', async () => {
    (InsightRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      insight,
    );
    (InsightRepository.restoreById as jest.Mock).mockResolvedValue(insight);
    (InsightRepository.findByIdLean as jest.Mock).mockResolvedValue(insight);

    await expect(InsightService.restoreInsight(INSIGHT_ID)).resolves.toEqual(
      insight,
    );
    expect(InsightRepository.restoreById).toHaveBeenCalledWith(INSIGHT_ID);
  });

  it('throws 404 without attempting a restore when the id does not exist', async () => {
    (InsightRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      null,
    );

    await expect(
      InsightService.restoreInsight(INSIGHT_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Insight not found',
    });
    expect(InsightRepository.restoreById).not.toHaveBeenCalled();
  });

  it('throws 404 when the record exists but was never deleted', async () => {
    (InsightRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(
      insight,
    );
    (InsightRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(
      InsightService.restoreInsight(INSIGHT_ID),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Insight not found or not deleted',
    });
  });
});
