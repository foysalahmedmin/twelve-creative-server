import { ABOUT_PAGE_SEED } from '../../../scripts/seeds/about-page.seed';
import { updateAboutPageValidationSchema } from '../about-page.validator';

describe('About page validation', () => {
  it('accepts the complete production seed payload', () => {
    expect(
      updateAboutPageValidationSchema.safeParse({ body: ABOUT_PAGE_SEED })
        .success,
    ).toBe(true);
  });

  it('accepts YouTube, URL, local upload, and cloud upload video sources', () => {
    const values = [
      {
        source: 'youtube',
        value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      },
      { source: 'url', value: 'https://cdn.example.com/story.mp4' },
      { source: 'upload', value: '/uploads/videos/story.mp4' },
      {
        source: 'upload',
        value: 'https://storage.googleapis.com/twelve/story.mp4',
      },
    ];

    for (const video of values) {
      const result = updateAboutPageValidationSchema.safeParse({
        body: {
          ...ABOUT_PAGE_SEED,
          founder: {
            ...ABOUT_PAGE_SEED.founder,
            media: { type: 'video', video },
          },
        },
      });
      expect(result.success).toBe(true);
    }
  });

  it('rejects unsafe media and empty ordered collections', () => {
    expect(
      updateAboutPageValidationSchema.safeParse({
        body: {
          ...ABOUT_PAGE_SEED,
          story_cards: [],
          founder: {
            ...ABOUT_PAGE_SEED.founder,
            media: { type: 'image', image: 'javascript:alert(1)' },
          },
        },
      }).success,
    ).toBe(false);
  });
});
