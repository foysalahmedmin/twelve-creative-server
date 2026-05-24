import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as IndustryServices from './industry.service';

export const createIndustry = catchAsync(async (req, res) => {
  const result = await IndustryServices.createIndustry(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Industry created successfully',
    data: result,
  });
});

export const getPublicIndustries = catchAsync(async (_req, res) => {
  const result = await IndustryServices.getPublicIndustries();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Industries retrieved successfully',
    data: result.data,
  });
});

export const getIndustries = catchAsync(async (req, res) => {
  const result = await IndustryServices.getIndustries(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Industries retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getIndustry = catchAsync(async (req, res) => {
  const result = await IndustryServices.getIndustry(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Industry retrieved successfully',
    data: result,
  });
});

export const updateIndustry = catchAsync(async (req, res) => {
  const result = await IndustryServices.updateIndustry(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Industry updated successfully',
    data: result,
  });
});

export const reorderIndustries = catchAsync(async (req, res) => {
  await IndustryServices.reorderIndustries(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Industries reordered successfully',
    data: null,
  });
});

export const deleteIndustry = catchAsync(async (req, res) => {
  await IndustryServices.deleteIndustry(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Industry deleted successfully',
    data: null,
  });
});

export const deleteIndustryPermanent = catchAsync(async (req, res) => {
  await IndustryServices.deleteIndustryPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Industry permanently deleted',
    data: null,
  });
});

export const restoreIndustry = catchAsync(async (req, res) => {
  const result = await IndustryServices.restoreIndustry(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Industry restored successfully',
    data: result,
  });
});
