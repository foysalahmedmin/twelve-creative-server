import { Document, Model, Types } from 'mongoose';

export type TFaq = {
  _id?: Types.ObjectId | string;
  question: string;
  answer: string;
  group?: string;
  order: number;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TFaqDocument extends TFaq, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TFaqDocument | null>;
}

export type TFaqModel = Model<TFaqDocument> & {
  isFaqExist(_id: string): Promise<TFaqDocument | null>;
};
