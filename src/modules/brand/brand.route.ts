import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as BrandControllers from './brand.controller';
import * as BrandValidations from './brand.validator';

const router = express.Router();

router.get('/public', BrandControllers.getPublicBrands);

router.get('/', auth('admin', 'editor'), BrandControllers.getBrands);
router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(BrandValidations.brandIdSchema),
  BrandControllers.getBrand,
);

router.post(
  '/',
  auth('admin', 'editor'),
  validation(BrandValidations.createBrandValidationSchema),
  BrandControllers.createBrand,
);

router.post(
  '/reorder',
  auth('admin', 'editor'),
  validation(BrandValidations.reorderBrandsValidationSchema),
  BrandControllers.reorderBrands,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(BrandValidations.updateBrandValidationSchema),
  BrandControllers.updateBrand,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(BrandValidations.brandIdSchema),
  BrandControllers.deleteBrandPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(BrandValidations.brandIdSchema),
  BrandControllers.deleteBrand,
);

const brandRoutes = router;
export default brandRoutes;
