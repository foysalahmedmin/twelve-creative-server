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

  describe('notification recipients', () => {
    it('accepts a single address and a comma-separated list', () => {
      expect(
        parse({ booking_notification_email: 'leads@twelve.io' }).success,
      ).toBe(true);
      expect(
        parse({
          booking_notification_email: 'leads@twelve.io, carlos@twelve.io',
        }).success,
      ).toBe(true);
    });

    it('normalizes the stored value regardless of how it was typed', () => {
      const result = parse({
        booking_notification_email:
          '  Leads@Twelve.io ,,  carlos@twelve.io , LEADS@twelve.io ',
      });

      expect(result.success).toBe(true);
      expect(
        result.success && result.data.body.booking_notification_email,
      ).toBe('leads@twelve.io, carlos@twelve.io');
    });

    it('treats an empty value as "use the default"', () => {
      expect(parse({ booking_notification_email: '' }).success).toBe(true);
    });

    it('rejects a list containing an invalid address', () => {
      expect(
        parse({
          booking_notification_email: 'leads@twelve.io, not-an-email',
        }).success,
      ).toBe(false);
    });

    it('rejects more addresses than a notification should fan out to', () => {
      const tooMany = Array.from(
        { length: 11 },
        (_, i) => `person${i}@twelve.io`,
      ).join(', ');

      expect(parse({ booking_notification_email: tooMany }).success).toBe(
        false,
      );
    });
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

  describe('contact_map_embed_url', () => {
    it('accepts the /maps/embed path form', () => {
      expect(
        parse({
          contact_map_embed_url:
            'https://www.google.com/maps/embed?pb=!1m18!1m12',
        }).success,
      ).toBe(true);
    });

    it('accepts non-Google map providers as any safe HTTP(S) URL', () => {
      expect(
        parse({
          contact_map_embed_url: 'https://www.openstreetmap.org/export/embed',
        }).success,
      ).toBe(true);
    });

    it('rejects a Google Maps share/place link — valid URL, but refuses to load in an iframe', () => {
      expect(
        parse({
          contact_map_embed_url:
            'https://www.google.com/maps/place/Miami,+FL/@25.76,-80.19,11z',
        }).success,
      ).toBe(false);
    });

    it('rejects a plain Google Maps search URL missing output=embed', () => {
      expect(
        parse({
          contact_map_embed_url: 'https://maps.google.com/maps?q=Miami',
        }).success,
      ).toBe(false);
    });
  });
});
