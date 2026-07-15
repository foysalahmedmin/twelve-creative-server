import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../site-setting.service');
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

import siteSettingRoutes from '../site-setting.route';
import * as SiteSettingService from '../site-setting.service';

const app = express();
app.use(express.json());
app.use('/api/site-setting', siteSettingRoutes);
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

const setting = { contact_email: 'hello@twelvecreative.co' };

describe('Site setting routes', () => {
  it.each(['/api/site-setting/public', '/api/site-setting'])(
    'GET %s returns the singleton settings',
    async (path) => {
      (SiteSettingService.getSiteSetting as jest.Mock).mockResolvedValue(
        setting,
      );

      const response = await request.get(path);

      expect(response.status).toBe(httpStatus.OK);
      expect(response.body.data).toEqual(setting);
    },
  );

  it('PATCH / updates the settings payload', async () => {
    const updated = { contact_email: 'studio@twelvecreative.co' };
    (SiteSettingService.updateSiteSetting as jest.Mock).mockResolvedValue(
      updated,
    );

    const response = await request.patch('/api/site-setting').send(updated);

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(updated);
    expect(SiteSettingService.updateSiteSetting).toHaveBeenCalledWith(updated);
  });

  it('passes service failures to the error handler', async () => {
    (SiteSettingService.updateSiteSetting as jest.Mock).mockRejectedValue({
      status: httpStatus.BAD_REQUEST,
      message: 'Invalid settings',
    });

    const response = await request
      .patch('/api/site-setting')
      .send({ contact_email: 'bad' });

    expect(response.status).toBe(httpStatus.BAD_REQUEST);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Invalid settings',
    });
  });
});
