import { Document, Model, Types } from 'mongoose';

export type TTicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TTicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export type TTicket = {
  _id?: Types.ObjectId | string;
  title: string;
  description?: string;
  priority: TTicketPriority;
  status: TTicketStatus;
  created_by?: string;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TTicketDocument extends TTicket, Document {
  _id: Types.ObjectId;
}

export type TTicketModel = Model<TTicketDocument>;
