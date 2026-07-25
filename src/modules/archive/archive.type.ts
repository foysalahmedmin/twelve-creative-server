import { Document, Model, Types } from 'mongoose';

export type TStatus = 'draft' | 'active' | 'archived';

export type TType = 'video' | 'podcast';

export type TSensitivityLevel = 'public' | 'sensitive' | 'restricted';

export type TPost = {
  title: string;
  description?: string;
  content: string;
  thumbnail?: Types.ObjectId;
  video?: Types.ObjectId;
  youtube?: string;
  tags?: string[];
  categories?: Types.ObjectId[];
  user: Types.ObjectId;
  status: TStatus;
  type: TType;
  ratio?: string;
  is_featured?: boolean;
  is_deleted: boolean;
  deleted_at?: Date;
  created_at?: Date;
  updated_at?: Date;
};

export interface TPostDocument extends TPost, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TPostDocument | null>;
}

export type TPostModel = Model<TPostDocument> & {
  isPostExist(_id: string): Promise<TPostDocument | null>;
};
