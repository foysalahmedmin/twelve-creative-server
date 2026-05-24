import mongoose, { Schema } from 'mongoose';
import { TGuestDocument, TGuestModel } from './guest.type';

const guestSchema = new Schema<TGuestDocument, TGuestModel>(
  {
    token: { type: String, required: true, unique: true, index: true },
    session_id: { type: String },
    ip_address: { type: String },
    user_agent: { type: String },
    fingerprint: { type: String },
    preferences: {
      theme: { type: String, enum: ['light', 'dark', 'system'] },
      timezone: { type: String },
      language: { type: String },
    },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } },
);

export const Guest = mongoose.model<TGuestDocument, TGuestModel>(
  'Guest',
  guestSchema,
);
