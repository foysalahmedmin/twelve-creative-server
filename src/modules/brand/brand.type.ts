import { Document, Model, Types } from 'mongoose';

export type TBrand = {
  _id?: Types.ObjectId | string;
  name: string;
  logo: string; // URL
  href?: string;
  order: number;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TBrandDocument extends TBrand, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TBrandDocument | null>;
}

export type TBrandModel = Model<TBrandDocument> & {
  isBrandExist(_id: string): Promise<TBrandDocument | null>;
};
