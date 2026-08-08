import {
  CONTACT_SETTING_SINGLETON_KEY,
  ContactSetting,
} from './contact-setting.model';
import { TContactSetting, TPublicContactSetting } from './contact-setting.type';

export const getContactSetting = async (): Promise<TContactSetting | null> => {
  return await ContactSetting.findOne({
    singleton_key: CONTACT_SETTING_SINGLETON_KEY,
  }).lean();
};

export const getPublicContactSetting =
  async (): Promise<TPublicContactSetting | null> => {
    const setting = await getContactSetting();
    if (!setting) return null;

    // Explicit allowlist keeps singleton metadata, ids and timestamps out of
    // the public payload even if the schema grows later.
    return {
      content: setting.content,
      fields: setting.fields,
      timeline_options: setting.timeline_options,
      budget_options: setting.budget_options,
    };
  };

/**
 * Upsert so the first save works on an install that was never seeded. Arrays
 * are replaced wholesale (that is what editing a list means), while `content`
 * is merged key by key so a partial payload cannot blank the rest.
 */
export const updateContactSetting = async (
  payload: Partial<TContactSetting>,
): Promise<TContactSetting> => {
  const set: Record<string, unknown> = {};

  if (payload.content) {
    for (const [field, value] of Object.entries(payload.content)) {
      if (value !== undefined) set[`content.${field}`] = value;
    }
  }
  for (const key of ['fields', 'timeline_options', 'budget_options'] as const) {
    if (payload[key] !== undefined) set[key] = payload[key];
  }

  const updated = await ContactSetting.findOneAndUpdate(
    { singleton_key: CONTACT_SETTING_SINGLETON_KEY },
    { $set: set },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  return updated as TContactSetting;
};
