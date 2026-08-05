/**
 * Booking setting defaults for a fresh install.
 *
 * These are the exact strings the booking section and modal used to hardcode,
 * so seeding changes nothing visually — it just moves the copy somewhere the
 * admin can edit it.
 */

import {
  BOOKING_SETTING_SINGLETON_KEY,
  BookingSetting,
} from '../../modules/booking-setting/booking-setting.model';
import type { TBookingSetting } from '../../modules/booking-setting/booking-setting.type';

export const BOOKING_SETTING_SEED: Omit<
  TBookingSetting,
  '_id' | 'created_at' | 'updated_at'
> = {
  content: {
    label: '4-Step Booking',
    title: 'A quick path from interest to conversation.',
    steps: [
      { title: 'Sector', description: 'Tell us what industry you operate in.' },
      { title: 'Timeline', description: "Pick when you're looking to start." },
      {
        title: 'Date & Time',
        description: 'Choose a date and preferred slot.',
      },
      {
        title: 'Your Details',
        description: "Quick contact info and we're set.",
      },
    ],
    card_title: 'Book a 30-minute call.',
    card_description:
      'Skip the form. Pick a sector, share your timeline and a preferred slot — we’ll reach out within 24 hours.',
    benefits: [
      '30-minute strategic conversation',
      'No commitment, no pitch deck',
      'Response within 24 hours',
    ],
    cta_label: 'Start Booking',
    footnote: 'Or send a detailed inquiry using the form above.',
  },
  questions: {
    sector_title: 'Which sector are we discussing?',
    schedule_title: 'Pick a date & preferred time.',
    schedule_subtitle: "We'll reach out around your selected time slot.",
    details_title: 'Great! Now let us know who you are.',
  },
  availability: {
    slots: [
      { label: 'Morning', range: '9:00 AM – 12:00 PM', is_active: true },
      { label: 'Afternoon', range: '12:00 PM – 4:00 PM', is_active: true },
      { label: 'Evening', range: '4:00 PM – 7:00 PM', is_active: true },
      { label: 'Flexible', range: 'Any time works', is_active: true },
    ],
    // Weekdays only by default — the studio does not take calls at weekends.
    // 1 = Monday … 5 = Friday.
    available_weekdays: [1, 2, 3, 4, 5],
    min_lead_days: 1,
    max_advance_days: 60,
  },
};

export async function seedBookingSetting(force: boolean): Promise<{
  module: string;
  action: 'inserted' | 'skipped' | 'replaced';
  count: number;
}> {
  const existing = await BookingSetting.findOne({
    singleton_key: BOOKING_SETTING_SINGLETON_KEY,
  }).lean();

  if (existing && !force) {
    return { module: 'booking-setting', action: 'skipped', count: 1 };
  }

  if (existing) {
    await BookingSetting.deleteMany({});
  }

  await BookingSetting.create({
    ...BOOKING_SETTING_SEED,
    singleton_key: BOOKING_SETTING_SINGLETON_KEY,
  });

  return {
    module: 'booking-setting',
    action: existing ? 'replaced' : 'inserted',
    count: 1,
  };
}
