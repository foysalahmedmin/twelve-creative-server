import { Document, Model, Types } from 'mongoose';

export const LEGAL_PAGE_SLUGS = [
  'privacy-policy',
  'terms-and-conditions',
] as const;

export type TLegalPageSlug = (typeof LEGAL_PAGE_SLUGS)[number];

export type TLegalPageSeo = {
  title: string;
  description: string;
};

export type TLegalPage = {
  _id?: Types.ObjectId | string;
  slug: TLegalPageSlug;
  title: string;
  markdown: string;
  /** Drafts may omit this; publishing requires an effective date. */
  effective_date: Date | null;
  seo: TLegalPageSeo;
  is_published: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type TLegalPageInput = Omit<
  TLegalPage,
  '_id' | 'created_at' | 'updated_at'
>;

export type TPublicLegalPage = Pick<
  TLegalPage,
  'slug' | 'title' | 'markdown' | 'effective_date' | 'seo'
>;

export interface TLegalPageDocument extends TLegalPage, Document {
  _id: Types.ObjectId;
}

export type TLegalPageModel = Model<TLegalPageDocument>;
