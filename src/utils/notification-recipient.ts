import config from '../config/env';
import { getOrCreateSiteSetting } from '../modules/site-setting/site-setting.model';

const configuredFallback = (): string | undefined =>
  (config.smtp_email || config.email)?.trim() || undefined;

/**
 * Resolves the private CMS-managed recipient without allowing a temporary
 * settings read failure to break public lead capture.
 */
export const resolveNotificationRecipient = async (): Promise<
  string | undefined
> => {
  try {
    const settings = await getOrCreateSiteSetting();
    return settings.booking_notification_email?.trim() || configuredFallback();
  } catch {
    return configuredFallback();
  }
};
