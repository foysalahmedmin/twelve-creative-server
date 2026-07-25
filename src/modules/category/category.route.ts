import express from 'express';
import auth from '../../middlewares/auth.middleware';
import file from '../../middlewares/file.middleware';
import validation from '../../middlewares/validation.middleware';
import * as CategoryControllers from './category.controller';
import * as CategoryValidations from './category.validator';

const router = express.Router();

const iconUpload = file({
  name: 'icon',
  folder: 'categories/icons',
  size: 5_000_000,
  allowedTypes: [
    'image/jpeg',
    'image/png',
    'image/jpg',
    'image/gif',
    'image/webp',
  ],
});

// GET
router.get(
  '/public',
  validation(CategoryValidations.publicCategoriesQuerySchema),
  CategoryControllers.getPublicCategories,
);
router.get('/', auth('admin', 'editor'), CategoryControllers.getCategories);
router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(CategoryValidations.categoryIdSchema),
  CategoryControllers.getCategory,
);

// POST
router.post(
  '/',
  auth('admin', 'editor'),
  iconUpload,
  validation(CategoryValidations.createCategoryValidationSchema),
  CategoryControllers.createCategory,
);

router.post(
  '/:id/restore',
  auth('admin'),
  validation(CategoryValidations.categoryIdSchema),
  CategoryControllers.restoreCategory,
);

// PATCH
router.patch(
  '/:id',
  auth('admin', 'editor'),
  iconUpload,
  validation(CategoryValidations.updateCategoryValidationSchema),
  CategoryControllers.updateCategory,
);

// DELETE
router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(CategoryValidations.categoryIdSchema),
  CategoryControllers.deleteCategoryPermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(CategoryValidations.categoryIdSchema),
  CategoryControllers.deleteCategory,
);

const categoryRoutes = router;

export default categoryRoutes;
