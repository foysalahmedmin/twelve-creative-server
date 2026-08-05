/* eslint-disable no-console */
import { NextFunction, Request, Response } from 'express';
import fs from 'fs';
import httpStatus from 'http-status';
import DOMPurify from 'isomorphic-dompurify';
import multer, { FileFilterCallback } from 'multer';
import { randomUUID } from 'node:crypto';
import path from 'path';
import AppError from '../builder/app-error';
import config from '../config/env';
import {
  getCanonicalUploadExtension,
  isSupportedLocalUploadMime,
} from '../constants/upload-policy';
import catchAsync from '../utils/catch-async';

type TFile = {
  name: string;
  folder: string;
  size?: number;
  maxCount?: number;
  minCount?: number;
  allowedTypes?: readonly string[];
};

const getUploadedFiles = (req: Request): Express.Multer.File[] => {
  if (!req.files) return [];
  return Array.isArray(req.files) ? req.files : Object.values(req.files).flat();
};

const getUploadedPaths = (req: Request): string[] =>
  getUploadedFiles(req)
    .map((uploadedFile) => uploadedFile.path)
    .filter(Boolean);

// SVG is XML, not a raster format — an unsanitized file can carry a <script>
// or on*="" handler that executes if its URL is ever opened directly rather
// than embedded via <img>. Strip that before the file is considered
// "uploaded"; every field that accepts image/svg+xml goes through here.
const sanitizeSvgIfNeeded = async (
  uploadedFile: Express.Multer.File,
): Promise<void> => {
  if (uploadedFile.mimetype !== 'image/svg+xml') return;
  const raw = await fs.promises.readFile(uploadedFile.path, 'utf8');
  const clean = DOMPurify.sanitize(raw, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['foreignObject'],
  });
  await fs.promises.writeFile(uploadedFile.path, clean, 'utf8');
};

const removeUploadedPaths = async (uploadedPaths: string[]): Promise<void> => {
  await Promise.all(
    uploadedPaths.map(async (uploadedPath) => {
      try {
        await fs.promises.unlink(uploadedPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(
            `Failed to clean incomplete upload: ${uploadedPath}`,
            error,
          );
        }
      }
    }),
  );
};

const registerFailureCleanup = (
  res: Response,
  uploadedPaths: string[],
): void => {
  let cleanupStarted = false;
  let responseFinished = false;

  const cleanup = () => {
    if (cleanupStarted || uploadedPaths.length === 0) return;
    cleanupStarted = true;
    void removeUploadedPaths(uploadedPaths);
  };

  res.once('finish', () => {
    responseFinished = true;
    if (res.statusCode >= 400) cleanup();
  });

  res.once('close', () => {
    if (!responseFinished && (!res.headersSent || res.statusCode >= 400)) {
      cleanup();
    }
  });
};

const file = (...files: TFile[]) => {
  // 🚨 Disable file system in serverless (Vercel)
  if (process.env.VERCEL === '1') {
    return (req: Request, _res: Response, next: NextFunction) => {
      req.files = {};
      console.warn('File upload disabled in this environment');
      next();
    };
  }

  const storage = multer.diskStorage({
    destination: (_req, file, cb) => {
      const folder = files.find((f) => f.name === file.fieldname)?.folder || '';
      const safeFolder = folder.replace(/^\/+/, ''); // remove leading slash
      // Absolute, persistent directory — never resolved against
      // process.cwd() (which changes on every atomic-release deploy).
      const dir = path.join(config.upload_dir, safeFolder);
      fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (_req, file, cb) => {
      const extension = getCanonicalUploadExtension(file.mimetype);
      if (!extension) {
        return cb(
          new AppError(
            httpStatus.BAD_REQUEST,
            `Invalid file type for field "${file.fieldname}"`,
          ),
          '',
        );
      }

      // The original filename and extension are untrusted. A UUID plus the
      // canonical extension prevents path tricks, executable extensions, and
      // practical filename collisions.
      cb(null, `${randomUUID()}.${extension}`);
    },
  });

  // Global max size for multer limits (max of all per-field size limits)
  const globalMaxSize = Math.max(...files.map((f) => f.size || 5_000_000));

  // File filter for validating mimetype and size per field
  const fileFilter = (
    _req: Request,
    file: Express.Multer.File,
    cb: FileFilterCallback,
  ) => {
    const config = files.find((f) => f.name === file.fieldname);
    if (!config) {
      return cb(
        new AppError(
          httpStatus.BAD_REQUEST,
          `Unexpected field "${file.fieldname}"`,
        ),
      );
    }

    if (
      !isSupportedLocalUploadMime(file.mimetype) ||
      (config.allowedTypes && !config.allowedTypes.includes(file.mimetype))
    ) {
      return cb(
        new AppError(
          httpStatus.BAD_REQUEST,
          `Invalid file type for field "${file.fieldname}"`,
        ),
      );
    }

    cb(null, true);
  };

  // Setup multer upload
  const upload = multer({
    storage,
    limits: { fileSize: globalMaxSize },
    fileFilter,
  }).fields(
    files.map((f) => ({
      name: f.name,
      maxCount: f.maxCount || 1,
    })),
  );

  return catchAsync(async (req: Request, res: Response, next: NextFunction) => {
    upload(req, res, async (err: unknown) => {
      if (err) {
        void removeUploadedPaths(getUploadedPaths(req));
        return next(
          new AppError(
            httpStatus.BAD_REQUEST,
            (err as Error).message || 'File upload error',
          ),
        );
      }

      // Multer only populates req.files for a multipart/form-data body. A
      // route that merely *supports* an optional upload is often called with
      // plain JSON (no file at all), which would otherwise leave req.files
      // undefined and crash any controller that reads a field off it.
      // Guarantee the shape every downstream controller already assumes.
      if (!req.files) req.files = {};

      // Multer has finished writing at this point. If validation, a controller,
      // or the error handler later returns a failure, remove only these newly
      // created files. Successful responses deliberately retain them.
      registerFailureCleanup(res, getUploadedPaths(req));

      try {
        await Promise.all(getUploadedFiles(req).map(sanitizeSvgIfNeeded));

        // Check minCount
        const missing = files.filter((file) => {
          const uploaded = (
            req.files as Record<string, Express.Multer.File[]>
          )?.[file.name];
          return (
            file.minCount && (!uploaded || uploaded.length < file.minCount)
          );
        });

        if (missing.length) {
          const fields = missing.map((f) => `"${f.name}"`).join(', ');
          throw new AppError(
            httpStatus.BAD_REQUEST,
            `At least ${missing[0].minCount} file(s) required for: ${fields}`,
          );
        }

        // Delete old files support (single or multiple)
        const oldFilePaths = (
          req as Request & { oldFilePath?: string; oldFilePaths?: string[] }
        ).oldFilePaths;
        if (oldFilePaths?.length) {
          oldFilePaths.forEach((oldPath) => {
            const fullPath = path.resolve(oldPath);
            fs.unlink(fullPath, (unlinkErr) => {
              if (
                unlinkErr &&
                (unlinkErr as { code?: string }).code !== 'ENOENT'
              ) {
                console.warn(
                  `Failed to delete old file: ${fullPath}`,
                  (unlinkErr as Error).message,
                );
              }
            });
          });
        } else {
          const oldFilePath = (req as Request & { oldFilePath?: string })
            .oldFilePath;
          if (oldFilePath) {
            const fullPath = path.resolve(oldFilePath);
            fs.unlink(fullPath, (unlinkErr) => {
              if (
                unlinkErr &&
                (unlinkErr as { code?: string }).code !== 'ENOENT'
              ) {
                console.warn(
                  `Failed to delete old file: ${fullPath}`,
                  (unlinkErr as Error).message,
                );
              }
            });
          }
        }

        next();
      } catch (error) {
        next(error);
      }
    });
  });
};

export default file;
