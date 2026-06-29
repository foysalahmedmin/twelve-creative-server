import { Document, Model, Types } from 'mongoose';

export type TContactMessage = {
  _id?: Types.ObjectId | string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  is_read: boolean;
  is_archived: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TContactMessageDocument extends TContactMessage, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TContactMessageDocument | null>;
}

export type TContactMessageModel = Model<TContactMessageDocument> & {
  isContactMessageExist(_id: string): Promise<TContactMessageDocument | null>;
};
