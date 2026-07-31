import { Document, Model, Types } from 'mongoose';

export type TInsightStatus = 'draft' | 'published';

export type TInsight = {
  _id?: Types.ObjectId | string;
  slug: string;
  title: string;
  excerpt: string;
  cover: string;
  content: string;
  category?: string;
  read_minutes?: number;
  status: TInsightStatus;
  published_at?: Date;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TInsightDocument extends TInsight, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TInsightDocument | null>;
}

export type TInsightModel = Model<TInsightDocument> & {
  isInsightExist(_id: string): Promise<TInsightDocument | null>;
};
