import express from 'express';
import httpStatus from 'http-status';
import supertest from 'supertest';

jest.mock('../page-hero.service');
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

import pageHeroRoutes from '../page-hero.route';
import * as PageHeroService from '../page-hero.service';

const app = express();
app.use(express.json());
app.use('/api/page-hero', pageHeroRoutes);
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

const hero = { page: 'home', title: 'Home hero', is_active: true };

describe('Page hero routes', () => {
  it('GET /public/:page returns a public hero, including null when absent', async () => {
    (PageHeroService.getPageHeroByPage as jest.Mock)
      .mockResolvedValueOnce(hero)
      .mockResolvedValueOnce(null);

    const found = await request.get('/api/page-hero/public/home');
    const missing = await request.get('/api/page-hero/public/about');

    expect(found.status).toBe(httpStatus.OK);
    expect(found.body.data).toEqual(hero);
    expect(missing.status).toBe(httpStatus.OK);
    expect(missing.body.data).toBeNull();
    expect(PageHeroService.getPageHeroByPage).toHaveBeenNthCalledWith(
      1,
      'home',
    );
    expect(PageHeroService.getPageHeroByPage).toHaveBeenNthCalledWith(
      2,
      'about',
    );
  });

  it('GET / returns every page hero', async () => {
    (PageHeroService.getAllPageHeroes as jest.Mock).mockResolvedValue([hero]);

    const response = await request.get('/api/page-hero');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual([hero]);
    expect(PageHeroService.getAllPageHeroes).toHaveBeenCalledWith();
  });

  it('GET /:page returns the requested admin hero', async () => {
    (PageHeroService.getPageHeroByPage as jest.Mock).mockResolvedValue(hero);

    const response = await request.get('/api/page-hero/home');

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data).toEqual(hero);
    expect(PageHeroService.getPageHeroByPage).toHaveBeenCalledWith('home');
  });

  it('PATCH /:page forwards the page and payload', async () => {
    (PageHeroService.upsertPageHero as jest.Mock).mockResolvedValue({
      ...hero,
      title: 'Updated',
    });

    const response = await request
      .patch('/api/page-hero/home')
      .send({ title: 'Updated' });

    expect(response.status).toBe(httpStatus.OK);
    expect(response.body.data.title).toBe('Updated');
    expect(PageHeroService.upsertPageHero).toHaveBeenCalledWith('home', {
      title: 'Updated',
    });
  });

  it('passes service failures to the error handler', async () => {
    (PageHeroService.getAllPageHeroes as jest.Mock).mockRejectedValue({
      status: httpStatus.SERVICE_UNAVAILABLE,
      message: 'Database unavailable',
    });

    const response = await request.get('/api/page-hero');

    expect(response.status).toBe(httpStatus.SERVICE_UNAVAILABLE);
    expect(response.body).toMatchObject({
      success: false,
      message: 'Database unavailable',
    });
  });
});
