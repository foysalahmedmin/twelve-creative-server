jest.mock('../../modules/site-setting/site-setting.model', () => ({
  getOrCreateSiteSetting: jest.fn(),
}));
jest.mock('../../config/env', () => ({
  __esModule: true,
  default: {
    smtp_email: 'smtp-fallback@example.com',
    email: 'email-fallback@example.com',
  },
}));

import { getOrCreateSiteSetting } from '../../modules/site-setting/site-setting.model';
import { resolveNotificationRecipient } from '../notification-recipient';

describe('notification recipient resolution', () => {
  beforeEach(() => jest.clearAllMocks());

  it('prefers the private CMS-managed notification address', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue({
      booking_notification_email: ' leads@twelvecreative.io ',
    });

    await expect(resolveNotificationRecipient()).resolves.toBe(
      'leads@twelvecreative.io',
    );
  });

  it('falls back to server email configuration when unset or unavailable', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValueOnce({});
    await expect(resolveNotificationRecipient()).resolves.toBe(
      'smtp-fallback@example.com',
    );

    (getOrCreateSiteSetting as jest.Mock).mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    await expect(resolveNotificationRecipient()).resolves.toBe(
      'smtp-fallback@example.com',
    );
  });
});
