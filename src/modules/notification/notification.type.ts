import { Document, Model, Types } from 'mongoose';

export type TStatus = 'active' | 'inactive' | 'archived';
export type TPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TChannel = 'web' | 'push' | 'email';
export type TType = 'contact' | 'booking';

export type TNotification = {
  _id?: Types.ObjectId;
  title: string;
  message: string;
  type: TType;
  priority?: TPriority;
  channels: TChannel[];
  sender?: Types.ObjectId | string | null;
  expires_at?: Date;
  status?: TStatus;
  is_deleted?: boolean;
  deleted_at?: Date | null;
};

export interface TNotificationDocument extends TNotification, Document {
  _id: Types.ObjectId;
  softDelete(): Promise<TNotificationDocument | null>;
}

export type TNotificationModel = Model<TNotificationDocument> & {
  isCategoryExist(_id: string): Promise<TNotificationDocument | null>;
};
