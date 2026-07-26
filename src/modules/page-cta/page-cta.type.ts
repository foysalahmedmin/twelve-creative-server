import { Document, Model, Types } from 'mongoose';
import { TIndustrySummary } from '../industry/industry.type';

export const PAGE_CTA_PLACEMENTS = [
  'home',
  'about',
  'works',
  'industries',
  'process',
  'what-we-build',
  'industry-detail',
] as const;

export type TPageCtaPlacement = (typeof PAGE_CTA_PLACEMENTS)[number];

export type TCtaLink = {
  label: string;
  href: string;
};

export type TPageCta = {
  _id?: Types.ObjectId | string;
  placement: TPageCtaPlacement;
  /** Null is the global default. An Industry reference is an override. */
  industry: Types.ObjectId | string | null;
  eyebrow?: string;
  title: string;
  description: string;
  image: string;
  primary_cta: TCtaLink;
  secondary_cta?: TCtaLink | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type TPageCtaPopulated = Omit<TPageCta, 'industry'> & {
  industry: TIndustrySummary | null;
};

export type TPublicPageCta = Pick<
  TPageCta,
  | 'placement'
  | 'eyebrow'
  | 'title'
  | 'description'
  | 'image'
  | 'primary_cta'
  | 'secondary_cta'
>;

export interface TPageCtaDocument extends TPageCta, Document {
  _id: Types.ObjectId;
}

export type TPageCtaModel = Model<TPageCtaDocument>;
