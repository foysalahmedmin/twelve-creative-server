import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as CategoryServices from './category.service';

export const createCategory = catchAsync(async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const iconFile = files?.['icon']?.[0];
  // Root-relative public path, not the raw disk path — file.path is an
  // absolute filesystem path (config.upload_dir-rooted) and must never be
  // stored directly; it matches the /uploads/ folder the file() middleware
  // wrote it to (folder: 'categories/icons').
  const icon = iconFile
    ? `/uploads/categories/icons/${iconFile.filename}`
    : undefined;

  const result = await CategoryServices.createCategory({
    ...req.body,
    ...(icon && { icon }),
  });

  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Category created successfully',
    data: result,
  });
});

export const getPublicCategories = catchAsync(async (req, res) => {
  const result = await CategoryServices.getPublicCategories(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getCategories = catchAsync(async (req, res) => {
  const result = await CategoryServices.getCategories(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Categories retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getCategory = catchAsync(async (req, res) => {
  const result = await CategoryServices.getCategory(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category retrieved successfully',
    data: result,
  });
});

export const updateCategory = catchAsync(async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]>;
  const iconFile = files?.['icon']?.[0];
  // Root-relative public path, not the raw disk path — file.path is an
  // absolute filesystem path (config.upload_dir-rooted) and must never be
  // stored directly; it matches the /uploads/ folder the file() middleware
  // wrote it to (folder: 'categories/icons').
  const icon = iconFile
    ? `/uploads/categories/icons/${iconFile.filename}`
    : undefined;

  const result = await CategoryServices.updateCategory(req.params.id, {
    ...req.body,
    ...(icon && { icon }),
  });

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category updated successfully',
    data: result,
  });
});

export const deleteCategory = catchAsync(async (req, res) => {
  await CategoryServices.deleteCategory(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category deleted successfully',
    data: null,
  });
});

export const deleteCategoryPermanent = catchAsync(async (req, res) => {
  await CategoryServices.deleteCategoryPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category permanently deleted',
    data: null,
  });
});

export const restoreCategory = catchAsync(async (req, res) => {
  const result = await CategoryServices.restoreCategory(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Category restored successfully',
    data: result,
  });
});
