import httpStatus from 'http-status';
import AppError from '../../builder/app-error';
import * as TicketRepository from './ticket.repository';
import { TTicket } from './ticket.type';

export const createTicket = async (
  data: Partial<TTicket>,
): Promise<TTicket> => {
  return await TicketRepository.create(data);
};

export const getTickets = async (query: Record<string, unknown>) => {
  return await TicketRepository.findAll(query);
};

export const getTicket = async (id: string): Promise<TTicket> => {
  const result = await TicketRepository.findByIdLean(id);
  if (!result) throw new AppError(httpStatus.NOT_FOUND, 'Ticket not found');
  return result;
};

export const updateTicket = async (
  id: string,
  payload: Partial<TTicket>,
): Promise<TTicket> => {
  const exists = await TicketRepository.findByIdLean(id);
  if (!exists) throw new AppError(httpStatus.NOT_FOUND, 'Ticket not found');
  const result = await TicketRepository.updateById(id, payload);
  return result!.toObject();
};

export const deleteTicket = async (id: string): Promise<void> => {
  const ticket = await TicketRepository.findById(id);
  if (!ticket) throw new AppError(httpStatus.NOT_FOUND, 'Ticket not found');
  await TicketRepository.softDeleteById(id);
};
