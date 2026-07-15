import { Industry } from '../industry.model';

const validIndustry = {
  slug: 'hospitality',
  name: 'Hospitality',
  headline: 'Hospitality marketing that understands the room.',
  description:
    'Restaurants and hospitality brands grow when experience and revenue connect.',
  image: 'https://images.example.com/hospitality-cover.jpg',
  icon: 'hospitality' as const,
  reel_thumbnail: 'https://images.example.com/hospitality-reel-thumbnail.jpg',
  reel_video: {
    source: 'upload' as const,
    value: '/uploads/hospitality-reel.mp4',
  },
};

describe('Industry reel media model', () => {
  it('stores valid reel thumbnail and video fields', async () => {
    const industry = new Industry(validIndustry);

    await expect(industry.validate()).resolves.toBeUndefined();
    expect(industry.toObject()).toMatchObject({
      reel_thumbnail: validIndustry.reel_thumbnail,
      reel_video: validIndustry.reel_video,
    });
  });

  it('rejects invalid reel video sources and oversized thumbnails', async () => {
    const industry = new Industry({
      ...validIndustry,
      reel_thumbnail: 'x'.repeat(2049),
      reel_video: { source: 'vimeo', value: '/videos/reel.mp4' },
    });

    await expect(industry.validate()).rejects.toMatchObject({
      errors: expect.objectContaining({
        reel_thumbnail: expect.anything(),
        'reel_video.source': expect.anything(),
      }),
    });
  });
});
