import { Document, Model, Types } from 'mongoose';

export type TTaskPriority = 'low' | 'medium' | 'high';
export type TTaskStatus = 'todo' | 'in_progress' | 'done';

export type TTask = {
  _id?: Types.ObjectId | string;
  title: string;
  description?: string;
  priority: TTaskPriority;
  status: TTaskStatus;
  due_date?: Date;
  created_by?: string;
  is_deleted?: boolean;
  deleted_at?: Date;
};

export interface TTaskDocument extends TTask, Document {
  _id: Types.ObjectId;
}

export type TTaskModel = Model<TTaskDocument>;
