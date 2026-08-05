import {
  BOOKING_SETTING_SINGLETON_KEY,
  BookingSetting,
} from './booking-setting.model';
import { TBookingSetting, TPublicBookingSetting } from './booking-setting.type';

export const getBookingSetting = async (): Promise<TBookingSetting | null> => {
  return await BookingSetting.findOne({
    singleton_key: BOOKING_SETTING_SINGLETON_KEY,
  }).lean();
};

export const getPublicBookingSetting =
  async (): Promise<TPublicBookingSetting | null> => {
    const setting = await getBookingSetting();
    if (!setting) return null;

    // Explicit allowlist keeps singleton metadata, ids and timestamps out of
    // the public payload even if the schema grows later.
    return {
      content: setting.content,
      questions: setting.questions,
      availability: setting.availability,
    };
  };

/**
 * Upsert so the first save works on an install that was never seeded, and so
 * a partial payload only touches the groups it actually contains — an admin
 * editing the copy must not wipe the availability rules.
 */
export const updateBookingSetting = async (
  payload: Partial<TBookingSetting>,
): Promise<TBookingSetting> => {
  const set: Record<string, unknown> = {};

  for (const group of ['content', 'questions', 'availability'] as const) {
    const value = payload[group];
    if (!value) continue;
    for (const [field, fieldValue] of Object.entries(value)) {
      if (fieldValue !== undefined) set[`${group}.${field}`] = fieldValue;
    }
  }

  const updated = await BookingSetting.findOneAndUpdate(
    { singleton_key: BOOKING_SETTING_SINGLETON_KEY },
    { $set: set },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  ).lean();

  return updated as TBookingSetting;
};
