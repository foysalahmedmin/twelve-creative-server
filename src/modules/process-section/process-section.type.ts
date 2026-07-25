import { Document, Model, Types } from 'mongoose';

export const PROCESS_ICON_KEYS = [
  'understand',
  'position',
  'build',
  'launch',
  'install',
  'improve',
] as const;

export type TProcessIconKey = (typeof PROCESS_ICON_KEYS)[number];

export type TProcessStep = {
  id: string;
  index: string;
  icon: TProcessIconKey;
  title: string;
  description: string;
  image: string;
};

export type TProcessStepInput = Omit<TProcessStep, 'id' | 'index'> & {
  id?: string;
  index?: string;
};

export type TProcessSection = {
  _id?: Types.ObjectId | string;
  singleton_key?: 'process';
  label: string;
  title: string;
  description: string;
  thumbnail: string;
  process_steps: TProcessStep[];
  created_at?: Date;
  updated_at?: Date;
};

export type TProcessSectionInput = Omit<
  TProcessSection,
  '_id' | 'singleton_key' | 'process_steps' | 'created_at' | 'updated_at'
> & {
  process_steps: TProcessStepInput[];
};

export type TPublicProcessSection = Pick<
  TProcessSection,
  'label' | 'title' | 'description' | 'thumbnail' | 'process_steps'
>;

export interface TProcessSectionDocument extends TProcessSection, Document {
  _id: Types.ObjectId;
}

export type TProcessSectionModel = Model<TProcessSectionDocument>;
