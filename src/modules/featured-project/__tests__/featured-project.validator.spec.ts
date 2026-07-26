import {
  createFeaturedProjectValidationSchema,
  reorderFeaturedProjectsValidationSchema,
  updateFeaturedProjectValidationSchema,
} from '../featured-project.validator';

const INDUSTRY_ID = '507f1f77bcf86cd799439011';
const PROJECT_ID = '507f1f77bcf86cd799439012';

const baseBody = {
  title: 'Hospitality launch film',
  industry: INDUSTRY_ID,
  aspect: 'reel' as const,
  thumbnail: '/uploads/images/hospitality-film.webp',
  video: {
    source: 'url' as const,
    value: 'https://media.example.com/hospitality-film.mp4',
  },
};

describe('featured project media validation', () => {
  it.each([
    {
      source: 'youtube' as const,
      value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    },
    {
      source: 'url' as const,
      value: 'https://media.example.com/hospitality-film.mp4',
    },
    { source: 'upload' as const, value: '/uploads/videos/film.mp4' },
    {
      source: 'upload' as const,
      value: 'https://storage.example.com/videos/film.mp4',
    },
  ])('accepts a renderable $source video reference', (video) => {
    expect(
      createFeaturedProjectValidationSchema.safeParse({
        body: { ...baseBody, video },
      }).success,
    ).toBe(true);
  });

  it.each([
    { source: 'youtube', value: 'https://www.youtube.com/' },
    { source: 'youtube', value: 'https://youtu.be/too-short' },
    { source: 'url', value: 'http://media.example.com/film.mp4' },
    { source: 'url', value: '/uploads/videos/film.mp4' },
    { source: 'upload', value: '/private/videos/film.mp4' },
    { source: 'upload', value: 'http://storage.example.com/film.mp4' },
  ])('rejects a non-renderable media reference: %o', (video) => {
    expect(
      createFeaturedProjectValidationSchema.safeParse({
        body: { ...baseBody, video },
      }).success,
    ).toBe(false);
  });

  it('rejects unsafe thumbnails on create and unsafe media on update', () => {
    expect(
      createFeaturedProjectValidationSchema.safeParse({
        body: { ...baseBody, thumbnail: 'javascript:alert(1)' },
      }).success,
    ).toBe(false);

    expect(
      updateFeaturedProjectValidationSchema.safeParse({
        params: { id: PROJECT_ID },
        body: {
          video: {
            source: 'youtube',
            value: 'https://www.youtube.com/channel/twelvecreative',
          },
        },
      }).success,
    ).toBe(false);
  });

  it('bounds reorder payloads', () => {
    expect(
      reorderFeaturedProjectsValidationSchema.safeParse({
        body: {
          items: Array.from({ length: 101 }, (_, order) => ({
            _id: PROJECT_ID,
            order,
          })),
        },
      }).success,
    ).toBe(false);
  });
});
