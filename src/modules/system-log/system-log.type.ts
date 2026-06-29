import { Document, Model, Types } from 'mongoose';

export type TSystemLogLevel = 'info' | 'warn' | 'error';

export type TSystemLog = {
  _id?: Types.ObjectId | string;
  level: TSystemLogLevel;
  message: string;
  actor?: string;
  meta?: Record<string, unknown>;
};

export interface TSystemLogDocument extends TSystemLog, Document {
  _id: Types.ObjectId;
}

export type TSystemLogModel = Model<TSystemLogDocument> & {
  log(
    level: TSystemLogLevel,
    message: string,
    actor?: string,
    meta?: Record<string, unknown>,
  ): Promise<void>;
};
