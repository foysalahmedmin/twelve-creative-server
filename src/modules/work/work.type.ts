import { Document, Model, Types } from 'mongoose';

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
  slug: string;
  type: string;
  title: string;
  description: string;
  image: string;
  image_alt: string;
  metrics: TMetric[];
  tag_slugs: string[];
  hero_stats?: THeroStat[];
  client?: TWorkClient;
  situation_intro?: string;
  challenge_intro?: string;
  challenge_items?: TChallengeItem[];
  solution_intro?: string;
  solution_phases?: TSolutionPhase[];
  outcome_desc?: string;
  outcome_video?: TVideoRef;
  outcome_video_thumbnail?: string;
  testimonial?: TWorkTestimonial;
  calendly_url?: string;
  order: number;
  is_published: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TWorkDocument extends TWork, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TWorkDocument | null>;
}

export type TWorkModel = Model<TWorkDocument> & {
  isWorkExist(_id: string): Promise<TWorkDocument | null>;
  isWorkExistBySlug(slug: string): Promise<TWorkDocument | null>;
};
