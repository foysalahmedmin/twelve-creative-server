import express, {
  type ErrorRequestHandler,
  type RequestHandler,
} from 'express';
import { existsSync, mkdtempSync, readdirSync, rmSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import supertest from 'supertest';
import { SUPPORTED_LOCAL_UPLOAD_MIME_TYPES } from '../../constants/upload-policy';
import file from '../file.middleware';

describe('local file middleware', () => {
  const originalWorkingDirectory = process.cwd();
  let workingDirectory: string;

  beforeEach(() => {
    workingDirectory = mkdtempSync(path.join(os.tmpdir(), 'tc-upload-test-'));
    process.chdir(workingDirectory);
  });

  afterEach(() => {
    process.chdir(originalWorkingDirectory);
    rmSync(workingDirectory, { recursive: true, force: true });
  });

  const uploadDirectoryContents = (): string[] => {
    const uploadDirectory = path.join(workingDirectory, 'uploads/files');
    return existsSync(uploadDirectory) ? readdirSync(uploadDirectory) : [];
  };

  const waitForUploadCleanup = async (): Promise<void> => {
    for (let attempt = 0; attempt < 50; attempt += 1) {
      if (uploadDirectoryContents().length === 0) return;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error('Timed out waiting for rejected upload cleanup');
  };

  const successHandler: RequestHandler = (req, res) => {
    const uploaded = (req.files as Record<string, Express.Multer.File[]>)
      .file[0];
    res.status(201).json({
      filename: uploaded.filename,
      path: uploaded.path,
    });
  };

  const buildApp = (handler: RequestHandler = successHandler) => {
    const app = express();
    app.post(
      '/upload',
      file({
        name: 'file',
        folder: 'files',
        size: 1024,
        allowedTypes: SUPPORTED_LOCAL_UPLOAD_MIME_TYPES,
      }),
      handler,
    );

    const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
      res.status(error.status || 500).json({ message: error.message });
    };
    app.use(errorHandler);
    return app;
  };

  it('uses a UUID and canonical extension instead of the original filename', async () => {
    const response = await supertest(buildApp())
      .post('/upload')
      .attach('file', Buffer.from('test image bytes'), {
        filename: '../../client-controlled.html',
        contentType: 'image/png',
      });

    expect(response.status).toBe(201);
    expect(response.body.filename).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.png$/i,
    );
    expect(response.body.filename).not.toContain('client-controlled');
    expect(readdirSync(path.join(workingDirectory, 'uploads/files'))).toEqual([
      response.body.filename,
    ]);
  });

  it('rejects an unapproved MIME type before a file is written', async () => {
    const response = await supertest(buildApp())
      .post('/upload')
      .attach('file', Buffer.from('<script>alert(1)</script>'), {
        filename: 'payload.html',
        contentType: 'text/html',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid file type');

    expect(uploadDirectoryContents()).toEqual([]);
  });

  it('rejects active SVG content before a file is written', async () => {
    const response = await supertest(buildApp())
      .post('/upload')
      .attach('file', Buffer.from('<svg onload="alert(1)"></svg>'), {
        filename: 'active.svg',
        contentType: 'image/svg+xml',
      });

    expect(response.status).toBe(400);
    expect(response.body.message).toContain('Invalid file type');
    expect(uploadDirectoryContents()).toEqual([]);
  });

  it('removes a newly written file when downstream validation fails', async () => {
    const response = await supertest(
      buildApp((_req, _res, next) => {
        next(Object.assign(new Error('Validation failed'), { status: 422 }));
      }),
    )
      .post('/upload')
      .attach('file', Buffer.from('test image bytes'), {
        filename: 'photo.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(422);
    await waitForUploadCleanup();
    expect(uploadDirectoryContents()).toEqual([]);
  });

  it('does not leave a partial file when Multer rejects an oversized upload', async () => {
    const response = await supertest(buildApp())
      .post('/upload')
      .attach('file', Buffer.alloc(2048), {
        filename: 'oversized.png',
        contentType: 'image/png',
      });

    expect(response.status).toBe(400);
    await waitForUploadCleanup();
    expect(uploadDirectoryContents()).toEqual([]);
  });
});
