jest.mock('../shared-section.model', () => ({
  SharedSection: {
    findOne: jest.fn(),
    find: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

import httpStatus from 'http-status';
import { SharedSection } from '../shared-section.model';
import * as SharedSectionService from '../shared-section.service';
import { TSharedSectionInput } from '../shared-section.type';

const payload: TSharedSectionInput = {
  key: 'growth-system',
  label: 'Inside the Build',
  title: 'Connected growth',
  description: 'A system built end to end.',
  content: {
    steps: [
      {
        id: 'positioning',
        index: '99',
        title: 'Positioning',
        description: 'Clarify the business.',
        media: { type: 'image', image: '/uploads/positioning.jpg' },
        items: [
          { id: 'offer', index: '99', text: 'Offer structure' },
          { text: 'Market angle' },
        ],
      },
    ],
  },
  is_active: true,
};

describe('SharedSectionService', () => {
  beforeEach(() => jest.clearAllMocks());

  it('derives stable indexes throughout nested ordered collections', () => {
    const normalized = SharedSectionService.normalizeSharedSection(payload);
    if (normalized.key !== 'growth-system') throw new Error('Invalid fixture');

    expect(normalized.content.steps[0]).toMatchObject({
      id: 'positioning',
      index: '01',
    });
    expect(normalized.content.steps[0].items[0]).toMatchObject({
      id: 'offer',
      index: '01',
    });
    expect(normalized.content.steps[0].items[1].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(normalized.content.steps[0].items[1].index).toBe('02');
  });

  it('numbers Work With Us cards from 01 in display order', () => {
    const normalized = SharedSectionService.normalizeSharedSection({
      key: 'work-with-us',
      title: 'Work With Us',
      description: 'A clear engagement structure.',
      content: {
        cards: [
          { id: 'first', title: 'First', description: 'First phase' },
          { id: 'second', title: 'Second', description: 'Second phase' },
        ],
      },
    });
    if (normalized.key !== 'work-with-us') throw new Error('Invalid fixture');

    expect(normalized.content.cards.map((card) => card.index)).toEqual([
      '01',
      '02',
    ]);
  });

  it('rejects duplicate nested stable ids before writing', () => {
    const duplicate: TSharedSectionInput = {
      ...payload,
      content: {
        steps: [
          {
            ...payload.content.steps[0],
            items: [
              { id: 'duplicate', text: 'One' },
              { id: ' duplicate ', text: 'Two' },
            ],
          },
        ],
      },
    };

    expect(() =>
      SharedSectionService.normalizeSharedSection(duplicate),
    ).toThrow(expect.objectContaining({ status: httpStatus.BAD_REQUEST }));
  });

  it('returns a public allowlist without state or timestamps', async () => {
    const normalized = SharedSectionService.normalizeSharedSection(payload);
    (SharedSection.findOne as jest.Mock).mockReturnValue({
      lean: jest.fn().mockResolvedValue({
        ...normalized,
        created_at: new Date(),
        updated_at: new Date(),
      }),
    });

    const result =
      await SharedSectionService.getPublicSharedSection('growth-system');
    expect(result).toMatchObject({
      key: 'growth-system',
      content: normalized.content,
    });
    expect(result).not.toHaveProperty('is_active');
    expect(result).not.toHaveProperty('created_at');
  });

  it('rejects mismatched route and payload keys', async () => {
    await expect(
      SharedSectionService.updateSharedSection('difference', payload),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Route key must match the shared section payload key',
    });
    expect(SharedSection.findOneAndUpdate).not.toHaveBeenCalled();
  });

  it('atomically upserts a normalized typed section', async () => {
    const normalized = SharedSectionService.normalizeSharedSection(payload);
    (SharedSection.findOneAndUpdate as jest.Mock).mockResolvedValue(normalized);

    await expect(
      SharedSectionService.updateSharedSection('growth-system', payload),
    ).resolves.toEqual(normalized);
    expect(SharedSection.findOneAndUpdate).toHaveBeenCalledWith(
      { key: 'growth-system' },
      { $set: expect.objectContaining({ key: 'growth-system' }) },
      {
        upsert: true,
        new: true,
        lean: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  });
});
