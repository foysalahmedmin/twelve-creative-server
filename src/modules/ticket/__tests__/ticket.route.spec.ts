import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../ticket.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    () =>
      (
        req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) => {
        req.user = {
          _id: '507f1f77bcf86cd799439099',
          role: 'admin',
          name: 'Admin',
          email: 'admin@twelvecreative.co',
        };
        next();
      },
  ),
);
jest.mock('../../../middlewares/validation.middleware', () =>
  jest.fn(
    () =>
      (
        _req: express.Request,
        _res: express.Response,
        next: express.NextFunction,
      ) =>
        next(),
  ),
);

import ticketRoutes from '../ticket.route';
import * as TicketService from '../ticket.service';

const app = express();
app.use(express.json());
app.use('/api/ticket', ticketRoutes);
app.use(
  (
    error: { status?: number; message?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res
      .status(error.status ?? 500)
      .json({ success: false, message: error.message });
  },
);
const request = supertest(app);

const id = '507f1f77bcf86cd799439011';
const ticket = {
  _id: id,
  title: 'Update homepage reel',
  priority: 'urgent',
  status: 'open',
};

describe('Ticket routes', () => {
  it('GET / returns paginated tickets and forwards query parameters', async () => {
    (TicketService.getTickets as jest.Mock).mockResolvedValue({
      data: [ticket],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });

    const response = await request.get('/api/ticket?priority=urgent&page=1');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([ticket]);
    expect(response.body.meta.total).toBe(1);
    expect(TicketService.getTickets).toHaveBeenCalledWith(
      expect.objectContaining({ priority: 'urgent', page: '1' }),
    );
  });

  it('POST / creates a ticket with the authenticated user email', async () => {
    (TicketService.createTicket as jest.Mock).mockResolvedValue(ticket);

    const response = await request.post('/api/ticket').send({
      title: ticket.title,
      priority: ticket.priority,
      status: ticket.status,
    });

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(ticket);
    expect(TicketService.createTicket).toHaveBeenCalledWith({
      title: ticket.title,
      priority: ticket.priority,
      status: ticket.status,
      created_by: 'admin@twelvecreative.co',
    });
  });

  it('GET /:id returns one ticket', async () => {
    (TicketService.getTicket as jest.Mock).mockResolvedValue(ticket);

    const response = await request.get(`/api/ticket/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(ticket);
    expect(TicketService.getTicket).toHaveBeenCalledWith(id);
  });

  it('PATCH /:id updates one ticket', async () => {
    const updated = { ...ticket, status: 'resolved' };
    (TicketService.updateTicket as jest.Mock).mockResolvedValue(updated);

    const response = await request
      .patch(`/api/ticket/${id}`)
      .send({ status: 'resolved' });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.status).toBe('resolved');
    expect(TicketService.updateTicket).toHaveBeenCalledWith(id, {
      status: 'resolved',
    });
  });

  it('DELETE /:id deletes one ticket', async () => {
    (TicketService.deleteTicket as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/ticket/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(TicketService.deleteTicket).toHaveBeenCalledWith(id);
  });

  it('returns a service error through the route error handler', async () => {
    (TicketService.getTicket as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Ticket not found',
    });

    const response = await request.get(`/api/ticket/${id}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Ticket not found',
    });
  });
});
