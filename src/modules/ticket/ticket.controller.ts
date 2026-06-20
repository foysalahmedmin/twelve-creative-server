import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as TicketServices from './ticket.service';

export const createTicket = catchAsync(async (req, res) => {
  const result = await TicketServices.createTicket({
    ...req.body,
    created_by: (req as any).user?.email,
  });
  sendResponse(res, {
    status: httpStatus.CREATED,
    success: true,
    message: 'Ticket created successfully',
    data: result,
  });
});

export const getTickets = catchAsync(async (req, res) => {
  const result = await TicketServices.getTickets(req.query);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Tickets retrieved successfully',
    meta: result.meta,
    data: result.data,
  });
});

export const getTicket = catchAsync(async (req, res) => {
  const result = await TicketServices.getTicket(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Ticket retrieved successfully',
    data: result,
  });
});

export const updateTicket = catchAsync(async (req, res) => {
  const result = await TicketServices.updateTicket(req.params.id, req.body);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Ticket updated successfully',
    data: result,
  });
});

export const deleteTicket = catchAsync(async (req, res) => {
  await TicketServices.deleteTicket(req.params.id);
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Ticket deleted',
    data: null,
  });
});
