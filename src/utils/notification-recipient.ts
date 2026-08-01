import config from '../config/env';
import { getOrCreateSiteSetting } from '../modules/site-setting/site-setting.model';

/**
 * Upper bound on how many addresses a single notification can fan out to.
 * Keeps an accidental paste from turning lead capture into a mailing list.
 */
export const MAX_NOTIFICATION_RECIPIENTS = 10;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isEmailAddress = (value: string): boolean =>
  EMAIL_PATTERN.test(value);

/**
 * Splits the admin-managed "who gets notified" string into addresses.
 *
 * The field stays one comma-separated string rather than becoming an array so
 * the existing singleton document and every historical single-address value
 * keep working untouched.
 */
export const parseRecipientList = (value?: string | null): string[] => {
  if (!value) return [];
  const unique = new Set<string>();
  for (const part of value.split(',')) {
    const address = part.trim().toLowerCase();
    if (address) unique.add(address);
  }
  return [...unique];
};

/** Canonical stored form: de-duplicated, lower-cased, ", "-joined. */
export const formatRecipientList = (addresses: string[]): string =>
  addresses.join(', ');

/**
 * Where notifications go when an admin leaves the field empty. Derived from
 * the configured sender so the default follows whatever mailbox the app
 * actually sends from, instead of being a second copy that can drift.
 */
export const configuredFallbackRecipients = (): string[] =>
  parseRecipientList((config.smtp_email || config.email)?.trim());

/**
 * Resolves the private CMS-managed recipients without letting a temporary
 * settings read failure break public lead capture.
 */
export const resolveNotificationRecipients = async (): Promise<string[]> => {
  try {
    const settings = await getOrCreateSiteSetting();
    const configured = parseRecipientList(settings.booking_notification_email);
    return configured.length ? configured : configuredFallbackRecipients();
  } catch {
    return configuredFallbackRecipients();
  }
};
