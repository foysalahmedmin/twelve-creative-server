jest.mock('../../modules/process-section/process-section.model', () => ({
  PROCESS_SECTION_SINGLETON_KEY: 'process',
  ProcessSection: {
    findOne: jest.fn(),
    deleteMany: jest.fn(),
    findOneAndUpdate: jest.fn(),
  },
}));

jest.mock('../../modules/site-setting/site-setting.model', () => ({
  SiteSetting: {
    findOne: jest.fn(),
  },
}));

import { ProcessSection } from '../../modules/process-section/process-section.model';
import { SiteSetting } from '../../modules/site-setting/site-setting.model';
import {
  PROCESS_SECTION_SEED,
  seedProcessSection,
} from '../seeds/process-section.seed';

const mockLegacySetting = (processThumbnail?: string) => {
  const lean = jest
    .fn()
    .mockResolvedValue(
      processThumbnail ? { process_thumbnail: processThumbnail } : null,
    );
  const select = jest.fn().mockReturnValue({ lean });
  (SiteSetting.findOne as jest.Mock).mockReturnValue({ select });
  return { select, lean };
};

describe('Process section seed', () => {
  it('skips an existing singleton in safe mode without touching its content', async () => {
    (ProcessSection.findOne as jest.Mock).mockResolvedValue({
      _id: 'existing',
    });

    await expect(seedProcessSection(false)).resolves.toEqual({
      module: 'process-section',
      action: 'skipped',
      count: 1,
    });

    expect(ProcessSection.deleteMany).not.toHaveBeenCalled();
    expect(ProcessSection.findOneAndUpdate).not.toHaveBeenCalled();
    expect(SiteSetting.findOne).not.toHaveBeenCalled();
  });

  it('inserts defaults while preserving the legacy managed thumbnail', async () => {
    (ProcessSection.findOne as jest.Mock).mockResolvedValue(null);
    mockLegacySetting(' https://cdn.example.com/custom-process.jpg ');
    (ProcessSection.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    await expect(seedProcessSection(false)).resolves.toEqual({
      module: 'process-section',
      action: 'inserted',
      count: 1,
    });

    expect(ProcessSection.findOneAndUpdate).toHaveBeenCalledWith(
      { singleton_key: 'process' },
      {
        $set: {
          ...PROCESS_SECTION_SEED,
          thumbnail: 'https://cdn.example.com/custom-process.jpg',
        },
        $setOnInsert: { singleton_key: 'process' },
      },
      {
        upsert: true,
        new: true,
        runValidators: true,
        setDefaultsOnInsert: true,
      },
    );
  });

  it('deletes and replaces the singleton in force mode', async () => {
    (ProcessSection.findOne as jest.Mock).mockResolvedValue({
      _id: 'existing',
    });
    (ProcessSection.deleteMany as jest.Mock).mockResolvedValue({});
    mockLegacySetting();
    (ProcessSection.findOneAndUpdate as jest.Mock).mockResolvedValue({});

    await expect(seedProcessSection(true)).resolves.toEqual({
      module: 'process-section',
      action: 'replaced',
      count: 1,
    });

    expect(ProcessSection.deleteMany).toHaveBeenCalledWith({});
    expect(ProcessSection.findOneAndUpdate).toHaveBeenCalledWith(
      { singleton_key: 'process' },
      expect.objectContaining({
        $set: PROCESS_SECTION_SEED,
        $setOnInsert: { singleton_key: 'process' },
      }),
      expect.objectContaining({ upsert: true, runValidators: true }),
    );
  });
});
