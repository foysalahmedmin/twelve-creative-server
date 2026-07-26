import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as SharedSectionServices from './shared-section.service';
import { TSharedSectionKey } from './shared-section.type';

export const getPublicSharedSection = catchAsync(async (req, res) => {
  const result = await SharedSectionServices.getPublicSharedSection(
    req.params.key as TSharedSectionKey,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Shared section retrieved successfully',
    data: result,
  });
});

export const getSharedSections = catchAsync(async (_req, res) => {
  const result = await SharedSectionServices.getSharedSections();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Shared sections retrieved successfully',
    data: result,
  });
});

export const getSharedSection = catchAsync(async (req, res) => {
  const result = await SharedSectionServices.getSharedSection(
    req.params.key as TSharedSectionKey,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Shared section retrieved successfully',
    data: result,
  });
});

export const updateSharedSection = catchAsync(async (req, res) => {
  const result = await SharedSectionServices.updateSharedSection(
    req.params.key as TSharedSectionKey,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Shared section saved successfully',
    data: result,
  });
});
