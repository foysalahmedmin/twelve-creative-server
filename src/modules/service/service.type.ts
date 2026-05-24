import { Document, Model, Types } from 'mongoose';

/**
 * Locked enum — these are the 6 illustration icons baked into the
 * frontend `ServiceCard` (`positioning`, `creative`, …). Adding new keys
 * requires a matching entry in the frontend `SERVICE_ICON_MAP`.
 */
export type TServiceIconKey =
  | 'positioning'
  | 'creative'
  | 'distribution'
  | 'websites'
  | 'automation'
  | 'growth';

export type TService = {
  _id?: Types.ObjectId | string;
  /**
   * URL-safe identifier. Used as the in-page anchor under /what-we-build
   * (e.g. slug `positioning` becomes `/what-we-build#positioning`) and as
   * the React list key.
   */
  slug: string;
  title: string;
  description: string;
  highlights: string[];
  /** Cover image URL (2-source pattern). */
  image: string;
  /** Locked icon — picked from a fixed enum, shown on the home card. */
  icon: TServiceIconKey;
  /** Optional CTA override. Defaults to `/what-we-build#<slug>`. */
  href?: string;
  order: number;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TServiceDocument extends TService, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TServiceDocument | null>;
}

export type TServiceModel = Model<TServiceDocument> & {
  isServiceExist(_id: string): Promise<TServiceDocument | null>;
  isServiceExistBySlug(slug: string): Promise<TServiceDocument | null>;
};
