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
  // Deep-merge social separately so partial updates don't blow away other keys.
  if (payload.social) {
    existing.social = {
      ...(existing.social ?? {}),
      ...payload.social,
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
