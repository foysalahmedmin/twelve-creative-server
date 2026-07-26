import { SHARED_SECTION_SEED_INPUT } from '../../../scripts/seeds/shared-section.seed';
import {
  sharedSectionBodySchema,
  updateSharedSectionValidationSchema,
} from '../shared-section.validator';

describe('Shared section validation', () => {
  it('accepts every typed production seed record', () => {
    for (const section of SHARED_SECTION_SEED_INPUT) {
      expect(sharedSectionBodySchema.safeParse(section).success).toBe(true);
    }
  });

  it('rejects arbitrary content fields on heading sections', () => {
    const heading = SHARED_SECTION_SEED_INPUT.find(
      (item) => item.key === 'home-services',
    )!;
    expect(
      sharedSectionBodySchema.safeParse({
        ...heading,
        content: { arbitrary: { unvalidated: true } },
      }).success,
    ).toBe(false);
  });

  it('rejects content that does not match its discriminating key', () => {
    const difference = SHARED_SECTION_SEED_INPUT.find(
      (item) => item.key === 'difference',
    )!;
    expect(
      sharedSectionBodySchema.safeParse({
        ...difference,
        key: 'why-choose-us',
      }).success,
    ).toBe(false);
  });

  it('accepts uploaded cloud video media and rejects unsafe video values', () => {
    const growth = SHARED_SECTION_SEED_INPUT.find(
      (item) => item.key === 'growth-system',
    )!;
    if (growth.key !== 'growth-system') throw new Error('Invalid fixture');

    const cloudUpload = {
      ...growth,
      content: {
        steps: growth.content.steps.map((step, index) =>
          index === 0
            ? {
                ...step,
                media: {
                  type: 'video',
                  video: {
                    source: 'upload',
                    value: 'https://storage.googleapis.com/twelve/video.mp4',
                  },
                  thumbnail: '/uploads/images/video.jpg',
                },
              }
            : step,
        ),
      },
    };
    expect(sharedSectionBodySchema.safeParse(cloudUpload).success).toBe(true);

    const unsafe = structuredClone(cloudUpload);
    const first = unsafe.content.steps[0];
    if (first.media.type !== 'video') throw new Error('Invalid fixture');
    first.media.video.value = 'javascript:alert(1)';
    expect(sharedSectionBodySchema.safeParse(unsafe).success).toBe(false);
  });

  it('requires route and body keys to be valid typed keys', () => {
    const section = SHARED_SECTION_SEED_INPUT[0];
    expect(
      updateSharedSectionValidationSchema.safeParse({
        params: { key: section.key },
        body: section,
      }).success,
    ).toBe(true);
  });
});
