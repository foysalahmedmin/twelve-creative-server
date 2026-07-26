import { Request, Response } from 'express';

const mockSave = jest.fn();
const mockMakePublic = jest.fn();
const mockDelete = jest.fn();
const mockBucketFile = jest.fn(() => ({
  save: mockSave,
  makePublic: mockMakePublic,
  delete: mockDelete,
}));
const mockBucket = jest.fn(() => ({ file: mockBucketFile }));

jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn(() => ({ bucket: mockBucket })),
}));

jest.mock('../../config/env', () => ({
  __esModule: true,
  default: {
    gcp: {
      bucket_name: 'test-bucket',
      credentials_path: '',
      project_id: 'test-project',
    },
  },
}));

jest.mock('multer', () => {
  const multer = jest.fn(() => ({
    fields:
      () =>
      (req: Request, _res: Response, callback: (error?: unknown) => void) => {
        req.files = {
          file: [
            {
              fieldname: 'file',
              originalname: 'demo.mp4',
              encoding: '7bit',
              mimetype: 'video/mp4',
              size: 128,
              buffer: Buffer.from('video'),
            },
          ],
        } as unknown as Express.Multer.File[];
        callback();
      },
  }));
  Object.assign(multer, { memoryStorage: jest.fn(() => ({})) });
  return { __esModule: true, default: multer };
});

import storage from '../storage.middleware';

describe('storage middleware cleanup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSave.mockResolvedValue(undefined);
    mockMakePublic.mockResolvedValue(undefined);
    mockDelete.mockResolvedValue(undefined);
  });

  const execute = async () => {
    const request = {} as Request;
    const response = {} as Response;
    const nextError = await new Promise<unknown>((resolve) => {
      storage({ name: 'file', makePublic: true })(
        request,
        response,
        (error?: unknown) => resolve(error),
      );
    });
    return { request, nextError };
  };

  it('attaches a completed upload result on success', async () => {
    const { request, nextError } = await execute();

    expect(nextError).toBeUndefined();
    expect(mockDelete).not.toHaveBeenCalled();
    expect(
      (request as Request & { storages: unknown[] }).storages,
    ).toHaveLength(1);
  });

  it('deletes the newly written object when ACL setup fails', async () => {
    mockMakePublic.mockRejectedValueOnce(new Error('permission denied'));

    const { nextError } = await execute();

    expect(nextError).toMatchObject({
      status: 500,
      message: expect.stringContaining('Failed to upload file'),
    });
    expect(mockSave).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it('attempts cleanup after an ambiguous cloud write failure', async () => {
    mockSave.mockRejectedValueOnce(new Error('connection reset'));

    const { nextError } = await execute();

    expect(nextError).toMatchObject({ status: 500 });
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });
});
