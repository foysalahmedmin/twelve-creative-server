import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as LegalPageServices from './legal-page.service';
import { TLegalPageSlug } from './legal-page.type';

export const getPublicLegalPage = catchAsync(async (req, res) => {
  const result = await LegalPageServices.getPublicLegalPage(
    req.params.slug as TLegalPageSlug,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Legal page retrieved successfully',
    data: result,
  });
});

export const getLegalPages = catchAsync(async (_req, res) => {
  const result = await LegalPageServices.getLegalPages();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Legal pages retrieved successfully',
    data: result,
  });
});

export const getLegalPage = catchAsync(async (req, res) => {
  const result = await LegalPageServices.getLegalPage(
    req.params.slug as TLegalPageSlug,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Legal page retrieved successfully',
    data: result,
  });
});

export const upsertLegalPage = catchAsync(async (req, res) => {
  const result = await LegalPageServices.upsertLegalPage(
    req.params.slug as TLegalPageSlug,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Legal page saved successfully',
    data: result,
  });
});
