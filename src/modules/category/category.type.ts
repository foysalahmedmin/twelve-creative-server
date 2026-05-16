import { Document, Model, Types } from 'mongoose';

export type TStatus = 'active' | 'inactive';

export type TCategory = {
  _id?: Types.ObjectId | string;
  icon?: string; // Image URL
  name: string;
  description?: string;
  sequence?: number;
  status: TStatus;
  tags: string[];
  layout?: string;
  is_featured: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TCategoryDocument extends TCategory, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TCategoryDocument | null>;
}

export type TCategoryModel = Model<TCategoryDocument> & {
  isCategoryExist(_id: string): Promise<TCategoryDocument | null>;
};
