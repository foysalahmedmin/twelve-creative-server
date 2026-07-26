import { updateSiteSettingValidationSchema } from '../site-setting.validator';

const parse = (body: Record<string, unknown>) =>
  updateSiteSettingValidationSchema.safeParse({ body });

describe('Site setting validation', () => {
  it('accepts public URLs, application paths, and empty optional URLs', () => {
    expect(
      parse({
        contact_map_embed_url: 'https://maps.google.com/maps?output=embed',
        calendly_url: '',
        process_thumbnail: '/uploads/process.webp',
        social: { instagram: 'https://instagram.com/twelvecreative' },
        footer: { cta_href: '/contact' },
      }).success,
    ).toBe(true);
  });

  it.each([
    { contact_map_embed_url: 'javascript:alert(1)' },
    { calendly_url: '//evil.example/calendar' },
    { process_thumbnail: '/uploads/../private.txt' },
    { social: { instagram: 'data:text/html,unsafe' } },
    { footer: { cta_href: 'javascript:alert(1)' } },
  ])('rejects unsafe managed references: %o', (body) => {
    expect(parse(body).success).toBe(false);
  });
});
