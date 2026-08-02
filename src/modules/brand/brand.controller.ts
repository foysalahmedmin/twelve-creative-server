import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as BrandServices from './brand.service';

export const createBrand = catchAsync(async (req, res) => {
  const result = await BrandServices.createBrand(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Brand created successfully',
    data: result,
  });
});

export const getPublicBrands = catchAsync(async (_req, res) => {
  const result = await BrandServices.getPublicBrands();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Brands retrieved successfully',
    data: result.data,
  });
});

export const getBrands = catchAsync(async (req, res) => {
  const result = await BrandServices.getBrands(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Brands retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getBrand = catchAsync(async (req, res) => {
  const result = await BrandServices.getBrand(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Brand retrieved successfully',
    data: result,
  });
});

export const updateBrand = catchAsync(async (req, res) => {
  const result = await BrandServices.updateBrand(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Brand updated successfully',
    data: result,
  });
});

export const reorderBrands = catchAsync(async (req, res) => {
  await BrandServices.reorderBrands(req.body.items);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Brands reordered successfully',
    data: null,
  });
});

export const deleteBrand = catchAsync(async (req, res) => {
  await BrandServices.deleteBrand(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Brand deleted successfully',
    data: null,
  });
});

export const deleteBrandPermanent = catchAsync(async (req, res) => {
  await BrandServices.deleteBrandPermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Brand permanently deleted',
    data: null,
  });
});

export const restoreBrand = catchAsync(async (req, res) => {
  const result = await BrandServices.restoreBrand(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Brand restored successfully',
    data: result,
  });
});
