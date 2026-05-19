import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as SiteSettingServices from './site-setting.service';

export const getSiteSetting = catchAsync(async (_req, res) => {
  const result = await SiteSettingServices.getSiteSetting();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Site settings retrieved successfully',
    data: result,
  });
});

export const updateSiteSetting = catchAsync(async (req, res) => {
  const result = await SiteSettingServices.updateSiteSetting(req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Site settings updated successfully',
    data: result,
  });
});
