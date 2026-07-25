import httpStatus from 'http-status';
import catchAsync from '../../utils/catch-async';
import sendResponse from '../../utils/send-response';
import * as PageHeroServices from './page-hero.service';
import { TPageKey } from './page-hero.type';

export const getAllPageHeroes = catchAsync(async (_req, res) => {
  const result = await PageHeroServices.getAllPageHeroes();
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page heroes retrieved successfully',
    data: result,
  });
});

export const getPublicPageHero = catchAsync(async (req, res) => {
  const result = await PageHeroServices.getPublicPageHeroByPage(
    req.params.page as TPageKey,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page hero retrieved successfully',
    data: result ?? null,
  });
});

export const getPageHeroByPage = catchAsync(async (req, res) => {
  const result = await PageHeroServices.getPageHeroByPage(
    req.params.page as TPageKey,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page hero retrieved successfully',
    data: result ?? null,
  });
});

export const upsertPageHero = catchAsync(async (req, res) => {
  const result = await PageHeroServices.upsertPageHero(
    req.params.page as TPageKey,
    req.body,
  );
  sendResponse(res, {
    status: httpStatus.OK,
    success: true,
    message: 'Page hero updated successfully',
    data: result,
  });
});
