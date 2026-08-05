import mongoose, { Schema } from 'mongoose';
import {
  TBookingSettingDocument,
  TBookingSettingModel,
  TBookingSlot,
  TBookingStep,
  WEEKDAYS,
} from './booking-setting.type';

export const BOOKING_SETTING_SINGLETON_KEY = 'booking' as const;

const bookingStepSchema = new Schema<TBookingStep>(
  {
    title: { type: String, required: true, trim: true, maxlength: 80 },
    description: { type: String, required: true, trim: true, maxlength: 240 },
  },
  { _id: false },
);

const bookingSlotSchema = new Schema<TBookingSlot>(
  {
    label: { type: String, required: true, trim: true, maxlength: 60 },
    range: { type: String, required: true, trim: true, maxlength: 80 },
    // Deactivating beats deleting: the studio can close a slot for a busy
    // period and reopen it later without retyping it.
    is_active: { type: Boolean, default: true },
  },
  { _id: false },
);

const bookingSettingSchema = new Schema<TBookingSettingDocument>(
  {
    singleton_key: {
      type: String,
      default: BOOKING_SETTING_SINGLETON_KEY,
      enum: [BOOKING_SETTING_SINGLETON_KEY],
      unique: true,
      immutable: true,
    },
    content: {
      label: { type: String, trim: true, maxlength: 60, default: '' },
      title: { type: String, trim: true, maxlength: 160, default: '' },
      steps: { type: [bookingStepSchema], default: [] },
      card_title: { type: String, trim: true, maxlength: 120, default: '' },
      card_description: {
        type: String,
        trim: true,
        maxlength: 400,
        default: '',
      },
      benefits: {
        type: [{ type: String, trim: true, maxlength: 120 }],
        default: [],
      },
      cta_label: { type: String, trim: true, maxlength: 60, default: '' },
      footnote: { type: String, trim: true, maxlength: 200, default: '' },
    },
    questions: {
      sector_title: { type: String, trim: true, maxlength: 160, default: '' },
      schedule_title: { type: String, trim: true, maxlength: 160, default: '' },
      schedule_subtitle: {
        type: String,
        trim: true,
        maxlength: 240,
        default: '',
      },
      details_title: { type: String, trim: true, maxlength: 160, default: '' },
    },
    availability: {
      slots: { type: [bookingSlotSchema], default: [] },
      available_weekdays: {
        type: [{ type: Number, enum: WEEKDAYS }],
        default: [],
      },
      min_lead_days: { type: Number, min: 0, max: 90, default: 0 },
      max_advance_days: { type: Number, min: 1, max: 365, default: 60 },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export const BookingSetting = mongoose.model<
  TBookingSettingDocument,
  TBookingSettingModel
>('BookingSetting', bookingSettingSchema);
