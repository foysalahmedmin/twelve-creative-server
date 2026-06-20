import mongoose, { Query, Schema } from 'mongoose';
import { TTicket, TTicketDocument, TTicketModel } from './ticket.type';

const ticketSchema = new Schema<TTicketDocument>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: { type: String, trim: true, maxlength: 2000 },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open',
    },
    created_by: { type: String, trim: true },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

ticketSchema.index({ status: 1 });
ticketSchema.index({ created_at: -1 });

ticketSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

ticketSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TTicket, TTicket>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

export const Ticket = mongoose.model<TTicketDocument, TTicketModel>(
  'Ticket',
  ticketSchema,
);
