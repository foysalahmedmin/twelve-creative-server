import { Document, Model, Types } from 'mongoose';

export type TVideoSource = 'youtube' | 'url' | 'upload';

export type TVideoRef = {
  source: TVideoSource;
  value: string;
};

export type TShowcaseAspect = 'reel' | 'landscape';

export type TShowcaseVideo = {
  _id?: Types.ObjectId | string;
  video: TVideoRef;
  thumbnail?: string; // optional URL — auto-derived for YouTube videos
  alt: string;
  /**
   * Decides which public surface the video shows on:
   * - `reel`      → Visual Library marquee (portrait 9:16)
   * - `landscape` → Work Showcase thumbnail grid (16:9)
   */
  aspect: TShowcaseAspect;
  order: number;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TShowcaseVideoDocument extends TShowcaseVideo, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TShowcaseVideoDocument | null>;
}

export type TShowcaseVideoModel = Model<TShowcaseVideoDocument> & {
  isShowcaseVideoExist(_id: string): Promise<TShowcaseVideoDocument | null>;
};
