import { Document, Model, Types } from 'mongoose';

export const PAGE_KEYS = [
  'home',
  'about',
  'works',
  'industries',
  'what-we-build',
  'contact',
  'faq',
  'insights',
  'process',
] as const;

export type TPageKey = (typeof PAGE_KEYS)[number];

export type TVideoSource = 'youtube' | 'url' | 'upload';

export type TVideoRef = {
  source: TVideoSource;
  value: string;
  poster?: string;
};

export type TCtaItem = {
  label: string;
  href: string;
};

export type TPageSeo = {
  title?: string;
  description?: string;
  og_image?: string;
  canonical_url?: string;
  no_index?: boolean;
};

export type TPageHero = {
  _id?: Types.ObjectId | string;
  page: TPageKey;
  label?: string;
  title?: string;
  description?: string;
  thumbnail?: string;
  video?: TVideoRef;
  trust_label?: string;
  primary_cta?: TCtaItem;
  secondary_cta?: TCtaItem;
  seo?: TPageSeo;
  is_active: boolean;
};

export interface TPageHeroDocument extends TPageHero, Document {
  _id: Types.ObjectId;
}

export type TPageHeroModel = Model<TPageHeroDocument>;
