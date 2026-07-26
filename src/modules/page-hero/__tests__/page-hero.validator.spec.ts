import {
  pageHeroParamSchema,
  upsertPageHeroValidationSchema,
} from '../page-hero.validator';

describe('Page hero public parameter validation', () => {
  it('accepts known page keys and rejects arbitrary keys', () => {
    expect(
      pageHeroParamSchema.safeParse({ params: { page: 'home' } }).success,
    ).toBe(true);
    expect(
      pageHeroParamSchema.safeParse({ params: { page: 'faq' } }).success,
    ).toBe(true);
    expect(
      pageHeroParamSchema.safeParse({ params: { page: 'private-preview' } })
        .success,
    ).toBe(false);
  });

  it('accepts safe SEO metadata and uploaded OG image paths', () => {
    const result = upsertPageHeroValidationSchema.safeParse({
      params: { page: 'about' },
      body: {
        seo: {
          title: 'About Twelve Creative',
          description: 'Learn about Twelve Creative.',
          og_image: '/uploads/files/about-og.jpg',
          canonical_url: 'https://twelvecreative.io/about',
          no_index: false,
        },
      },
    });

    expect(result.success).toBe(true);
  });

  it.each([
    'javascript:alert(1)',
    '//evil.example/image.jpg',
    '/uploads/../private/file.jpg',
  ])('rejects unsafe SEO image reference %s', (ogImage) => {
    const result = upsertPageHeroValidationSchema.safeParse({
      params: { page: 'about' },
      body: { seo: { og_image: ogImage } },
    });

    expect(result.success).toBe(false);
  });

  it('accepts each supported hero video source and safe CTA links', () => {
    for (const video of [
      { source: 'youtube', value: 'https://youtu.be/dQw4w9WgXcQ' },
      { source: 'url', value: 'https://cdn.example.com/hero.mp4' },
      { source: 'upload', value: '/uploads/hero.mp4' },
      { source: 'upload', value: 'https://storage.example.com/hero.mp4' },
    ]) {
      expect(
        upsertPageHeroValidationSchema.safeParse({
          params: { page: 'home' },
          body: {
            video,
            thumbnail: '/uploads/hero.webp',
            primary_cta: { label: 'Start', href: '/contact' },
          },
        }).success,
      ).toBe(true);
    }
  });

  it.each([
    { video: { source: 'youtube', value: 'https://evil.example/watch/1' } },
    { video: { source: 'url', value: 'javascript:alert(1)' } },
    { video: { source: 'upload', value: '/uploads/../secret.mp4' } },
    { thumbnail: '//evil.example/hero.jpg' },
    { primary_cta: { label: 'Unsafe', href: 'javascript:alert(1)' } },
  ])('rejects unsafe hero media or links: %o', (body) => {
    expect(
      upsertPageHeroValidationSchema.safeParse({
        params: { page: 'home' },
        body,
      }).success,
    ).toBe(false);
  });
});
