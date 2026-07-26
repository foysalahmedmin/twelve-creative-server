jest.mock('../work.model', () => ({
  Work: { find: jest.fn(), findOne: jest.fn() },
}));
jest.mock('../../industry/industry.repository');

import * as IndustryRepository from '../../industry/industry.repository';
import { Work } from '../work.model';
import * as WorkRepository from '../work.repository';

const ACTIVE_INDUSTRY_ID = '507f1f77bcf86cd799439013';

const populatedQuery = (result: unknown) => {
  const lean = jest.fn().mockResolvedValue(result);
  const sort = jest.fn().mockReturnValue({ lean });
  const populate = jest.fn().mockReturnValue({ sort, lean });
  return { populate };
};

describe('WorkRepository public Industry ownership', () => {
  beforeEach(() => jest.resetAllMocks());

  it('returns no list records when there are no active Industries', async () => {
    (IndustryRepository.findActiveIds as jest.Mock).mockResolvedValue([]);

    await expect(WorkRepository.findPublicList()).resolves.toEqual([]);

    expect(Work.find).not.toHaveBeenCalled();
  });

  it('only lists work owned by active Industries', async () => {
    (IndustryRepository.findActiveIds as jest.Mock).mockResolvedValue([
      ACTIVE_INDUSTRY_ID,
    ]);
    (Work.find as jest.Mock).mockReturnValue(populatedQuery([]));

    await WorkRepository.findPublicList();

    expect(Work.find).toHaveBeenCalledWith({
      is_published: true,
      industry: { $in: [ACTIVE_INDUSTRY_ID] },
    });
  });

  it('only resolves a public slug through an active Industry', async () => {
    (IndustryRepository.findActiveIds as jest.Mock).mockResolvedValue([
      ACTIVE_INDUSTRY_ID,
    ]);
    (Work.findOne as jest.Mock).mockReturnValue(populatedQuery(null));

    await WorkRepository.findBySlugLean('hospitality-growth');

    expect(Work.findOne).toHaveBeenCalledWith({
      slug: 'hospitality-growth',
      is_published: true,
      industry: { $in: [ACTIVE_INDUSTRY_ID] },
    });
  });
});
