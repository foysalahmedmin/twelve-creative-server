import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as TaskRepository from './task.repository';
import { TTask } from './task.type';

export const createTask = async (data: Partial<TTask>): Promise<TTask> => {
  return await TaskRepository.create(data);
};

export const getTasks = async (query: Record<string, unknown>) => {
  return await TaskRepository.findAll(query);
};

export const getTask = async (id: string): Promise<TTask> => {
  const result = await TaskRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
  return result;
};

export const updateTask = async (
  id: string,
  payload: Partial<TTask>,
): Promise<TTask> => {
  const exists = await TaskRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
  const result = await TaskRepository.updateById(id, payload);
  return result!.toObject();
};

export const deleteTask = async (id: string): Promise<void> => {
  const task = await TaskRepository.findById(id);
  if (!task) throw new AppError(httpStatus.NOT_FOUND, 'Task not found');
  await TaskRepository.softDeleteById(id);
};
