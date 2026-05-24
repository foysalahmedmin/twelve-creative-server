import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as ServiceServices from './service.service';

export const createService = catchAsync(async (req, res) => {
  const result = await ServiceServices.createService(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Service created successfully',
    data: result,
  });
});

export const getPublicServices = catchAsync(async (_req, res) => {
  const result = await ServiceServices.getPublicServices();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Services retrieved successfully',
    data: result.data,
  });
});

export const getServices = catchAsync(async (req, res) => {
  const result = await ServiceServices.getServices(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Services retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getService = catchAsync(async (req, res) => {
  const result = await ServiceServices.getService(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Service retrieved successfully',
    data: result,
  });
});

export const updateService = catchAsync(async (req, res) => {
  const result = await ServiceServices.updateService(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Service updated successfully',
    data: result,
  });
});

export const reorderServices = catchAsync(async (req, res) => {
  await ServiceServices.reorderServices(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Services reordered successfully',
    data: null,
  });
});

export const deleteService = catchAsync(async (req, res) => {
  await ServiceServices.deleteService(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Service deleted successfully',
    data: null,
  });
});

export const deleteServicePermanent = catchAsync(async (req, res) => {
  await ServiceServices.deleteServicePermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Service permanently deleted',
    data: null,
  });
});

export const restoreService = catchAsync(async (req, res) => {
  const result = await ServiceServices.restoreService(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Service restored successfully',
    data: result,
  });
});
