import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as BookingSettingServices from './booking-setting.service';

export const getPublicBookingSetting = catchAsync(async (_req, res) => {
  const result = await BookingSettingServices.getPublicBookingSetting();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Booking setting retrieved successfully',
    data: result,
  });
});

export const getBookingSetting = catchAsync(async (_req, res) => {
  const result = await BookingSettingServices.getBookingSetting();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Booking setting retrieved successfully',
    data: result,
  });
});

export const updateBookingSetting = catchAsync(async (req, res) => {
  const result = await BookingSettingServices.updateBookingSetting(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Booking setting updated successfully',
    data: result,
  });
});
