import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../system-log.model', () => ({
  SystemLog: {
    find: jest.fn(),
    countDocuments: jest.fn(),
  },
}));
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

import { SystemLog } from '../system-log.model';
import systemLogRoutes from '../system-log.route';

const app = express();
app.use('/api/system-log', systemLogRoutes);
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

const log = {
  _id: '507f1f77bcf86cd799439011',
  level: 'error',
  message: 'Render failed',
};

const mockFindChain = (result: unknown) => {
  const lean = jest.fn().mockResolvedValue(result);
  const limit = jest.fn().mockReturnValue({ lean });
  const skip = jest.fn().mockReturnValue({ limit });
  const sort = jest.fn().mockReturnValue({ skip });
  (SystemLog.find as jest.Mock).mockReturnValue({ sort });
  return { sort, skip, limit, lean };
};

describe('System log route', () => {
  it('GET / uses default pagination and returns response metadata', async () => {
    const chain = mockFindChain([log]);
    (SystemLog.countDocuments as jest.Mock).mockResolvedValue(1);

    const response = await request.get('/api/system-log');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([log]);
    expect(response.body.meta).toEqual({
      total: 1,
      page: 1,
      limit: 100,
      total_pages: 1,
    });
    expect(SystemLog.find).toHaveBeenCalledWith({});
    expect(chain.sort).toHaveBeenCalledWith({ created_at: -1 });
    expect(chain.skip).toHaveBeenCalledWith(0);
    expect(chain.limit).toHaveBeenCalledWith(100);
    expect(SystemLog.countDocuments).toHaveBeenCalledWith({});
  });

  it('GET / applies level filtering and requested pagination', async () => {
    const chain = mockFindChain([log]);
    (SystemLog.countDocuments as jest.Mock).mockResolvedValue(21);

    const response = await request.get(
      '/api/system-log?level=error&page=2&limit=10',
    );

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.meta).toEqual({
      total: 21,
      page: 2,
      limit: 10,
      total_pages: 3,
    });
    expect(SystemLog.find).toHaveBeenCalledWith({ level: 'error' });
    expect(chain.skip).toHaveBeenCalledWith(10);
    expect(chain.limit).toHaveBeenCalledWith(10);
    expect(SystemLog.countDocuments).toHaveBeenCalledWith({ level: 'error' });
  });

  it('passes model failures to the error handler', async () => {
    const lean = jest.fn().mockRejectedValue(new Error('Query failed'));
    const limit = jest.fn().mockReturnValue({ lean });
    const skip = jest.fn().mockReturnValue({ limit });
    const sort = jest.fn().mockReturnValue({ skip });
    (SystemLog.find as jest.Mock).mockReturnValue({ sort });
    (SystemLog.countDocuments as jest.Mock).mockResolvedValue(0);

    const response = await request.get('/api/system-log');

    expect(response.status).toBe(httpStatus.INTERNAL_SERVER_ERROR);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Query failed',
    });
  });
});
