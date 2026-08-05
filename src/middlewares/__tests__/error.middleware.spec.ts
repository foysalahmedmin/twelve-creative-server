/**
 * The global error handler is the only place that sees every unexpected
 * failure, so it is what feeds the admin System Logs screen. These tests pin
 * the two properties that make that log useful: 5xx is always recorded, and
 * ordinary 4xx traffic never is.
 */

import type { Request, Response } from 'express';
import AppError from '../../builder/app-error';
import { SystemLog } from '../../modules/system-log/system-log.model';
import error from '../error.middleware';

jest.mock('../../modules/system-log/system-log.model', () => ({
  SystemLog: { log: jest.fn().mockResolvedValue(undefined) },
}));

const logMock = SystemLog.log as unknown as jest.Mock;

const makeRes = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const makeReq = (over: Partial<Request> = {}) =>
  ({
    method: 'POST',
    originalUrl: '/api/thing',
    ...over,
  }) as Request;

const run = (err: unknown, req = makeReq()) => {
  const res = makeRes();
  error(err, req, res, jest.fn());
  return res;
};

beforeEach(() => logMock.mockClear());

describe('global error handler → SystemLog', () => {
  it('records an unexpected 500 so it is visible in the admin panel', () => {
    run(new TypeError("Cannot read properties of undefined (reading 'image')"));

    expect(logMock).toHaveBeenCalledTimes(1);
    const [level, message, , meta] = logMock.mock.calls[0];
    expect(level).toBe('error');
    expect(message).toContain('POST /api/thing → 500');
    expect(meta.status).toBe(500);
    expect(meta.stack).toBeDefined();
  });

  it('records an explicit 5xx AppError', () => {
    run(new AppError(503, 'Upstream unavailable'));

    expect(logMock).toHaveBeenCalledTimes(1);
    expect(logMock.mock.calls[0][3].status).toBe(503);
  });

  it.each([
    [400, 'Bad request'],
    [401, 'No token provided.'],
    [403, 'Forbidden'],
    [404, 'Not found'],
    [409, 'User already exists!'],
  ])(
    'does not record %i — ordinary traffic would drown the log',
    (status, msg) => {
      run(new AppError(status, msg));
      expect(logMock).not.toHaveBeenCalled();
    },
  );

  it('attributes the failure to the signed-in admin when there is one', () => {
    run(
      new Error('boom'),
      makeReq({
        user: { email: 'admin@twelvecreative.io' },
      } as Partial<Request>),
    );

    expect(logMock.mock.calls[0][2]).toBe('admin@twelvecreative.io');
  });

  it('still returns a response when logging is unavailable', () => {
    logMock.mockImplementationOnce(() => {
      throw new Error('mongo down');
    });

    // A logger failure must never turn a handled 500 into a crashed request.
    expect(() => run(new Error('boom'))).not.toThrow();
  });
});
