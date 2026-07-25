import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../process-section.service');
jest.mock('../../../middlewares/auth.middleware', () =>
  jest.fn(
    (...roles: string[]) =>
      (
        _req: express.Request,
        res: express.Response,
        next: express.NextFunction,
      ) => {
        res.setHeader('x-test-auth-roles', roles.join(','));
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

import processSectionRoutes from '../process-section.route';
import * as ProcessSectionService from '../process-section.service';

const app = express();
app.use(express.json());
app.use('/api/process-section', processSectionRoutes);
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

const section = {
  label: 'Our Process',
  title: 'A clear process',
  description: 'From clarity to execution.',
  thumbnail: 'https://example.com/process.jpg',
  process_steps: [
    {
      id: 'step-1',
      index: '01',
      icon: 'understand',
      title: 'Understand',
      description: 'Review the business.',
      image: 'https://example.com/step.jpg',
    },
  ],
};

describe('Process section routes', () => {
  it('GET /public returns the public section, including null when absent', async () => {
    (ProcessSectionService.getPublicProcessSection as jest.Mock)
      .mockResolvedValueOnce(section)
      .mockResolvedValueOnce(null);

    const found = await request.get('/api/process-section/public');
    const missing = await request.get('/api/process-section/public');

    expect(found.status).toBe(httpStatus.OK);
    expect(found.body.data).toEqual(section);
    expect(found.headers['x-test-auth-roles']).toBeUndefined();
    expect(missing.status).toBe(httpStatus.OK);
    expect(missing.body.data).toBeNull();
    expect(ProcessSectionService.getPublicProcessSection).toHaveBeenCalledTimes(
      2,
    );
    expect(ProcessSectionService.getProcessSection).not.toHaveBeenCalled();
  });

  it('GET / returns the authenticated singleton', async () => {
    (ProcessSectionService.getProcessSection as jest.Mock).mockResolvedValue(
      section,
    );

    const response = await request.get('/api/process-section');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(section);
    expect(response.headers['x-test-auth-roles']).toBe('admin,editor');
    expect(ProcessSectionService.getProcessSection).toHaveBeenCalledWith();
  });

  it('PATCH / forwards the complete validated payload', async () => {
    (ProcessSectionService.updateProcessSection as jest.Mock).mockResolvedValue(
      section,
    );

    const response = await request.patch('/api/process-section').send(section);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(section);
    expect(response.headers['x-test-auth-roles']).toBe('admin,editor');
    expect(ProcessSectionService.updateProcessSection).toHaveBeenCalledWith(
      section,
    );
  });

  it('passes service failures to the error handler', async () => {
    (ProcessSectionService.updateProcessSection as jest.Mock).mockRejectedValue(
      {
        status: httpStatus.BAD_REQUEST,
        message: 'Process step ids must be unique',
      },
    );

    const response = await request.patch('/api/process-section').send(section);

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Process step ids must be unique',
    });
  });
});
