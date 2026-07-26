import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as AboutPageServices from './about-page.service';

export const getPublicAboutPage = catchAsync(async (_req, res) => {
  const result = await AboutPageServices.getPublicAboutPage();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'About page retrieved successfully',
    data: result,
  });
});

export const getAboutPage = catchAsync(async (_req, res) => {
  const result = await AboutPageServices.getAboutPage();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'About page retrieved successfully',
    data: result,
  });
});

export const updateAboutPage = catchAsync(async (req, res) => {
  const result = await AboutPageServices.updateAboutPage(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'About page saved successfully',
    data: result,
  });
});
