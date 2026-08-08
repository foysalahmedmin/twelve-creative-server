import mongoose, { Schema } from 'mongoose';
import {
  CONTACT_FIELD_KEYS,
  TContactField,
  TContactOption,
  TContactSettingDocument,
  TContactSettingModel,
} from './contact-setting.type';

export const CONTACT_SETTING_SINGLETON_KEY = 'contact' as const;

const contactFieldSchema = new Schema<TContactField>(
  {
    key: { type: String, enum: CONTACT_FIELD_KEYS, required: true },
    label: { type: String, required: true, trim: true, maxlength: 120 },
    placeholder: { type: String, trim: true, maxlength: 160, default: '' },
    is_visible: { type: Boolean, default: true },
    is_required: { type: Boolean, default: false },
  },
  { _id: false },
);

const contactOptionSchema = new Schema<TContactOption>(
  {
    label: { type: String, required: true, trim: true, maxlength: 80 },
    value: { type: String, required: true, trim: true, maxlength: 60 },
    // Deactivating beats deleting: a tier can be retired for a while and
    // brought back without retyping it.
    is_active: { type: Boolean, default: true },
  },
  { _id: false },
);

const contactSettingSchema = new Schema<TContactSettingDocument>(
  {
    singleton_key: {
      type: String,
      default: CONTACT_SETTING_SINGLETON_KEY,
      enum: [CONTACT_SETTING_SINGLETON_KEY],
      unique: true,
      immutable: true,
    },
    content: {
      submit_label: { type: String, trim: true, maxlength: 60, default: '' },
      submitting_label: {
        type: String,
        trim: true,
        maxlength: 60,
        default: '',
      },
      industry_placeholder: {
        type: String,
        trim: true,
        maxlength: 80,
        default: '',
      },
      industry_other_label: {
        type: String,
        trim: true,
        maxlength: 80,
        default: '',
      },
      timeline_placeholder: {
        type: String,
        trim: true,
        maxlength: 80,
        default: '',
      },
      budget_placeholder: {
        type: String,
        trim: true,
        maxlength: 80,
        default: '',
      },
    },
    fields: { type: [contactFieldSchema], default: [] },
    timeline_options: { type: [contactOptionSchema], default: [] },
    budget_options: { type: [contactOptionSchema], default: [] },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export const ContactSetting = mongoose.model<
  TContactSettingDocument,
  TContactSettingModel
>('ContactSetting', contactSettingSchema);
