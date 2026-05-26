import { Document, Model, Types } from 'mongoose';

/**
 * Locked enum — these are the 4 icons baked into the frontend
 * `INDUSTRY_ICON_MAP` (hospitality → Restaurant01Icon, etc.). Adding a new
 * key requires a matching entry on the frontend.
 */
export type TIndustryIconKey =
  | 'hospitality'
  | 'real-estate'
  | 'aviation'
  | 'professional-services';

export type TIndustryVideoSource = 'youtube' | 'url' | 'upload';

export type TIndustryVideoRef = {
  source: TIndustryVideoSource;
  value: string;
};

export type TIndustry = {
  _id?: Types.ObjectId | string;
  /**
   * URL-safe identifier. Used as the in-page anchor under /industries
   * (e.g. slug `hospitality` becomes `/industries#hospitality`) and as
   * the React list key on the home tabs.
   */
  slug: string;
  name: string;
  headline: string;
  description: string;
  /** Cover image URL (2-source pattern). */
  image: string;
  /** Locked icon — picked from a fixed enum, shown on the home tab pills. */
  icon: TIndustryIconKey;
  /** "What we offer" list shown on home tab + /industries card. */
  work: string[];
  /** Optional CTA label override. Defaults to "Book a Call" on the home tab. */
  cta_label?: string;
  /** Optional CTA href override. Defaults to /industries#<slug>. */
  cta_href?: string;
  /** Short tagline shown on the detail page hero badge. */
  tagline?: string;
  /** Optional thumbnail URL shown before video plays. */
  thumbnail?: string;
  /** Optional hero video for the detail page. */
  video?: TIndustryVideoRef;
  order: number;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TIndustryDocument extends TIndustry, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TIndustryDocument | null>;
}

export type TIndustryModel = Model<TIndustryDocument> & {
  isIndustryExist(_id: string): Promise<TIndustryDocument | null>;
  isIndustryExistBySlug(slug: string): Promise<TIndustryDocument | null>;
};
