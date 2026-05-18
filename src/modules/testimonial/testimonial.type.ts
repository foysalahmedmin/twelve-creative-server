import { Document, Model, Types } from 'mongoose';

export type TTestimonialCategory = 'message' | 'video_message';

export type TTestimonial = {
  _id?: Types.ObjectId | string;
  name: string;
  designation: string;
  image: string; // URL — headshot
  category: TTestimonialCategory;
  message?: string;
  video_message?: string; // URL — uploaded video or external link
  thumbnail?: string; // URL — poster for video
  order: number;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TTestimonialDocument extends TTestimonial, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TTestimonialDocument | null>;
}

export type TTestimonialModel = Model<TTestimonialDocument> & {
  isTestimonialExist(_id: string): Promise<TTestimonialDocument | null>;
};
