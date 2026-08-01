import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import { resolveNotificationRecipients } from '../../utils/notification-recipient';
import { sendEmail } from '../../utils/send-email';
import {
  getOrCreateSiteSetting,
  getOrCreateSiteSettingDocument,
} from './site-setting.model';
import {
  TAdminSiteSetting,
  TPublicSiteSetting,
  TSiteSetting,
} from './site-setting.type';

export const getSiteSetting = async (): Promise<TAdminSiteSetting> => {
  const setting = await getOrCreateSiteSetting();
  return {
    ...setting,
    notification_recipients_effective: await resolveNotificationRecipients(),
  };
};

export const getPublicSiteSetting = async (): Promise<TPublicSiteSetting> => {
  const setting = await getOrCreateSiteSetting();

  // Explicit allowlist: operational recipients, singleton metadata, ids, and
  // timestamps can never be serialized by the public endpoint.
  return {
    contact_email: setting.contact_email,
    contact_phone: setting.contact_phone,
    contact_address: setting.contact_address,
    contact_whatsapp: setting.contact_whatsapp,
    contact_map_embed_url: setting.contact_map_embed_url,
    social: setting.social,
    faq_section: setting.faq_section,
    calendly_url: setting.calendly_url,
    process_thumbnail: setting.process_thumbnail,
    meeting_scene_image: setting.meeting_scene_image,
    content_section: setting.content_section,
    contact_page: setting.contact_page,
    footer: setting.footer,
  };
};

const testEmailHtml = (recipients: string[]): string => `
  <div style="font-family:system-ui,sans-serif">
    <h2>Notification email is working</h2>
    <p style="font-size:14px;color:#444">
      This is a test from the Twelve Creative admin panel. Booking and contact
      form notifications will arrive at this address.
    </p>
    <p style="font-size:14px;color:#444">
      Currently notifying: <strong>${recipients.join(', ')}</strong>
    </p>
    <p style="font-size:12px;color:#888">Sent ${new Date().toUTCString()}</p>
  </div>`;

/**
 * Sends a real notification-shaped email to whoever is configured right now,
 * so an admin can confirm the address actually receives mail rather than
 * finding out when a lead goes missing.
 *
 * Deliberately targets the saved recipients rather than an address supplied in
 * the request — that keeps the endpoint from becoming a way to send mail to
 * arbitrary addresses.
 */
export const sendTestNotificationEmail = async (): Promise<{
  recipients: string[];
}> => {
  const recipients = await resolveNotificationRecipients();
  if (!recipients.length) {
    throw new AppError(
      httpStatus.BAD_REQUEST,
      'No notification email is configured, and no fallback sender is set up on the server.',
    );
  }

  try {
    await sendEmail({
      to: recipients,
      subject: 'Twelve Creative — notification email test',
      text: `This is a test from the Twelve Creative admin panel. Notifications will arrive at: ${recipients.join(', ')}`,
      html: testEmailHtml(recipients),
    });
  } catch (error) {
    throw new AppError(
      httpStatus.BAD_GATEWAY,
      `Could not send the test email: ${(error as Error).message}`,
    );
  }

  return { recipients };
};

export const updateSiteSetting = async (
  payload: Partial<TSiteSetting>,
): Promise<TSiteSetting> => {
  const existing = await getOrCreateSiteSettingDocument();
  // Deep-merge nested objects so partial updates don't blow away sibling keys.
  if (payload.social) {
    existing.social = {
      ...(existing.social ?? {}),
      ...payload.social,
    };
  }
  if (payload.faq_section) {
    existing.faq_section = {
      ...(existing.faq_section ?? {}),
      ...payload.faq_section,
    };
  }
  if (payload.content_section) {
    existing.content_section = {
      ...(existing.content_section ?? {}),
      ...payload.content_section,
    };
  }
  if (payload.contact_page) {
    existing.contact_page = {
      ...(existing.contact_page ?? {}),
      ...payload.contact_page,
      ...(payload.contact_page.inquiry
        ? {
            inquiry: {
              ...(existing.contact_page?.inquiry ?? {}),
              ...payload.contact_page.inquiry,
            },
          }
        : {}),
      ...(payload.contact_page.booking
        ? {
            booking: {
              ...(existing.contact_page?.booking ?? {}),
              ...payload.contact_page.booking,
            },
          }
        : {}),
      ...(payload.contact_page.map
        ? {
            map: {
              ...(existing.contact_page?.map ?? {}),
              ...payload.contact_page.map,
            },
          }
        : {}),
    };
  }
  if (payload.footer) {
    existing.footer = {
      ...(existing.footer ?? {}),
      ...payload.footer,
    };
  }
  if (payload.contact_email !== undefined)
    existing.contact_email = payload.contact_email;
  if (payload.contact_phone !== undefined)
    existing.contact_phone = payload.contact_phone;
  if (payload.contact_address !== undefined)
    existing.contact_address = payload.contact_address;
  if (payload.contact_whatsapp !== undefined)
    existing.contact_whatsapp = payload.contact_whatsapp;
  if (payload.contact_map_embed_url !== undefined)
    existing.contact_map_embed_url = payload.contact_map_embed_url;
  if (payload.booking_notification_email !== undefined)
    existing.booking_notification_email = payload.booking_notification_email;
  if (payload.calendly_url !== undefined)
    existing.calendly_url = payload.calendly_url;
  if (payload.process_thumbnail !== undefined)
    existing.process_thumbnail = payload.process_thumbnail;
  if (payload.meeting_scene_image !== undefined)
    existing.meeting_scene_image = payload.meeting_scene_image;
  await existing.save();
  return existing.toObject();
};
