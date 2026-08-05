import { Document, Model, Types } from 'mongoose';

/** 0 = Sunday … 6 = Saturday, matching JS `Date.prototype.getDay()`. */
export const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6] as const;
export type TWeekday = (typeof WEEKDAYS)[number];

/** One card in the "how booking works" list beside the CTA panel. */
export type TBookingStep = {
  title: string;
  description: string;
};

/** One selectable slot on the date-and-time step of the modal. */
export type TBookingSlot = {
  label: string;
  range: string;
  is_active: boolean;
};

export type TBookingContent = {
  label: string;
  title: string;
  steps: TBookingStep[];
  card_title: string;
  card_description: string;
  benefits: string[];
  cta_label: string;
  footnote: string;
};

/** Headings shown at the top of each modal step. */
export type TBookingQuestions = {
  sector_title: string;
  schedule_title: string;
  schedule_subtitle: string;
  details_title: string;
};

export type TBookingAvailability = {
  slots: TBookingSlot[];
  /**
   * Days the studio accepts calls on. An empty list would make every date
   * unselectable, so the reader falls back to all seven rather than trapping
   * the visitor with a calendar that rejects everything.
   */
  available_weekdays: TWeekday[];
  /** Earliest bookable date, in days from today. 0 allows same-day. */
  min_lead_days: number;
  /** How far ahead the calendar stays open. */
  max_advance_days: number;
};

export type TBookingSetting = {
  _id?: Types.ObjectId | string;
  singleton_key?: 'booking';
  content: TBookingContent;
  questions: TBookingQuestions;
  availability: TBookingAvailability;
  created_at?: Date;
  updated_at?: Date;
};

export type TPublicBookingSetting = Pick<
  TBookingSetting,
  'content' | 'questions' | 'availability'
>;

export interface TBookingSettingDocument extends TBookingSetting, Document {
  _id: Types.ObjectId;
}

export type TBookingSettingModel = Model<TBookingSettingDocument>;
