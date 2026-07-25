jest.mock('../process-section.model', () => ({
  PROCESS_SECTION_SINGLETON_KEY: 'process',
  ProcessSection: {
    findOne: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

import httpStatus from 'http-status';
import { ProcessSection } from '../process-section.model';
import * as ProcessSectionService from '../process-section.service';
import { TProcessSectionInput } from '../process-section.type';

const payload: TProcessSectionInput = {
  label: 'Our Process',
  title: 'A clear path from understanding to execution.',
  description: 'Clarity comes before execution.',
  thumbnail: 'https://example.com/process.jpg',
  process_steps: [
    {
      id: 'step-1',
      index: '12',
      icon: 'understand',
      title: 'Understand the business',
      description: 'Review the offer and current bottlenecks.',
      image: '/uploads/process/understand.jpg',
    },
    {
      icon: 'position',
      title: 'Clarify the position',
      description: 'Define what the market needs to believe.',
      image: 'https://example.com/position.jpg',
    },
  ],
};

const section = {
  _id: '507f1f77bcf86cd799439011',
  singleton_key: 'process' as const,
  ...payload,
  process_steps: [
    { ...payload.process_steps[0], id: 'step-1', index: '01' },
    { ...payload.process_steps[1], id: 'generated-id', index: '02' },
  ],
  created_at: new Date('2026-01-01'),
  updated_at: new Date('2026-01-02'),
};

describe('ProcessSectionService', () => {
  it('returns the process singleton or null', async () => {
    const lean = jest
      .fn()
      .mockResolvedValueOnce(section)
      .mockResolvedValueOnce(null);
    (ProcessSection.findOne as jest.Mock).mockReturnValue({ lean });

    await expect(ProcessSectionService.getProcessSection()).resolves.toEqual(
      section,
    );
    await expect(ProcessSectionService.getProcessSection()).resolves.toBeNull();

    expect(ProcessSection.findOne).toHaveBeenNthCalledWith(1, {
      singleton_key: 'process',
    });
    expect(ProcessSection.findOne).toHaveBeenNthCalledWith(2, {
      singleton_key: 'process',
    });
  });

  it('returns an explicit public allowlist and excludes database metadata', async () => {
    const lean = jest.fn().mockResolvedValue(section);
    (ProcessSection.findOne as jest.Mock).mockReturnValue({ lean });

    const result = await ProcessSectionService.getPublicProcessSection();

    expect(result).toEqual({
      label: section.label,
      title: section.title,
      description: section.description,
      thumbnail: section.thumbnail,
      process_steps: section.process_steps,
    });
    expect(result).not.toHaveProperty('_id');
    expect(result).not.toHaveProperty('singleton_key');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');
  });

  it('returns null publicly when the singleton has not been seeded', async () => {
    const lean = jest.fn().mockResolvedValue(null);
    (ProcessSection.findOne as jest.Mock).mockReturnValue({ lean });

    await expect(
      ProcessSectionService.getPublicProcessSection(),
    ).resolves.toBeNull();
  });

  it('atomically upserts and derives ids and indexes from array order', async () => {
    (ProcessSection.findOneAndUpdate as jest.Mock).mockResolvedValue(section);

    await expect(
      ProcessSectionService.updateProcessSection(payload),
    ).resolves.toEqual(section);

    const [filter, update, options] = (
      ProcessSection.findOneAndUpdate as jest.Mock
    ).mock.calls[0];
    expect(filter).toEqual({ singleton_key: 'process' });
    expect(update.$set).toMatchObject({
      label: payload.label,
      title: payload.title,
      description: payload.description,
      thumbnail: payload.thumbnail,
    });
    expect(update.$set.process_steps).toHaveLength(2);
    expect(update.$set.process_steps[0]).toMatchObject({
      id: 'step-1',
      index: '01',
      icon: 'understand',
    });
    expect(update.$set.process_steps[1]).toMatchObject({
      index: '02',
      icon: 'position',
    });
    expect(update.$set.process_steps[1].id).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
    expect(update.$setOnInsert).toEqual({ singleton_key: 'process' });
    expect(options).toEqual({
      upsert: true,
      new: true,
      lean: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });
  });

  it('rejects duplicate supplied step ids before accessing the database', async () => {
    await expect(
      ProcessSectionService.updateProcessSection({
        ...payload,
        process_steps: [
          payload.process_steps[0],
          { ...payload.process_steps[1], id: ' step-1 ' },
        ],
      }),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Process step ids must be unique',
    });
    expect(ProcessSection.findOneAndUpdate).not.toHaveBeenCalled();
  });
});
