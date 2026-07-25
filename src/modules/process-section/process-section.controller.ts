import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as ProcessSectionServices from './process-section.service';

export const getProcessSection = catchAsync(async (_req, res) => {
  const result = await ProcessSectionServices.getProcessSection();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Process section retrieved successfully',
    data: result ?? null,
  });
});

export const getPublicProcessSection = catchAsync(async (_req, res) => {
  const result = await ProcessSectionServices.getPublicProcessSection();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Process section retrieved successfully',
    data: result ?? null,
  });
});

export const updateProcessSection = catchAsync(async (req, res) => {
  const result = await ProcessSectionServices.updateProcessSection(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Process section updated successfully',
    data: result,
  });
});
