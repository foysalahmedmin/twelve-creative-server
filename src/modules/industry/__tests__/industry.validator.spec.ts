import {
  createIndustryValidationSchema,
  reorderIndustriesValidationSchema,
  updateIndustryValidationSchema,
} from '../industry.validator';

const reelThumbnail =
  'https://images.example.com/hospitality-reel-thumbnail.jpg';
const reelVideo = {
  source: 'url' as const,
  value: 'https://videos.example.com/hospitality-reel.mp4',
};

const validCreateBody = {
  slug: 'hospitality',
  name: 'Hospitality',
  headline: 'Hospitality marketing that understands the room.',
  description:
    'Restaurants and hospitality brands grow when experience and revenue connect.',
  image: 'https://images.example.com/hospitality-cover.jpg',
  reel_thumbnail: reelThumbnail,
  reel_video: reelVideo,
};

describe('Industry reel media validation', () => {
  it('accepts reel media when creating an Industry', () => {
    const result = createIndustryValidationSchema.parse({
      body: validCreateBody,
    });

    expect(result.body).toMatchObject({
      reel_thumbnail: reelThumbnail,
      reel_video: reelVideo,
    });
  });

  it('accepts null values when an admin clears reel media', () => {
    const result = updateIndustryValidationSchema.parse({
      params: { id: '507f1f77bcf86cd799439011' },
      body: { reel_thumbnail: null, reel_video: null },
    });

    expect(result.body).toEqual({
      reel_thumbnail: null,
      reel_video: null,
    });
  });

  it('rejects an unsupported reel video source', () => {
    const result = createIndustryValidationSchema.safeParse({
      body: {
        ...validCreateBody,
        reel_video: { source: 'vimeo', value: reelVideo.value },
      },
    });

    expect(result.success).toBe(false);
  });

  it('rejects incomplete or oversized reel media values', () => {
    const missingVideoValue = createIndustryValidationSchema.safeParse({
      body: {
        ...validCreateBody,
        reel_video: { source: 'url' },
      },
    });
    const oversizedThumbnail = createIndustryValidationSchema.safeParse({
      body: {
        ...validCreateBody,
        reel_thumbnail: 'x'.repeat(2049),
      },
    });

    expect(missingVideoValue.success).toBe(false);
    expect(oversizedThumbnail.success).toBe(false);
  });

  it('bounds reorder payloads', () => {
    expect(
      reorderIndustriesValidationSchema.safeParse({
        body: {
          items: Array.from({ length: 101 }, (_, order) => ({
            _id: '507f1f77bcf86cd799439011',
            order,
          })),
        },
      }).success,
    ).toBe(false);
  });
});
