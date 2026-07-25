import {
  PROCESS_SECTION_SINGLETON_KEY,
  ProcessSection,
} from '../../modules/process-section/process-section.model';
import { SiteSetting } from '../../modules/site-setting/site-setting.model';

export const PROCESS_SECTION_SEED = {
  label: 'Our Process',
  title: 'A clear path from understanding to execution.',
  description:
    'We do not begin by making random assets. We begin by understanding what the business is trying to move, where the friction is, and what structure needs to be built.',
  thumbnail:
    'https://images.unsplash.com/photo-1552664730-d307ca884978?w=768&h=898&fit=crop&auto=format',
  process_steps: [
    {
      id: 'step-1',
      index: '01',
      icon: 'understand' as const,
      title: 'Understand the business',
      description:
        'We review the offer, audience, market, existing materials, sales process, and current bottlenecks.',
      image:
        'https://images.unsplash.com/photo-1552664730-d307ca884978?w=768&h=898&fit=crop&auto=format',
    },
    {
      id: 'step-2',
      index: '02',
      icon: 'position' as const,
      title: 'Clarify the position',
      description:
        'We define what the business needs to communicate and what the market needs to believe before taking action.',
      image:
        'https://images.unsplash.com/photo-1531403009284-440f080d1e12?w=768&h=898&fit=crop&auto=format',
    },
    {
      id: 'step-3',
      index: '03',
      icon: 'build' as const,
      title: 'Build the creative',
      description:
        'We create the assets needed to make the business visible, credible, and compelling.',
      image:
        'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=768&h=898&fit=crop&auto=format',
    },
    {
      id: 'step-4',
      index: '04',
      icon: 'launch' as const,
      title: 'Launch distribution',
      description:
        'We place the message in front of the right people through social, ads, email, SMS, PR, and other channels.',
      image:
        'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=768&h=898&fit=crop&auto=format',
    },
    {
      id: 'step-5',
      index: '05',
      icon: 'install' as const,
      title: 'Install the system',
      description:
        'We connect the backend: landing pages, CRM, automations, tracking, and follow-up.',
      image:
        'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=768&h=898&fit=crop&auto=format',
    },
    {
      id: 'step-6',
      index: '06',
      icon: 'improve' as const,
      title: 'Improve based on reality',
      description:
        'We review what is working, where people are dropping off, and what needs to be refined.',
      image:
        'https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=768&h=898&fit=crop&auto=format',
    },
  ],
};

export type TProcessSectionSeedReport = {
  module: 'process-section';
  action: 'inserted' | 'skipped' | 'replaced';
  count: 1;
};

/**
 * Seed the Process singleton without overwriting managed content in safe mode.
 * During the one-time migration, preserve any portrait an admin already saved
 * in the legacy Site Settings field instead of silently reverting it.
 */
export async function seedProcessSection(
  force: boolean,
): Promise<TProcessSectionSeedReport> {
  const existing = await ProcessSection.findOne({
    singleton_key: PROCESS_SECTION_SINGLETON_KEY,
  });

  if (existing && !force) {
    return { module: 'process-section', action: 'skipped', count: 1 };
  }

  if (force) {
    await ProcessSection.deleteMany({});
  }

  const legacySetting = await SiteSetting.findOne()
    .select('process_thumbnail -_id')
    .lean();
  const legacyThumbnail = legacySetting?.process_thumbnail?.trim();
  const seed = {
    ...PROCESS_SECTION_SEED,
    thumbnail: legacyThumbnail || PROCESS_SECTION_SEED.thumbnail,
  };

  await ProcessSection.findOneAndUpdate(
    { singleton_key: PROCESS_SECTION_SINGLETON_KEY },
    {
      $set: seed,
      $setOnInsert: { singleton_key: PROCESS_SECTION_SINGLETON_KEY },
    },
    {
      upsert: true,
      new: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    },
  );

  return {
    module: 'process-section',
    action: existing ? 'replaced' : 'inserted',
    count: 1,
  };
}
