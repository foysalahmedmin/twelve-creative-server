/**
 * Contact form defaults for a fresh install.
 *
 * These are the exact labels, placeholders and dropdown entries the inquiry
 * form used to hardcode, so seeding changes nothing visually — it only moves
 * them somewhere the admin can edit.
 */

import {
  CONTACT_SETTING_SINGLETON_KEY,
  ContactSetting,
} from '../../modules/contact-setting/contact-setting.model';
import type { TContactSetting } from '../../modules/contact-setting/contact-setting.type';

export const CONTACT_SETTING_SEED: Omit<
  TContactSetting,
  '_id' | 'created_at' | 'updated_at'
> = {
  content: {
    submit_label: 'Submit Inquiry',
    submitting_label: 'Submitting Inquiry...',
    industry_placeholder: 'Select Industry',
    industry_other_label: 'Other',
    timeline_placeholder: 'Select Timeline',
    budget_placeholder: 'Select Range',
  },
  fields: [
    // name + email are locked visible/required — see LOCKED_CONTACT_FIELD_KEYS.
    {
      key: 'name',
      label: 'Full Name',
      placeholder: 'John Doe',
      is_visible: true,
      is_required: true,
    },
    {
      key: 'email',
      label: 'Email Address',
      placeholder: 'john@example.com',
      is_visible: true,
      is_required: true,
    },
    {
      key: 'phone',
      label: 'Phone Number',
      placeholder: '+1 (234) 567-890',
      is_visible: true,
      is_required: false,
    },
    {
      key: 'company',
      label: 'Company Name',
      placeholder: 'SparkLabs Inc',
      is_visible: true,
      is_required: false,
    },
    {
      key: 'website',
      label: 'Website / Instagram',
      placeholder: 'example.com',
      is_visible: true,
      is_required: false,
    },
    {
      key: 'industry',
      label: 'Industry Category',
      placeholder: '',
      is_visible: true,
      is_required: false,
    },
    {
      key: 'lookingFor',
      label: 'What are you looking for help with?',
      placeholder:
        'e.g. Creative Production, SaaS Video Editing, CRM Integrations...',
      is_visible: true,
      is_required: false,
    },
    {
      key: 'notWorking',
      label: 'What is currently not working?',
      placeholder: 'Describe your current bottleneck problems in detail...',
      is_visible: true,
      is_required: false,
    },
    {
      key: 'timeline',
      label: 'Timeline',
      placeholder: '',
      is_visible: true,
      is_required: false,
    },
    {
      key: 'budget',
      label: 'Monthly Budget Range',
      placeholder: '',
      is_visible: true,
      is_required: false,
    },
  ],
  // `value` matches what the old hardcoded <option value="…"> used, so any
  // message saved before this existed still lines up with these entries.
  timeline_options: [
    { label: 'ASAP', value: 'asap', is_active: true },
    { label: '1-3 Months', value: '1-3-months', is_active: true },
    { label: '3-6 Months', value: '3-6-months', is_active: true },
    { label: 'Flexible', value: 'flexible', is_active: true },
  ],
  budget_options: [
    { label: '$2,000 - $5,000', value: '2k-5k', is_active: true },
    { label: '$5,000 - $10,000', value: '5k-10k', is_active: true },
    { label: '$10,000+', value: '10k-plus', is_active: true },
  ],
};

export async function seedContactSetting(force: boolean): Promise<{
  module: string;
  action: 'inserted' | 'skipped' | 'replaced';
  count: number;
}> {
  const existing = await ContactSetting.findOne({
    singleton_key: CONTACT_SETTING_SINGLETON_KEY,
  }).lean();

  if (existing && !force) {
    return { module: 'contact-setting', action: 'skipped', count: 1 };
  }

  if (existing) {
    await ContactSetting.deleteMany({});
  }

  await ContactSetting.create({
    ...CONTACT_SETTING_SEED,
    singleton_key: CONTACT_SETTING_SINGLETON_KEY,
  });

  return {
    module: 'contact-setting',
    action: existing ? 'replaced' : 'inserted',
    count: 1,
  };
}
