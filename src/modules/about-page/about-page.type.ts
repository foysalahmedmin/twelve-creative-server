import { Document, Model, Types } from 'mongoose';
import { TCmsMedia } from '../cms-content/cms-content.type';

export type TAboutSectionHeader = {
  label: string;
  title: string;
  description: string;
  is_visible: boolean;
};

export type TAboutValueCard = {
  title: string;
  description: string;
  is_visible: boolean;
};

export type TAboutStoryCard = {
  id: string;
  index: string;
  title: string;
  description: string;
  media: TCmsMedia;
  is_visible: boolean;
};

export type TAboutStoryCardInput = Omit<TAboutStoryCard, 'id' | 'index'> & {
  id?: string;
  index?: string;
};

export type TAboutFounder = {
  eyebrow?: string;
  first_name: string;
  last_name: string;
  title: string;
  biography: string[];
  media: TCmsMedia;
  is_visible: boolean;
};

export type TAboutGalleryItem = {
  id: string;
  index: string;
  alt: string;
  media: TCmsMedia;
  is_visible: boolean;
};

export type TAboutGalleryItemInput = Omit<TAboutGalleryItem, 'id' | 'index'> & {
  id?: string;
  index?: string;
};

export type TAboutPage = {
  _id?: Types.ObjectId | string;
  singleton_key?: 'about';
  mission_section: TAboutSectionHeader;
  mission: TAboutValueCard;
  vision: TAboutValueCard;
  story_section: TAboutSectionHeader;
  story_cards: TAboutStoryCard[];
  founder: TAboutFounder;
  gallery_section: TAboutSectionHeader;
  gallery: TAboutGalleryItem[];
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type TAboutPageInput = Omit<
  TAboutPage,
  | '_id'
  | 'singleton_key'
  | 'story_cards'
  | 'gallery'
  | 'created_at'
  | 'updated_at'
> & {
  story_cards: TAboutStoryCardInput[];
  gallery: TAboutGalleryItemInput[];
};

export type TPublicAboutPage = {
  mission_section: TAboutSectionHeader | null;
  mission: TAboutValueCard | null;
  vision: TAboutValueCard | null;
  story_section: TAboutSectionHeader | null;
  story_cards: TAboutStoryCard[];
  founder: TAboutFounder | null;
  gallery_section: TAboutSectionHeader | null;
  gallery: TAboutGalleryItem[];
};

export interface TAboutPageDocument extends TAboutPage, Document {
  _id: Types.ObjectId;
}

export type TAboutPageModel = Model<TAboutPageDocument>;
