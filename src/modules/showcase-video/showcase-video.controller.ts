import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as ShowcaseVideoServices from './showcase-video.service';

export const createShowcaseVideo = catchAsync(async (req, res) => {
  const result = await ShowcaseVideoServices.createShowcaseVideo(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Showcase video created successfully',
    data: result,
  });
});

export const getPublicShowcaseVideos = catchAsync(async (req, res) => {
  const raw = typeof req.query.aspect === 'string' ? req.query.aspect : undefined;
  const aspect = raw === 'reel' || raw === 'landscape' ? raw : undefined;
  const result = await ShowcaseVideoServices.getPublicShowcaseVideos(aspect);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Showcase videos retrieved successfully',
    data: result.data,
  });
});

export const getShowcaseVideos = catchAsync(async (req, res) => {
  const result = await ShowcaseVideoServices.getShowcaseVideos(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Showcase videos retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getShowcaseVideo = catchAsync(async (req, res) => {
  const result = await ShowcaseVideoServices.getShowcaseVideo(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Showcase video retrieved successfully',
    data: result,
  });
});

export const updateShowcaseVideo = catchAsync(async (req, res) => {
  const result = await ShowcaseVideoServices.updateShowcaseVideo(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Showcase video updated successfully',
    data: result,
  });
});

export const reorderShowcaseVideos = catchAsync(async (req, res) => {
  await ShowcaseVideoServices.reorderShowcaseVideos(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Showcase videos reordered successfully',
    data: null,
  });
});

export const deleteShowcaseVideo = catchAsync(async (req, res) => {
  await ShowcaseVideoServices.deleteShowcaseVideo(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Showcase video deleted successfully',
    data: null,
  });
});

export const deleteShowcaseVideoPermanent = catchAsync(async (req, res) => {
  await ShowcaseVideoServices.deleteShowcaseVideoPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Showcase video permanently deleted',
    data: null,
  });
});

export const restoreShowcaseVideo = catchAsync(async (req, res) => {
  const result = await ShowcaseVideoServices.restoreShowcaseVideo(
    req.params.id,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Showcase video restored successfully',
    data: result,
  });
});
