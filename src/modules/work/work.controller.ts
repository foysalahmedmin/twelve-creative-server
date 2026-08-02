import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as WorkServices from './work.service';

export const createWork = catchAsync(async (req, res) => {
  const result = await WorkServices.createWork(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Work created successfully',
    data: result,
  });
});

export const getPublicWorks = catchAsync(async (req, res) => {
  const industrySlug =
    typeof req.query.industry_slug === 'string'
      ? req.query.industry_slug.trim().toLowerCase()
      : undefined;
  const result = await WorkServices.getPublicWorks({
    industry_slug: industrySlug,
  });
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Works retrieved successfully',
    data: result.data,
  });
});

export const getPublicWorkBySlug = catchAsync(async (req, res) => {
  const result = await WorkServices.getPublicWorkBySlug(
    req.params.slug.trim().toLowerCase(),
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Work retrieved successfully',
    data: result,
  });
});

export const getWorks = catchAsync(async (req, res) => {
  const result = await WorkServices.getWorks(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Works retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getWork = catchAsync(async (req, res) => {
  const result = await WorkServices.getWork(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Work retrieved successfully',
    data: result,
  });
});

export const updateWork = catchAsync(async (req, res) => {
  const result = await WorkServices.updateWork(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Work updated successfully',
    data: result,
  });
});

export const reorderWorks = catchAsync(async (req, res) => {
  await WorkServices.reorderWorks(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Works reordered successfully',
    data: null,
  });
});

export const deleteWork = catchAsync(async (req, res) => {
  await WorkServices.deleteWork(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Work deleted successfully',
    data: null,
  });
});

export const deleteWorkPermanent = catchAsync(async (req, res) => {
  await WorkServices.deleteWorkPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Work permanently deleted',
    data: null,
  });
});

export const restoreWork = catchAsync(async (req, res) => {
  const result = await WorkServices.restoreWork(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Work restored successfully',
    data: result,
  });
});
