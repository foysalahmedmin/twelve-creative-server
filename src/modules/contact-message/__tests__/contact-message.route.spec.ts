import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../contact-message.service');
jest.mock('express-rate-limit', () =>
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
jest.mock('../../../middlewares/auth.middleware', () =>
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

import contactMessageRoutes from '../contact-message.route';
import * as ContactMessageService from '../contact-message.service';

const app = express();
app.use(express.json());
app.use('/api/contact-message', contactMessageRoutes);
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
const message = {
  _id: id,
  name: 'Taylor',
  email: 'taylor@example.com',
  subject: 'New project',
  message: 'Hello',
  is_read: false,
  is_archived: false,
};

describe('Contact message routes', () => {
  it('POST /public submits a message without returning private data', async () => {
    (ContactMessageService.createContactMessage as jest.Mock).mockResolvedValue(
      message,
    );
    const payload = {
      name: message.name,
      email: message.email,
      subject: message.subject,
      message: message.message,
    };

    const response = await request
      .post('/api/contact-message/public')
      .send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toBeNull();
    expect(ContactMessageService.createContactMessage).toHaveBeenCalledWith(
      payload,
    );
  });

  it('GET /unread-count returns the unread count', async () => {
    (ContactMessageService.getUnreadCount as jest.Mock).mockResolvedValue(3);

    const response = await request.get('/api/contact-message/unread-count');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual({ count: 3 });
  });

  it('GET / returns paginated messages', async () => {
    (ContactMessageService.getContactMessages as jest.Mock).mockResolvedValue({
      data: [message],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });

    const response = await request.get('/api/contact-message?filter=unread');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([message]);
    expect(response.body.meta.total).toBe(1);
    expect(ContactMessageService.getContactMessages).toHaveBeenCalledWith(
      expect.objectContaining({ filter: 'unread' }),
    );
  });

  it('GET /:id returns one message', async () => {
    (ContactMessageService.getContactMessage as jest.Mock).mockResolvedValue(
      message,
    );

    const response = await request.get(`/api/contact-message/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(message);
    expect(ContactMessageService.getContactMessage).toHaveBeenCalledWith(id);
  });

  it('PATCH /:id updates one message', async () => {
    const updated = { ...message, is_read: true };
    (ContactMessageService.updateContactMessage as jest.Mock).mockResolvedValue(
      updated,
    );

    const response = await request
      .patch(`/api/contact-message/${id}`)
      .send({ is_read: true });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.is_read).toBe(true);
    expect(ContactMessageService.updateContactMessage).toHaveBeenCalledWith(
      id,
      { is_read: true },
    );
  });

  it('DELETE /:id/permanent permanently deletes one message', async () => {
    (
      ContactMessageService.deleteContactMessagePermanent as jest.Mock
    ).mockResolvedValue(undefined);

    const response = await request.delete(
      `/api/contact-message/${id}/permanent`,
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(
      ContactMessageService.deleteContactMessagePermanent,
    ).toHaveBeenCalledWith(id);
  });

  it('DELETE /:id soft-deletes one message', async () => {
    (ContactMessageService.deleteContactMessage as jest.Mock).mockResolvedValue(
      undefined,
    );

    const response = await request.delete(`/api/contact-message/${id}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(ContactMessageService.deleteContactMessage).toHaveBeenCalledWith(id);
  });

  it('passes service errors to the route error handler', async () => {
    (ContactMessageService.getContactMessage as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'Message not found',
    });

    const response = await request.get(`/api/contact-message/${id}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Message not found',
    });
  });
});
