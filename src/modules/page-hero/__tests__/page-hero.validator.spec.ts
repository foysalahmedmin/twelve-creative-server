import { pageHeroParamSchema } from '../page-hero.validator';

describe('Page hero public parameter validation', () => {
  it('accepts known page keys and rejects arbitrary keys', () => {
    expect(
      pageHeroParamSchema.safeParse({ params: { page: 'home' } }).success,
    ).toBe(true);
    expect(
      pageHeroParamSchema.safeParse({ params: { page: 'private-preview' } })
        .success,
    ).toBe(false);
  });
});
