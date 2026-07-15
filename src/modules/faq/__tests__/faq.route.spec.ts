import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../faq.service');
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

import faqRoutes from '../faq.route';
import * as FaqService from '../faq.service';

const app = express();
app.use(express.json());
app.use('/api/faq', faqRoutes);
app.use(
  (
    error: { status?: number; message?: string },
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    res
      .status(error.status ?? httpStatus.INTERNAL_SERVER_ERROR)
      .json({ success: false, message: error.message });
  },
);

const request = supertest(app);
const FAQ_ID = '507f1f77bcf86cd799439021';
const faq = {
  _id: FAQ_ID,
  question: 'How long does a project take?',
  answer: 'Most projects take between four and eight weeks.',
  group: 'Process',
  order: 1,
  is_active: true,
};

describe('FAQ routes', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('GET /public returns the public FAQ list', async () => {
    (FaqService.getPublicFaqs as jest.Mock).mockResolvedValue({ data: [faq] });

    const response = await request.get('/api/faq/public');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body).toMatchObject({
      success: true,
      message: 'FAQs retrieved successfully',
      data: [faq],
    });
    expect(FaqService.getPublicFaqs).toHaveBeenCalledWith();
  });

  it('GET / returns paginated FAQs and forwards query parameters', async () => {
    (FaqService.getFaqs as jest.Mock).mockResolvedValue({
      data: [faq],
      meta: { total: 1, page: 1, limit: 10, total_pages: 1 },
    });

    const response = await request.get(
      '/api/faq?filter=active&search=project&page=1',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([faq]);
    expect(response.body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 10,
      total_pages: 1,
    });
    expect(FaqService.getFaqs).toHaveBeenCalledWith(
      expect.objectContaining({
        filter: 'active',
        search: 'project',
        page: '1',
      }),
    );
  });

  it('GET /:id returns the requested FAQ', async () => {
    (FaqService.getFaq as jest.Mock).mockResolvedValue(faq);

    const response = await request.get(`/api/faq/${FAQ_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(faq);
    expect(response.body.message).toBe('FAQ retrieved successfully');
    expect(FaqService.getFaq).toHaveBeenCalledWith(FAQ_ID);
  });

  it('POST / creates an FAQ from the request body', async () => {
    const payload = {
      question: faq.question,
      answer: faq.answer,
      group: faq.group,
      order: faq.order,
      is_active: faq.is_active,
    };
    (FaqService.createFaq as jest.Mock).mockResolvedValue(faq);

    const response = await request.post('/api/faq').send(payload);

    expect(response.status).toBe(httpStatus.CREATED);
    expect(response.body.data).toEqual(faq);
    expect(response.body.message).toBe('FAQ created successfully');
    expect(FaqService.createFaq).toHaveBeenCalledWith(payload);
  });

  it('POST /reorder forwards the items and returns a null response body', async () => {
    const items = [
      { _id: FAQ_ID, order: 2 },
      { _id: '507f1f77bcf86cd799439022', order: 1 },
    ];
    (FaqService.reorderFaqs as jest.Mock).mockResolvedValue(undefined);

    const response = await request.post('/api/faq/reorder').send({ items });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toBe('FAQs reordered successfully');
    expect(FaqService.reorderFaqs).toHaveBeenCalledWith(items);
  });

  it('PATCH /:id updates the requested FAQ', async () => {
    const payload = {
      question: 'When can a project start?',
      is_active: false,
    };
    const updated = { ...faq, ...payload };
    (FaqService.updateFaq as jest.Mock).mockResolvedValue(updated);

    const response = await request.patch(`/api/faq/${FAQ_ID}`).send(payload);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(updated);
    expect(response.body.message).toBe('FAQ updated successfully');
    expect(FaqService.updateFaq).toHaveBeenCalledWith(FAQ_ID, payload);
  });

  it('DELETE /:id/permanent permanently deletes the requested FAQ', async () => {
    (FaqService.deleteFaqPermanent as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/faq/${FAQ_ID}/permanent`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toBe('FAQ permanently deleted');
    expect(FaqService.deleteFaqPermanent).toHaveBeenCalledWith(FAQ_ID);
  });

  it('DELETE /:id soft deletes the requested FAQ', async () => {
    (FaqService.deleteFaq as jest.Mock).mockResolvedValue(undefined);

    const response = await request.delete(`/api/faq/${FAQ_ID}`);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toBeNull();
    expect(response.body.message).toBe('FAQ deleted successfully');
    expect(FaqService.deleteFaq).toHaveBeenCalledWith(FAQ_ID);
  });

  it('passes a service not-found error to the route error handler', async () => {
    (FaqService.getFaq as jest.Mock).mockRejectedValue({
      status: httpStatus.NOT_FOUND,
      message: 'FAQ not found',
    });

    const response = await request.get(`/api/faq/${FAQ_ID}`);

    expect(response.status).toBe(httpStatus.NOT_FOUND);
    expect(response.body).toEqual({
      success: false,
      message: 'FAQ not found',
    });
  });

  it('passes an unexpected reorder failure to the route error handler', async () => {
    (FaqService.reorderFaqs as jest.Mock).mockRejectedValue(
      new Error('Reorder failed'),
    );

    const response = await request
      .post('/api/faq/reorder')
      .send({ items: [{ _id: FAQ_ID, order: 1 }] });

    expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toEqual({
      success: false,
      message: 'Reorder failed',
    });
  });
});
