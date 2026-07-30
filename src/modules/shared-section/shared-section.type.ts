import { HydratedDocument, Model } from 'mongoose';
import { TCmsMedia } from '../cms-content/cms-content.type';

export const SHARED_CONTENT_SECTION_KEYS = [
  'difference',
  'why-choose-us',
  'growth-system',
  'scroll-statement',
  'work-with-us',
] as const;

export const SHARED_HEADING_SECTION_KEYS = [
  'home-services',
  'home-featured-projects',
  'home-industries',
  'testimonials',
  'faq',
  'core-verticals',
  'work-showcase',
  'visual-library',
] as const;

export const SHARED_SECTION_KEYS = [
  ...SHARED_CONTENT_SECTION_KEYS,
  ...SHARED_HEADING_SECTION_KEYS,
] as const;

export type TSharedContentSectionKey =
  (typeof SHARED_CONTENT_SECTION_KEYS)[number];
export type TSharedHeadingSectionKey =
  (typeof SHARED_HEADING_SECTION_KEYS)[number];
export type TSharedSectionKey = (typeof SHARED_SECTION_KEYS)[number];

export const WHY_CHOOSE_US_ICON_KEYS = [
  'strategy',
  'cinematic',
  'connected',
  'systems',
  'outcomes',
  'embedded',
] as const;

export type TWhyChooseUsIconKey = (typeof WHY_CHOOSE_US_ICON_KEYS)[number];

export type TOrderedTextItem = {
  id: string;
  index: string;
  text: string;
};

export type TOrderedTextItemInput = Omit<TOrderedTextItem, 'id' | 'index'> & {
  id?: string;
  index?: string;
};

export type TDifferenceColumn = {
  title: string;
  items: TOrderedTextItem[];
};

export type TDifferenceContent = {
  fragmented: TDifferenceColumn;
  connected: TDifferenceColumn;
};

export type TWhyChooseUsFeature = {
  id: string;
  index: string;
  icon: TWhyChooseUsIconKey;
  title: string;
  description: string;
  media?: TCmsMedia;
};

export type TWhyChooseUsFeatureInput = Omit<
  TWhyChooseUsFeature,
  'id' | 'index'
> & {
  id?: string;
  index?: string;
};

export type TWhyChooseUsContent = {
  features: TWhyChooseUsFeature[];
};

export type TGrowthSystemStep = {
  id: string;
  index: string;
  title: string;
  description: string;
  media: TCmsMedia;
  items: TOrderedTextItem[];
};

export type TGrowthSystemStepInput = Omit<
  TGrowthSystemStep,
  'id' | 'index' | 'items'
> & {
  id?: string;
  index?: string;
  items: TOrderedTextItemInput[];
};

export type TGrowthSystemContent = {
  steps: TGrowthSystemStep[];
};

export type TStatementSegment = {
  id: string;
  index: string;
  text: string;
  highlight: boolean;
};

export type TStatementSegmentInput = Omit<
  TStatementSegment,
  'id' | 'index' | 'highlight'
> & {
  id?: string;
  index?: string;
  highlight?: boolean;
};

export type TStatementParagraph = {
  id: string;
  index: string;
  segments: TStatementSegment[];
};

export type TStatementParagraphInput = Omit<
  TStatementParagraph,
  'id' | 'index' | 'segments'
> & {
  id?: string;
  index?: string;
  segments: TStatementSegmentInput[];
};

export type TScrollStatementContent = {
  paragraphs: TStatementParagraph[];
};

export type TWorkWithUsCard = {
  id: string;
  index: string;
  title: string;
  description: string;
  media?: TCmsMedia;
};

export type TWorkWithUsCardInput = Omit<TWorkWithUsCard, 'id' | 'index'> & {
  id?: string;
  index?: string;
};

export type TWorkWithUsContent = {
  cards: TWorkWithUsCard[];
};

export type THeadingContent = Record<string, never>;

export type TSharedSectionContent =
  | TDifferenceContent
  | TWhyChooseUsContent
  | TGrowthSystemContent
  | TScrollStatementContent
  | TWorkWithUsContent
  | THeadingContent;

type TSharedSectionBase = {
  label?: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
};

export type TSharedSection = TSharedSectionBase &
  (
    | { key: 'difference'; content: TDifferenceContent }
    | { key: 'why-choose-us'; content: TWhyChooseUsContent }
    | { key: 'growth-system'; content: TGrowthSystemContent }
    | { key: 'scroll-statement'; content: TScrollStatementContent }
    | { key: 'work-with-us'; content: TWorkWithUsContent }
    | { key: TSharedHeadingSectionKey; content: THeadingContent }
  );

export type TSharedSectionInput =
  | (Omit<TSharedSectionBase, 'is_active' | 'created_at' | 'updated_at'> & {
      key: 'difference';
      is_active?: boolean;
      content: {
        fragmented: Omit<TDifferenceColumn, 'items'> & {
          items: TOrderedTextItemInput[];
        };
        connected: Omit<TDifferenceColumn, 'items'> & {
          items: TOrderedTextItemInput[];
        };
      };
    })
  | (Omit<TSharedSectionBase, 'is_active' | 'created_at' | 'updated_at'> & {
      key: 'why-choose-us';
      is_active?: boolean;
      content: { features: TWhyChooseUsFeatureInput[] };
    })
  | (Omit<TSharedSectionBase, 'is_active' | 'created_at' | 'updated_at'> & {
      key: 'growth-system';
      is_active?: boolean;
      content: { steps: TGrowthSystemStepInput[] };
    })
  | (Omit<TSharedSectionBase, 'is_active' | 'created_at' | 'updated_at'> & {
      key: 'scroll-statement';
      is_active?: boolean;
      content: { paragraphs: TStatementParagraphInput[] };
    })
  | (Omit<TSharedSectionBase, 'is_active' | 'created_at' | 'updated_at'> & {
      key: 'work-with-us';
      is_active?: boolean;
      content: { cards: TWorkWithUsCardInput[] };
    })
  | (Omit<TSharedSectionBase, 'is_active' | 'created_at' | 'updated_at'> & {
      key: TSharedHeadingSectionKey;
      is_active?: boolean;
      content: THeadingContent;
    });

export type TPublicSharedSection = Omit<
  TSharedSection,
  'created_at' | 'updated_at' | 'is_active'
>;

export type TSharedSectionDocument = HydratedDocument<TSharedSection>;
export type TSharedSectionModel = Model<TSharedSection>;
