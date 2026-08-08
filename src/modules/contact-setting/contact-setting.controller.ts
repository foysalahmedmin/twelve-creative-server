import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as ContactSettingServices from './contact-setting.service';

export const getPublicContactSetting = catchAsync(async (_req, res) => {
  const result = await ContactSettingServices.getPublicContactSetting();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Contact setting retrieved successfully',
    data: result,
  });
});

export const getContactSetting = catchAsync(async (_req, res) => {
  const result = await ContactSettingServices.getContactSetting();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Contact setting retrieved successfully',
    data: result,
  });
});

export const updateContactSetting = catchAsync(async (req, res) => {
  const result = await ContactSettingServices.updateContactSetting(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Contact setting updated successfully',
    data: result,
  });
});
