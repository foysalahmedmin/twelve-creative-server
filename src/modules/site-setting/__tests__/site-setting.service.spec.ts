jest.mock('../site-setting.model', () => ({
  getOrCreateSiteSetting: jest.fn(),
  SiteSetting: {
    findOne: jest.fn(),
    create: jest.fn(),
  },
}));

import { getOrCreateSiteSetting, SiteSetting } from '../site-setting.model';
import * as SiteSettingService from '../site-setting.service';

const setting = {
  _id: '507f1f77bcf86cd799439011',
  singleton_key: 'singleton',
  contact_email: 'hello@twelvecreative.co',
  booking_notification_email: 'private-notifications@example.com',
  social: { instagram: 'https://instagram.com/twelve' },
  faq_section: { title: 'Questions?' },
  content_section: { title: 'Our process' },
  created_at: new Date('2026-01-01'),
};

describe('SiteSettingService', () => {
  it('gets or creates the singleton settings document', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue(setting);

    await expect(SiteSettingService.getSiteSetting()).resolves.toEqual(setting);
    expect(getOrCreateSiteSetting).toHaveBeenCalledWith();
  });

  it('projects only renderable fields for the public endpoint', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue(setting);

    const result = await SiteSettingService.getPublicSiteSetting();

    expect(result).toMatchObject({
      contact_email: setting.contact_email,
      social: setting.social,
      faq_section: setting.faq_section,
      content_section: setting.content_section,
    });
    expect(result).not.toHaveProperty('_id');
    expect(result).not.toHaveProperty('singleton_key');
    expect(result).not.toHaveProperty('booking_notification_email');
    expect(result).not.toHaveProperty('created_at');
  });

  it('uses the atomic singleton ensure when settings do not exist', async () => {
    const existing = {
      contact_email: 'hello@twelvecreative.co',
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn().mockReturnValue(setting),
    };
    (SiteSetting.findOne as jest.Mock)
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(existing);
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue(setting);

    const payload = { contact_email: 'hello@twelvecreative.co' };
    await expect(
      SiteSettingService.updateSiteSetting(payload),
    ).resolves.toEqual(setting);

    expect(getOrCreateSiteSetting).toHaveBeenCalledWith();
    expect(SiteSetting.findOne).toHaveBeenCalledTimes(2);
    expect(existing.save).toHaveBeenCalledWith();
    expect(existing.toObject).toHaveBeenCalledWith();
  });

  it('deep-merges nested sections and updates defined scalar fields', async () => {
    const existing = {
      social: { instagram: 'old-instagram', youtube: 'keep-youtube' },
      faq_section: { title: 'Old title', image: 'keep.jpg' },
      content_section: { title: 'Old content', image: 'keep-content.jpg' },
      contact_email: 'old@example.com',
      contact_phone: 'old-phone',
      contact_address: 'old-address',
      booking_notification_email: 'old-booking@example.com',
      calendly_url: 'old-calendly',
      process_thumbnail: 'old-process.jpg',
      how_we_structure_image: 'old-structure.jpg',
      meeting_scene_image: 'old-meeting.jpg',
      save: jest.fn().mockResolvedValue(undefined),
      toObject: jest.fn(),
    };
    existing.toObject.mockImplementation(() => ({
      social: existing.social,
      faq_section: existing.faq_section,
      content_section: existing.content_section,
      contact_email: existing.contact_email,
      contact_phone: existing.contact_phone,
    }));
    (SiteSetting.findOne as jest.Mock).mockResolvedValue(existing);

    const result = await SiteSettingService.updateSiteSetting({
      social: { instagram: 'new-instagram', linkedin: 'new-linkedin' },
      faq_section: { title: 'New title' },
      content_section: { title: 'New content' },
      contact_email: 'new@example.com',
      contact_phone: '',
      contact_address: 'new-address',
      booking_notification_email: 'new-booking@example.com',
      calendly_url: 'new-calendly',
      process_thumbnail: 'new-process.jpg',
      how_we_structure_image: 'new-structure.jpg',
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
    expect(existing).toMatchObject({
      contact_email: 'new@example.com',
      contact_phone: '',
      contact_address: 'new-address',
      booking_notification_email: 'new-booking@example.com',
      calendly_url: 'new-calendly',
      process_thumbnail: 'new-process.jpg',
      how_we_structure_image: 'new-structure.jpg',
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
    (SiteSetting.findOne as jest.Mock).mockResolvedValue(existing);

    await SiteSettingService.updateSiteSetting({ contact_email: undefined });

    expect(existing.contact_email).toBe('keep@example.com');
    expect(existing.save).toHaveBeenCalledWith();
  });
});
