import { Document, Model, Types } from 'mongoose';

export type TTestimonialCategory = 'message' | 'video_message';

export type TVideoSource = 'youtube' | 'url' | 'upload';

export type TVideoRef = {
  source: TVideoSource;
  value: string;
};

export type TTestimonial = {
  _id?: Types.ObjectId | string;
  name: string;
  designation: string;
  image: string; // URL — headshot
  category: TTestimonialCategory;
  message?: string;
  video_message?: TVideoRef; // required when category === 'video_message'
  thumbnail?: string; // URL — optional, auto-derived for YouTube videos
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
