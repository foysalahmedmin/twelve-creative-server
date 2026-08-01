jest.mock('../site-setting.model', () => ({
  getOrCreateSiteSetting: jest.fn(),
  getOrCreateSiteSettingDocument: jest.fn(),
}));

import {
  getOrCreateSiteSetting,
  getOrCreateSiteSettingDocument,
} from '../site-setting.model';
import * as SiteSettingService from '../site-setting.service';

const setting = {
  _id: '507f1f77bcf86cd799439011',
  singleton_key: 'singleton',
  contact_email: 'hello@twelvecreative.co',
  contact_whatsapp: '+1 555 0100',
  contact_map_embed_url: 'https://maps.example.com/embed',
  booking_notification_email: 'private-notifications@example.com',
  social: { instagram: 'https://instagram.com/twelve' },
  faq_section: { title: 'Questions?' },
  content_section: { title: 'Our process' },
  contact_page: { inquiry: { title: 'Tell us what needs to move.' } },
  footer: { cta_text: 'Ready to grow?' },
  created_at: new Date('2026-01-01'),
};

describe('SiteSettingService', () => {
  it('gets or creates the singleton settings document', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue(setting);

    await expect(SiteSettingService.getSiteSetting()).resolves.toMatchObject(
      setting,
    );
    expect(getOrCreateSiteSetting).toHaveBeenCalledWith();
  });

  it('tells the admin where notifications actually land right now', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue(setting);

    const result = await SiteSettingService.getSiteSetting();

    expect(result.notification_recipients_effective).toEqual([
      'private-notifications@example.com',
    ]);
  });

  it('projects only renderable fields for the public endpoint', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue(setting);

    const result = await SiteSettingService.getPublicSiteSetting();

    expect(result).toMatchObject({
      contact_email: setting.contact_email,
      social: setting.social,
      faq_section: setting.faq_section,
      content_section: setting.content_section,
      contact_page: setting.contact_page,
      footer: setting.footer,
    });
    expect(result).not.toHaveProperty('_id');
    expect(result).not.toHaveProperty('singleton_key');
    expect(result).not.toHaveProperty('booking_notification_email');
    expect(result).not.toHaveProperty('created_at');
  });

  it('updates only the managed canonical singleton document', async () => {
    const existing = {
      contact_email: 'hello@twelvecreative.co',
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue(setting),
    };
    (getOrCreateSiteSettingDocument as jest.Mock).mockResolvedValue(existing);

    const payload = { contact_email: 'hello@twelvecreative.co' };
    await expect(
      SiteSettingService.updateSiteSetting(payload),
    ).resolves.toEqual(setting);

    expect(getOrCreateSiteSettingDocument).toHaveBeenCalledWith();
    expect(existing.save).toHaveBeenCalledWith();
    expect(existing.toObject).toHaveBeenCalledWith();
  });

  it('deep-merges nested sections and updates defined scalar fields', async () => {
    const existing = {
      social: { instagram: 'old-instagram', youtube: 'keep-youtube' },
      faq_section: { title: 'Old title', image: 'keep.jpg' },
      content_section: { title: 'Old content', image: 'keep-content.jpg' },
      contact_page: {
        inquiry: { title: 'Old inquiry', description: 'Keep inquiry body' },
        map: { title: 'Keep map' },
      },
      footer: { description: 'Keep footer', cta_text: 'Old CTA' },
      contact_email: 'old@example.com',
      contact_phone: 'old-phone',
      contact_address: 'old-address',
      contact_whatsapp: 'old-whatsapp',
      contact_map_embed_url: 'old-map',
      booking_notification_email: 'old-booking@example.com',
      calendly_url: 'old-calendly',
      process_thumbnail: 'old-process.jpg',
      meeting_scene_image: 'old-meeting.jpg',
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn(),
    };
    existing.toObject.mockImplementation(() => ({
      social: existing.social,
      faq_section: existing.faq_section,
      content_section: existing.content_section,
      contact_page: existing.contact_page,
      footer: existing.footer,
      contact_email: existing.contact_email,
      contact_phone: existing.contact_phone,
    }));
    (getOrCreateSiteSettingDocument as jest.Mock).mockResolvedValue(existing);

    const result = await SiteSettingService.updateSiteSetting({
      social: { instagram: 'new-instagram', linkedin: 'new-linkedin' },
      faq_section: { title: 'New title' },
      content_section: { title: 'New content' },
      contact_page: {
        inquiry: { title: 'New inquiry' },
        booking: { title: 'New booking' },
      },
      footer: { cta_text: 'New CTA' },
      contact_email: 'new@example.com',
      contact_phone: '',
      contact_address: 'new-address',
      contact_whatsapp: 'new-whatsapp',
      contact_map_embed_url: 'new-map',
      booking_notification_email: 'new-booking@example.com',
      calendly_url: 'new-calendly',
      process_thumbnail: 'new-process.jpg',
      meeting_scene_image: 'new-meeting.jpg',
    });

    expect(existing.social).toEqual({
      instagram: 'new-instagram',
      youtube: 'keep-youtube',
      linkedin: 'new-linkedin',
    });
    expect(existing.faq_section).toEqual({
      title: 'New title',
      image: 'keep.jpg',
    });
    expect(existing.content_section).toEqual({
      title: 'New content',
      image: 'keep-content.jpg',
    });
    expect(existing.contact_page).toEqual({
      inquiry: {
        title: 'New inquiry',
        description: 'Keep inquiry body',
      },
      booking: { title: 'New booking' },
      map: { title: 'Keep map' },
    });
    expect(existing.footer).toEqual({
      description: 'Keep footer',
      cta_text: 'New CTA',
    });
    expect(existing).toMatchObject({
      contact_email: 'new@example.com',
      contact_phone: '',
      contact_address: 'new-address',
      contact_whatsapp: 'new-whatsapp',
      contact_map_embed_url: 'new-map',
      booking_notification_email: 'new-booking@example.com',
      calendly_url: 'new-calendly',
      process_thumbnail: 'new-process.jpg',
      meeting_scene_image: 'new-meeting.jpg',
    });
    expect(existing.save).toHaveBeenCalledWith();
    expect(existing.toObject).toHaveBeenCalledWith();
    expect(result.contact_email).toBe('new@example.com');
  });

  it('does not overwrite existing scalar fields with undefined', async () => {
    const existing = {
      contact_email: 'keep@example.com',
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest
        .fn()
        .mockReturnValue({ contact_email: 'keep@example.com' }),
    };
    (getOrCreateSiteSettingDocument as jest.Mock).mockResolvedValue(existing);

    await SiteSettingService.updateSiteSetting({ contact_email: undefined });

    expect(existing.contact_email).toBe('keep@example.com');
    expect(existing.save).toHaveBeenCalledWith();
  });
});
