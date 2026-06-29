import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as ContactMessageServices from './contact-message.service';

export const submitContactMessage = catchAsync(async (req, res) => {
  await ContactMessageServices.createContactMessage(req.body);
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Your message has been received. We will get back to you shortly.',
    data: null,
  });
});

export const getContactMessages = catchAsync(async (req, res) => {
  const result = await ContactMessageServices.getContactMessages(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Messages retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getContactMessage = catchAsync(async (req, res) => {
  const result = await ContactMessageServices.getContactMessage(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Message retrieved successfully',
    data: result,
  });
});

export const updateContactMessage = catchAsync(async (req, res) => {
  const result = await ContactMessageServices.updateContactMessage(
    req.params.id,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Message updated successfully',
    data: result,
  });
});

export const deleteContactMessage = catchAsync(async (req, res) => {
  await ContactMessageServices.deleteContactMessage(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Message deleted successfully',
    data: null,
  });
});

export const deleteContactMessagePermanent = catchAsync(async (req, res) => {
  await ContactMessageServices.deleteContactMessagePermanent(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Message permanently deleted',
    data: null,
  });
});

export const getUnreadCount = catchAsync(async (_req, res) => {
  const count = await ContactMessageServices.getUnreadCount();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Unread count',
    data: { count },
  });
});
