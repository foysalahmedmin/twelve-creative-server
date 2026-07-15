import httpStatus from 'http-status';

jest.mock('../ticket.repository');

import * as TicketRepository from '../ticket.repository';
import * as TicketService from '../ticket.service';

const ticket = {
  _id: '507f1f77bcf86cd799439011',
  title: 'Update homepage reel',
  priority: 'urgent' as const,
  status: 'open' as const,
};

describe('TicketService', () => {
  it('creates a ticket through the repository', async () => {
    (TicketRepository.create as jest.Mock).mockResolvedValue(ticket);

    await expect(TicketService.createTicket(ticket)).resolves.toEqual(ticket);
    expect(TicketRepository.create).toHaveBeenCalledWith(ticket);
  });

  it('returns the repository paginated ticket result', async () => {
    const page = {
      data: [ticket],
      meta: { total: 1, page: 1, limit: 20, total_pages: 1 },
    };
    (TicketRepository.findAll as jest.Mock).mockResolvedValue(page);

    await expect(
      TicketService.getTickets({ priority: 'urgent' }),
    ).resolves.toEqual(page);
    expect(TicketRepository.findAll).toHaveBeenCalledWith({
      priority: 'urgent',
    });
  });

  it('returns a ticket by id', async () => {
    (TicketRepository.findByIdLean as jest.Mock).mockResolvedValue(ticket);

    await expect(TicketService.getTicket(ticket._id)).resolves.toEqual(ticket);
    expect(TicketRepository.findByIdLean).toHaveBeenCalledWith(ticket._id);
  });

  it('throws 404 when a ticket is not found', async () => {
    (TicketRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(TicketService.getTicket(ticket._id)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Ticket not found',
    });
  });

  it('updates an existing ticket and returns a plain object', async () => {
    const updated = { ...ticket, status: 'resolved' as const };
    const toObject = jest.fn().mockReturnValue(updated);
    (TicketRepository.findByIdLean as jest.Mock).mockResolvedValue(ticket);
    (TicketRepository.updateById as jest.Mock).mockResolvedValue({ toObject });

    await expect(
      TicketService.updateTicket(ticket._id, { status: 'resolved' }),
    ).resolves.toEqual(updated);
    expect(TicketRepository.updateById).toHaveBeenCalledWith(ticket._id, {
      status: 'resolved',
    });
    expect(toObject).toHaveBeenCalledWith();
  });

  it('does not update a missing ticket', async () => {
    (TicketRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      TicketService.updateTicket(ticket._id, { status: 'closed' }),
    ).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Ticket not found',
    });
    expect(TicketRepository.updateById).not.toHaveBeenCalled();
  });

  it('soft-deletes an existing ticket', async () => {
    (TicketRepository.findById as jest.Mock).mockResolvedValue(ticket);
    (TicketRepository.softDeleteById as jest.Mock).mockResolvedValue(undefined);

    await expect(
      TicketService.deleteTicket(ticket._id),
    ).resolves.toBeUndefined();
    expect(TicketRepository.softDeleteById).toHaveBeenCalledWith(ticket._id);
  });

  it('does not delete a missing ticket', async () => {
    (TicketRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(TicketService.deleteTicket(ticket._id)).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'Ticket not found',
    });
    expect(TicketRepository.softDeleteById).not.toHaveBeenCalled();
  });
});
