import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as TaskServices from './task.service';

export const createTask = catchAsync(async (req, res) => {
  const result = await TaskServices.createTask({
    ...req.body,
    created_by: req.user?.email,
  });
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Task created successfully',
    data: result,
  });
});

export const getTasks = catchAsync(async (req, res) => {
  const result = await TaskServices.getTasks(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Tasks retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getTask = catchAsync(async (req, res) => {
  const result = await TaskServices.getTask(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Task retrieved successfully',
    data: result,
  });
});

export const updateTask = catchAsync(async (req, res) => {
  const result = await TaskServices.updateTask(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Task updated successfully',
    data: result,
  });
});

export const deleteTask = catchAsync(async (req, res) => {
  await TaskServices.deleteTask(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Task deleted',
    data: null,
  });
});
