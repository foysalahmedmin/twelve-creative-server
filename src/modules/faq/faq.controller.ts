import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as FaqServices from './faq.service';

export const createFaq = catchAsync(async (req, res) => {
  const result = await FaqServices.createFaq(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'FAQ created successfully',
    data: result,
  });
});

export const getPublicFaqs = catchAsync(async (_req, res) => {
  const result = await FaqServices.getPublicFaqs();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'FAQs retrieved successfully',
    data: result.data,
  });
});

export const getFaqs = catchAsync(async (req, res) => {
  const result = await FaqServices.getFaqs(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'FAQs retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getFaq = catchAsync(async (req, res) => {
  const result = await FaqServices.getFaq(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'FAQ retrieved successfully',
    data: result,
  });
});

export const updateFaq = catchAsync(async (req, res) => {
  const result = await FaqServices.updateFaq(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'FAQ updated successfully',
    data: result,
  });
});

export const reorderFaqs = catchAsync(async (req, res) => {
  await FaqServices.reorderFaqs(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'FAQs reordered successfully',
    data: null,
  });
});

export const deleteFaq = catchAsync(async (req, res) => {
  await FaqServices.deleteFaq(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'FAQ deleted successfully',
    data: null,
  });
});

export const deleteFaqPermanent = catchAsync(async (req, res) => {
  await FaqServices.deleteFaqPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'FAQ permanently deleted',
    data: null,
  });
});
