import { Document, Model, Types } from 'mongoose';

/**
 * The fields the inquiry form renders. Fixed on purpose: the ContactMessage
 * model stores a known shape, and every extra field is folded into the message
 * body, so admins tune the existing fields rather than inventing new ones.
 */
export const CONTACT_FIELD_KEYS = [
  'name',
  'email',
  'phone',
  'company',
  'website',
  'industry',
  'lookingFor',
  'notWorking',
  'timeline',
  'budget',
] as const;

export type TContactFieldKey = (typeof CONTACT_FIELD_KEYS)[number];

/**
 * Name and email are the only values ContactMessage actually requires, so they
 * are never hideable and never optional — otherwise an admin could switch off
 * lead capture without realising it. The admin UI locks them too; this list is
 * the server-side guarantee.
 */
export const LOCKED_CONTACT_FIELD_KEYS: TContactFieldKey[] = ['name', 'email'];

export type TContactField = {
  key: TContactFieldKey;
  label: string;
  placeholder: string;
  is_visible: boolean;
  is_required: boolean;
};

/** One entry in the Timeline or Budget dropdown. */
export type TContactOption = {
  /** Shown to the visitor and recorded on the message — never a slug. */
  label: string;
  /** Stable identifier kept so existing saved messages stay readable. */
  value: string;
  is_active: boolean;
};

export type TContactContent = {
  submit_label: string;
  submitting_label: string;
  industry_placeholder: string;
  industry_other_label: string;
  timeline_placeholder: string;
  budget_placeholder: string;
};

export type TContactSetting = {
  _id?: Types.ObjectId | string;
  singleton_key?: 'contact';
  content: TContactContent;
  fields: TContactField[];
  timeline_options: TContactOption[];
  budget_options: TContactOption[];
  created_at?: Date;
  updated_at?: Date;
};

export type TPublicContactSetting = Pick<
  TContactSetting,
  'content' | 'fields' | 'timeline_options' | 'budget_options'
>;

export interface TContactSettingDocument extends TContactSetting, Document {
  _id: Types.ObjectId;
}

export type TContactSettingModel = Model<TContactSettingDocument>;
