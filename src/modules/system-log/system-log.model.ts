import mongoose, { Schema } from 'mongoose';
import { TSystemLogDocument, TSystemLogModel } from './system-log.type';

const systemLogSchema = new Schema<TSystemLogDocument>(
  {
    level: {
      type: String,
      enum: ['info', 'warn', 'error'],
      default: 'info',
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    actor: { type: String, trim: true },
    meta: { type: Schema.Types.Mixed },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: false },
  },
);

systemLogSchema.index({ created_at: -1 });
systemLogSchema.index({ level: 1 });

systemLogSchema.statics.log = async function (
  level: string,
  message: string,
  actor?: string,
  meta?: Record<string, unknown>,
) {
  try {
    await this.create({ level, message, actor, meta });
  } catch {
    // Never throw from a logger
  }
};

export const SystemLog = mongoose.model<TSystemLogDocument, TSystemLogModel>(
  'SystemLog',
  systemLogSchema,
);
