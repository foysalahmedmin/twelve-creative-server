import { getOrCreateSiteSetting, SiteSetting } from './site-setting.model';
import { TSiteSetting } from './site-setting.type';

export const getSiteSetting = async (): Promise<TSiteSetting> => {
  return await getOrCreateSiteSetting();
};

export const updateSiteSetting = async (
  payload: Partial<TSiteSetting>,
): Promise<TSiteSetting> => {
  const existing = await SiteSetting.findOne();
  if (!existing) {
    const created = await SiteSetting.create(payload);
    return created.toObject();
  }
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
  if (payload.contact_email !== undefined)
    existing.contact_email = payload.contact_email;
  if (payload.contact_phone !== undefined)
    existing.contact_phone = payload.contact_phone;
  if (payload.contact_address !== undefined)
    existing.contact_address = payload.contact_address;
  if (payload.booking_notification_email !== undefined)
    existing.booking_notification_email = payload.booking_notification_email;
  await existing.save();
  return existing.toObject();
};
