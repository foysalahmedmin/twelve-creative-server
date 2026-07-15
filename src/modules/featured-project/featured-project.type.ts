import { Document, Model, Types } from 'mongoose';
import { TIndustrySummary } from '../industry/industry.type';

export type TVideoSource = 'youtube' | 'url' | 'upload';

export type TVideoRef = {
  source: TVideoSource;
  value: string;
};

export type TFeaturedAspect = 'reel' | 'landscape';

export type TFeaturedProject = {
  _id?: Types.ObjectId | string;
  title: string;
  /** Mandatory owning Industry. Populated on every API read. */
  industry: Types.ObjectId | string;
  /**
   * Visual aspect — `reel` (9:16 portrait) or `landscape` (16:9).
   * Drives the public grid layout.
   */
  aspect: TFeaturedAspect;
  thumbnail: string;
  video: TVideoRef;
  order: number;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export type TFeaturedProjectPopulated = Omit<TFeaturedProject, 'industry'> & {
  industry: TIndustrySummary;
};

export interface TFeaturedProjectDocument extends TFeaturedProject, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TFeaturedProjectDocument | null>;
}

export type TFeaturedProjectModel = Model<TFeaturedProjectDocument> & {
  isFeaturedProjectExist(_id: string): Promise<TFeaturedProjectDocument | null>;
};
