import express from 'express';
import auth from '../../middlewares/auth.middleware';
import file from '../../middlewares/file.middleware';
import storage from '../../middlewares/storage.middleware';
import validation from '../../middlewares/validation.middleware';
import * as FileControllers from './file.controller';
import * as FileValidations from './file.validator';

const router = express.Router();

// ─── POST (Upload) ───────────────────────────────────────────────────────────

// Local Upload
router.post(
  '/',
  auth('admin', 'editor'),
  file({
    name: 'file',
    folder: 'files',
    size: 50 * 1024 * 1024, // 50MB
  }),
  validation(FileValidations.createFileValidationSchema),
  FileControllers.createLocalFile,
);

// Cloud Upload (GCS)
router.post(
  '/cloud',
  auth('admin', 'editor'),
  storage({
    name: 'file',
    size: 50 * 1024 * 1024, // 50MB
    makePublic: true,
  }),
  validation(FileValidations.createFileValidationSchema),
  FileControllers.createCloudFiles,
);

// ─── GET (List & Single) ─────────────────────────────────────────────────────

router.get(
  '/',
  auth('admin', 'editor'),
  FileControllers.getFiles,
);

router.get(
  '/self',
  auth('admin', 'editor'),
  FileControllers.getSelfFiles,
);

router.get(
  '/:id',
  auth('admin', 'editor'),
  validation(FileValidations.fileOperationValidationSchema),
  FileControllers.getFile,
);

// ─── PATCH (Update) ──────────────────────────────────────────────────────────

router.patch(
  '/bulk',
  auth('admin', 'editor'),
  validation(FileValidations.updateFilesValidationSchema),
  FileControllers.updateFiles,
);

router.patch(
  '/:id',
  auth('admin', 'editor'),
  validation(FileValidations.updateFileValidationSchema),
  FileControllers.updateFile,
);

// ─── DELETE ──────────────────────────────────────────────────────────────────

router.delete(
  '/bulk/permanent',
  auth('admin'),
  validation(FileValidations.filesOperationValidationSchema),
  FileControllers.deleteFilesPermanent,
);

router.delete(
  '/bulk',
  auth('admin', 'editor'),
  validation(FileValidations.filesOperationValidationSchema),
  FileControllers.deleteFiles,
);

router.delete(
  '/:id/permanent',
  auth('admin'),
  validation(FileValidations.fileOperationValidationSchema),
  FileControllers.deleteFilePermanent,
);

router.delete(
  '/:id',
  auth('admin', 'editor'),
  validation(FileValidations.fileOperationValidationSchema),
  FileControllers.deleteFile,
);

// ─── POST (Restore) ──────────────────────────────────────────────────────────

router.post(
  '/bulk/restore',
  auth('admin', 'editor'),
  validation(FileValidations.filesOperationValidationSchema),
  FileControllers.restoreFiles,
);

router.post(
  '/:id/restore',
  auth('admin', 'editor'),
  validation(FileValidations.fileOperationValidationSchema),
  FileControllers.restoreFile,
);

const fileRoutes = router;
export default fileRoutes;
