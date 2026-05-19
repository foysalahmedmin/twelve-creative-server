import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as InsightServices from './insight.service';

export const createInsight = catchAsync(async (req, res) => {
  const result = await InsightServices.createInsight(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Insight created successfully',
    data: result,
  });
});

export const getPublicInsights = catchAsync(async (_req, res) => {
  const result = await InsightServices.getPublicInsights();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Insights retrieved successfully',
    data: result.data,
  });
});

export const getPublicInsightBySlug = catchAsync(async (req, res) => {
  const result = await InsightServices.getPublicInsightBySlug(req.params.slug);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Insight retrieved successfully',
    data: result,
  });
});

export const getInsights = catchAsync(async (req, res) => {
  const result = await InsightServices.getInsights(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Insights retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getInsight = catchAsync(async (req, res) => {
  const result = await InsightServices.getInsight(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Insight retrieved successfully',
    data: result,
  });
});

export const updateInsight = catchAsync(async (req, res) => {
  const result = await InsightServices.updateInsight(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Insight updated successfully',
    data: result,
  });
});

export const deleteInsight = catchAsync(async (req, res) => {
  await InsightServices.deleteInsight(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Insight deleted successfully',
    data: null,
  });
});

export const deleteInsightPermanent = catchAsync(async (req, res) => {
  await InsightServices.deleteInsightPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Insight permanently deleted',
    data: null,
  });
});
