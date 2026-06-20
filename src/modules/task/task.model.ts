import mongoose, { Query, Schema } from 'mongoose';
import { TTask, TTaskDocument, TTaskModel } from './task.type';

const taskSchema = new Schema<TTaskDocument>(
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
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    status: {
      type: String,
      enum: ['todo', 'in_progress', 'done'],
      default: 'todo',
    },
    due_date: { type: Date },
    created_by: { type: String, trim: true },
    is_deleted: { type: Boolean, default: false, select: false },
    deleted_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  },
);

taskSchema.index({ status: 1 });
taskSchema.index({ created_at: -1 });
taskSchema.index({ due_date: 1 });

taskSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.is_deleted;
  return obj;
};

taskSchema.pre(/^find/, function (next) {
  const query = this as unknown as Query<TTask, TTask>;
  const opts = query.getOptions();
  if (!opts?.bypassDeleted && query.getQuery().is_deleted === undefined) {
    query.setQuery({ ...query.getQuery(), is_deleted: { $ne: true } });
  }
  next();
});

export const Task = mongoose.model<TTaskDocument, TTaskModel>(
  'Task',
  taskSchema,
);
