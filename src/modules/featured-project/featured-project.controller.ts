import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as FeaturedProjectServices from './featured-project.service';

export const createFeaturedProject = catchAsync(async (req, res) => {
  const result = await FeaturedProjectServices.createFeaturedProject(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Featured project created successfully',
    data: result,
  });
});

export const getPublicFeaturedProjects = catchAsync(async (req, res) => {
  const industrySlug =
    typeof req.query.industry_slug === 'string'
      ? req.query.industry_slug
      : undefined;
  const result = await FeaturedProjectServices.getPublicFeaturedProjects({
    industry_slug: industrySlug,
  });
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Featured projects retrieved successfully',
    data: result.data,
  });
});

export const getFeaturedProjects = catchAsync(async (req, res) => {
  const result = await FeaturedProjectServices.getFeaturedProjects(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Featured projects retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getFeaturedProject = catchAsync(async (req, res) => {
  const result = await FeaturedProjectServices.getFeaturedProject(
    req.params.id,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Featured project retrieved successfully',
    data: result,
  });
});

export const updateFeaturedProject = catchAsync(async (req, res) => {
  const result = await FeaturedProjectServices.updateFeaturedProject(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Featured project updated successfully',
    data: result,
  });
});

export const reorderFeaturedProjects = catchAsync(async (req, res) => {
  await FeaturedProjectServices.reorderFeaturedProjects(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Featured projects reordered successfully',
    data: null,
  });
});

export const deleteFeaturedProject = catchAsync(async (req, res) => {
  await FeaturedProjectServices.deleteFeaturedProject(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Featured project deleted successfully',
    data: null,
  });
});

export const deleteFeaturedProjectPermanent = catchAsync(async (req, res) => {
  await FeaturedProjectServices.deleteFeaturedProjectPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Featured project permanently deleted',
    data: null,
  });
});

export const restoreFeaturedProject = catchAsync(async (req, res) => {
  const result = await FeaturedProjectServices.restoreFeaturedProject(
    req.params.id,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Featured project restored successfully',
    data: result,
  });
});
