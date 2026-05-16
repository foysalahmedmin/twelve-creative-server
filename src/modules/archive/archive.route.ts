import express from 'express';
import auth from '../../middlewares/auth.middleware';
import validation from '../../middlewares/validation.middleware';
import * as ArchiveControllers from './archive.controller';
import * as ArchiveValidations from './archive.validator';

const router = express.Router();

// GET
router.get('/public', ArchiveControllers.getPublicPosts);
router.get('/', auth('admin', 'editor'), ArchiveControllers.getPosts);
router.get(
  '/:id/public',
  validation(ArchiveValidations.postIdSchema),
  ArchiveControllers.getPost,
);
router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(ArchiveValidations.postIdSchema),
  ArchiveControllers.getPost,
);

// POST
router.post(
  '/',
  auth('admin', 'editor'),
  validation(ArchiveValidations.createPostValidationSchema),
  ArchiveControllers.createPost,
);
router.post(
  '/:id/restore',
  auth('admin'),
  validation(ArchiveValidations.postIdSchema),
  ArchiveControllers.restorePost,
);

// PATCH
router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(ArchiveValidations.updatePostValidationSchema),
  ArchiveControllers.updatePost,
);

// DELETE
router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(ArchiveValidations.postIdSchema),
  ArchiveControllers.deletePostPermanent,
);
router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(ArchiveValidations.postIdSchema),
  ArchiveControllers.deletePost,
);

const archiveRoutes = router;

export default archiveRoutes;
