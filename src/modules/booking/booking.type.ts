import { Document, Model, Types } from 'mongoose';

export type TBookingStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TLeadSource =
  | 'organic'
  | 'meta_ad'
  | 'google_ad'
  | 'referral'
  | 'direct'
  | 'email'
  | 'other';

export type TBooking = {
  _id?: Types.ObjectId | string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  /** Optional relational Industry selected from the active public list. */
  industry_id?: Types.ObjectId | string;
  /** Immutable display value captured when the booking is submitted. */
  industry_name_snapshot?: string;
  /** @deprecated Kept as the historical/search-compatible display field. */
  industry?: string;
  timeline?: string;
  preferred_date?: Date;
  preferred_time?: string;
  message?: string;
  status: TBookingStatus;
  internal_note?: string;
  source: 'booking_form';
  lead_source?: TLeadSource;
  is_deleted?: boolean;
  deleted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
};

export interface TBookingDocument extends TBooking, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TBookingDocument | null>;
}

export type TBookingModel = Model<TBookingDocument> & {
  isBookingExist(_id: string): Promise<TBookingDocument | null>;
};
