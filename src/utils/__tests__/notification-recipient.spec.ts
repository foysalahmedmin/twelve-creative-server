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
import {
  formatRecipientList,
  parseRecipientList,
  resolveNotificationRecipients,
} from '../notification-recipient';

describe('notification recipient resolution', () => {
  beforeEach(() => jest.clearAllMocks());

  it('prefers the private CMS-managed notification address', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue({
      booking_notification_email: ' leads@twelvecreative.io ',
    });

    await expect(resolveNotificationRecipients()).resolves.toEqual([
      'leads@twelvecreative.io',
    ]);
  });

  it('notifies every address in a comma-separated list', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue({
      booking_notification_email:
        'leads@twelvecreative.io, carlos@twelvecreative.io',
    });

    await expect(resolveNotificationRecipients()).resolves.toEqual([
      'leads@twelvecreative.io',
      'carlos@twelvecreative.io',
    ]);
  });

  it('falls back to server email configuration when unset or unavailable', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValueOnce({});
    await expect(resolveNotificationRecipients()).resolves.toEqual([
      'smtp-fallback@example.com',
    ]);

    (getOrCreateSiteSetting as jest.Mock).mockRejectedValueOnce(
      new Error('database unavailable'),
    );
    await expect(resolveNotificationRecipients()).resolves.toEqual([
      'smtp-fallback@example.com',
    ]);
  });

  it('treats a whitespace-only list as unset so leads still reach the fallback', async () => {
    (getOrCreateSiteSetting as jest.Mock).mockResolvedValue({
      booking_notification_email: '  ,  , ',
    });

    await expect(resolveNotificationRecipients()).resolves.toEqual([
      'smtp-fallback@example.com',
    ]);
  });
});

describe('recipient list parsing', () => {
  it('trims, lower-cases, and drops blank entries', () => {
    expect(parseRecipientList(' One@Example.com , ,two@example.com ')).toEqual([
      'one@example.com',
      'two@example.com',
    ]);
  });

  it('de-duplicates addresses that differ only by case or spacing', () => {
    expect(
      parseRecipientList(
        'team@example.com, TEAM@example.com , team@example.com',
      ),
    ).toEqual(['team@example.com']);
  });

  it('round-trips through the canonical stored form', () => {
    const stored = formatRecipientList(
      parseRecipientList('B@example.com,a@example.com'),
    );
    expect(stored).toBe('b@example.com, a@example.com');
    expect(parseRecipientList(stored)).toEqual([
      'b@example.com',
      'a@example.com',
    ]);
  });

  it('returns nothing for empty input', () => {
    expect(parseRecipientList(undefined)).toEqual([]);
    expect(parseRecipientList('')).toEqual([]);
  });
});
