import { Document, Model, Types } from 'mongoose';
import { TIndustrySummary } from '../industry/industry.type';

export type TVideoSource = 'youtube' | 'url' | 'upload';

export type TVideoRef = { source: TVideoSource; value: string };

export type TMetric = {
  label: string;
  value: string;
  sub?: string;
};

export type THeroStat = {
  label: string;
  value: string;
};

export type TWorkClient = {
  name: string;
  industry?: string;
  domain?: string;
  employees?: string;
  tags?: string[];
  desc?: string;
  logo?: string;
};

export type TChallengeItem = { title: string; desc: string };
export type TSolutionPhase = { phase: string; time?: string; desc: string };

export type TWorkTestimonial = {
  quote: string;
  avatar_url?: string;
  name: string;
  role: string;
};

export type TWork = {
  _id?: Types.ObjectId | string;
  /** Mandatory owning Industry. `client.industry` remains a text snapshot. */
  industry: Types.ObjectId | string;
  slug: string;
  type: string;
  title: string;
  description: string;
  image: string;
  image_alt: string;
  metrics: TMetric[];
  tag_slugs: string[];
  hero_stats?: THeroStat[];
  client?: TWorkClient | null;
  situation_intro?: string | null;
  challenge_intro?: string | null;
  challenge_items?: TChallengeItem[];
  solution_intro?: string | null;
  solution_phases?: TSolutionPhase[];
  outcome_desc?: string | null;
  outcome_video?: TVideoRef | null;
  outcome_video_thumbnail?: string | null;
  testimonial?: TWorkTestimonial | null;
  calendly_url?: string | null;
  order: number;
  is_published: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

/** Populated API shape; null also represents a pre-migration legacy record. */
export type TWorkPopulated = Omit<TWork, 'industry'> & {
  industry: TIndustrySummary | null;
};

export interface TWorkDocument extends TWork, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TWorkDocument | null>;
}

export type TWorkModel = Model<TWorkDocument> & {
  isWorkExist(_id: string): Promise<TWorkDocument | null>;
  isWorkExistBySlug(slug: string): Promise<TWorkDocument | null>;
};
