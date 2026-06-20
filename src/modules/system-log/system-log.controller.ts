import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import { SystemLog } from './system-log.model';

export const getLogs = catchAsync(async (req, res) => {
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 100;
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (req.query.level) filter.level = req.query.level;

  const [data, total] = await Promise.all([
    SystemLog.find(filter).sort({ created_at: -1 }).skip(skip).limit(limit).lean(),
    SystemLog.countDocuments(filter),
  ]);

  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Logs retrieved',
    meta: { total, page, limit, total_pages: Math.ceil(total / limit) },
    data,
  });
});
