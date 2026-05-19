import { Document, Model, Types } from 'mongoose';

export type TTeamSocials = {
  linkedin?: string;
  instagram?: string;
  x?: string;
};

export type TTeamMember = {
  _id?: Types.ObjectId | string;
  name: string;
  role: string;
  bio?: string;
  image: string;
  socials?: TTeamSocials;
  order: number;
  is_active: boolean;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TTeamMemberDocument extends TTeamMember, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TTeamMemberDocument | null>;
}

export type TTeamMemberModel = Model<TTeamMemberDocument> & {
  isTeamMemberExist(_id: string): Promise<TTeamMemberDocument | null>;
};
