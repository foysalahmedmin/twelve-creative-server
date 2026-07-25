import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as ArchiveServices from './archive.service';

export const createPost = catchAsync(async (req, res) => {
  const result = await ArchiveServices.createPost({
    ...req.body,
    user: req.user._id,
  });
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Post created successfully',
    data: result,
  });
});

export const getPublicPosts = catchAsync(async (req, res) => {
  const result = await ArchiveServices.getPublicPosts(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Posts retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPosts = catchAsync(async (req, res) => {
  const result = await ArchiveServices.getPosts(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Posts retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getPost = catchAsync(async (req, res) => {
  const result = await ArchiveServices.getPost(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Post retrieved successfully',
    data: result,
  });
});

export const getPublicPost = catchAsync(async (req, res) => {
  const result = await ArchiveServices.getPublicPost(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Post retrieved successfully',
    data: result,
  });
});

export const updatePost = catchAsync(async (req, res) => {
  const result = await ArchiveServices.updatePost(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Post updated successfully',
    data: result,
  });
});

export const deletePost = catchAsync(async (req, res) => {
  await ArchiveServices.deletePost(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Post deleted successfully',
    data: null,
  });
});

export const deletePostPermanent = catchAsync(async (req, res) => {
  await ArchiveServices.deletePostPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Post permanently deleted',
    data: null,
  });
});

export const restorePost = catchAsync(async (req, res) => {
  const result = await ArchiveServices.restorePost(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Post restored successfully',
    data: result,
  });
});
