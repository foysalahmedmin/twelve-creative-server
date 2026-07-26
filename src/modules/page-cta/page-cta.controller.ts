import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as PageCtaServices from './page-cta.service';
import { TPageCtaPlacement } from './page-cta.type';

export const getPublicPageCta = catchAsync(async (req, res) => {
  const industrySlug =
    typeof req.query.industry_slug === 'string'
      ? req.query.industry_slug.trim().toLowerCase()
      : undefined;
  const result = await PageCtaServices.getPublicPageCta(
    req.params.placement as TPageCtaPlacement,
    industrySlug,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page CTA retrieved successfully',
    data: result,
  });
});

export const getPageCtas = catchAsync(async (req, res) => {
  const result = await PageCtaServices.getPageCtas({
    placement:
      typeof req.query.placement === 'string'
        ? (req.query.placement as TPageCtaPlacement)
        : undefined,
    industry:
      typeof req.query.industry === 'string' ? req.query.industry : undefined,
  });
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page CTAs retrieved successfully',
    data: result,
  });
});

export const getPageCta = catchAsync(async (req, res) => {
  const result = await PageCtaServices.getPageCta(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page CTA retrieved successfully',
    data: result,
  });
});

export const createPageCta = catchAsync(async (req, res) => {
  const result = await PageCtaServices.createPageCta(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Page CTA created successfully',
    data: result,
  });
});

export const upsertPageCta = catchAsync(async (req, res) => {
  const result = await PageCtaServices.upsertPageCta(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page CTA saved successfully',
    data: result,
  });
});

export const updatePageCta = catchAsync(async (req, res) => {
  const result = await PageCtaServices.updatePageCta(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page CTA updated successfully',
    data: result,
  });
});

export const deletePageCta = catchAsync(async (req, res) => {
  await PageCtaServices.deletePageCta(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page CTA deleted successfully',
    data: null,
  });
});
