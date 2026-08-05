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

/**
 * Now that every 5xx is recorded (see error.middleware.ts) this collection
 * would otherwise grow without bound on a long-running install. 90 days is
 * far longer than anyone needs to diagnose a live incident, and Mongo prunes
 * expired entries itself so there is no cleanup job to forget about.
 */
const LOG_RETENTION_DAYS = 90;
systemLogSchema.index(
  { created_at: 1 },
  {
    expireAfterSeconds: LOG_RETENTION_DAYS * 24 * 60 * 60,
    name: 'system_log_ttl',
  },
);

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
