import { Document, Model, Types } from 'mongoose';

export type TBookingStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type TBooking = {
  _id?: Types.ObjectId | string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  industry?: string;
  timeline?: string;
  preferred_date?: Date;
  preferred_time?: string;
  message?: string;
  status: TBookingStatus;
  internal_note?: string;
  source: 'booking_form';
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TBookingDocument extends TBooking, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TBookingDocument | null>;
}

export type TBookingModel = Model<TBookingDocument> & {
  isBookingExist(_id: string): Promise<TBookingDocument | null>;
};
