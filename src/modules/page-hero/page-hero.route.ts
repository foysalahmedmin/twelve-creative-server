import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as PageHeroControllers from './page-hero.controller';
import {
  pageHeroParamSchema,
  upsertPageHeroValidationSchema,
} from './page-hero.validator';

const router = express.Router();

router.get(
  '/public/:page',
  validation(pageHeroParamSchema),
  PageHeroControllers.getPublicPageHero,
);

router.get('/', auth('admin', 'editor'), PageHeroControllers.getAllPageHeroes);

router.get(
  '/:page',
  auth('admin', 'editor'),
  validation(pageHeroParamSchema),
  PageHeroControllers.getPageHeroByPage,
);

router.patch(
  '/:page',
  auth('admin', 'editor'),
  validation(upsertPageHeroValidationSchema),
  PageHeroControllers.upsertPageHero,
);

const pageHeroRoutes = router;
export default pageHeroRoutes;
