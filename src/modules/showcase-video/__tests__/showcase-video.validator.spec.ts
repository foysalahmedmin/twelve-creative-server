import {
  createShowcaseVideoValidationSchema,
  reorderShowcaseVideosValidationSchema,
  updateShowcaseVideoValidationSchema,
} from '../showcase-video.validator';

const INDUSTRY_ID = '507f1f77bcf86cd799439011';
const VIDEO_ID = '507f1f77bcf86cd799439012';

const baseBody = {
  industry: INDUSTRY_ID,
  video: {
    source: 'url' as const,
    value: 'https://media.example.com/showcase.mp4',
  },
  thumbnail: '/uploads/images/showcase.webp',
  alt: 'Hospitality showcase film',
  aspect: 'landscape' as const,
};

describe('showcase video media validation', () => {
  it('allows a playable YouTube URL without a custom thumbnail', () => {
    expect(
      createShowcaseVideoValidationSchema.safeParse({
        body: {
          ...baseBody,
          thumbnail: undefined,
          video: {
            source: 'youtube',
            value: 'https://youtu.be/dQw4w9WgXcQ',
          },
        },
      }).success,
    ).toBe(true);
  });

  it.each([
    { source: 'url', value: 'https://media.example.com/showcase.mp4' },
    { source: 'upload', value: '/uploads/videos/showcase.mp4' },
    {
      source: 'upload',
      value: 'https://storage.example.com/videos/showcase.mp4',
    },
  ])('requires a thumbnail for a $source video', (video) => {
    expect(
      createShowcaseVideoValidationSchema.safeParse({
        body: { ...baseBody, video, thumbnail: undefined },
      }).success,
    ).toBe(false);
  });

  it.each([
    { source: 'youtube', value: 'https://www.youtube.com/' },
    { source: 'url', value: 'http://media.example.com/showcase.mp4' },
    { source: 'upload', value: '/private/showcase.mp4' },
    { source: 'upload', value: 'http://storage.example.com/showcase.mp4' },
  ])('rejects an unsafe or non-renderable video reference: %o', (video) => {
    expect(
      createShowcaseVideoValidationSchema.safeParse({
        body: { ...baseBody, video },
      }).success,
    ).toBe(false);
  });

  it('rejects unsafe thumbnails and validates partial video updates', () => {
    expect(
      createShowcaseVideoValidationSchema.safeParse({
        body: { ...baseBody, thumbnail: '//evil.example/showcase.jpg' },
      }).success,
    ).toBe(false);

    expect(
      updateShowcaseVideoValidationSchema.safeParse({
        params: { id: VIDEO_ID },
        body: {
          video: {
            source: 'youtube',
            value: 'https://youtube.com/watch?v=too-short',
          },
        },
      }).success,
    ).toBe(false);
  });

  it('bounds reorder payloads', () => {
    expect(
      reorderShowcaseVideosValidationSchema.safeParse({
        body: {
          items: Array.from({ length: 101 }, (_, order) => ({
            _id: VIDEO_ID,
            order,
          })),
        },
      }).success,
    ).toBe(false);
  });
});
