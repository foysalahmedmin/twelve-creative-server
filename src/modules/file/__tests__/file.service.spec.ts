/**
 * file.service.test.ts
 *
 * Unit tests for the Unified File Service layer.
 */

import httpStatus from 'http-status';

// ── Mock the entire repository before importing the service ──────────────────
jest.mock('@google-cloud/storage', () => ({
  Storage: jest.fn().mockImplementation(() => ({
    bucket: jest.fn().mockImplementation(() => ({
      file: jest.fn().mockImplementation(() => ({
        delete: jest.fn().mockResolvedValue(undefined),
      })),
    })),
  })),
}));
jest.mock('../file.repository');
jest.mock('../../../utils/delete-files', () => ({
  deleteFiles: jest.fn().mockResolvedValue(undefined),
}));

import { Storage } from '@google-cloud/storage';
import * as FileRepository from '../file.repository';
import * as FileService from '../file.service';
import { TFile } from '../file.type';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const mockLocalFile = (): TFile => ({
  _id: '507f1f77bcf86cd799439011',
  name: 'test-image.jpg',
  originalname: 'test-image.jpg',
  filename: 'test-image-123.jpg',
  url: 'http://localhost:5000/uploads/files/test-image-123.jpg',
  mimetype: 'image/jpeg',
  size: 1024,
  author: '507f1f77bcf86cd799439022' as any,
  provider: 'local',
  status: 'active',
  is_deleted: false,
  metadata: {
    path: 'uploads/files/test-image-123.jpg',
    extension: 'jpg',
    file_type: 'image',
  },
});

const mockCloudFile = (): TFile => ({
  _id: '507f1f77bcf86cd799439033',
  name: 'cloud-image.png',
  originalname: 'cloud-image.png',
  filename: 'cloud-image-456.png',
  url: 'https://storage.googleapis.com/test-bucket/cloud-image-456.png',
  mimetype: 'image/png',
  size: 2048,
  author: '507f1f77bcf86cd799439022' as any,
  provider: 'gcs',
  status: 'active',
  is_deleted: false,
  metadata: {
    bucket: 'test-bucket',
    extension: 'png',
    file_type: 'image',
  },
});

// ─── createLocalFile ─────────────────────────────────────────────────────────

describe('FileService.createLocalFile', () => {
  it('should create a local file record', async () => {
    const mockFileData = mockLocalFile();
    (FileRepository.create as jest.Mock).mockResolvedValue(mockFileData);

    const multerFile = {
      path: 'uploads\\files\\test-image-123.jpg',
      filename: 'test-image-123.jpg',
      originalname: 'test-image.jpg',
      mimetype: 'image/jpeg',
      size: 1024,
    } as Express.Multer.File;

    const result = await FileService.createLocalFile(
      { _id: '507f1f77bcf86cd799439022' } as any,
      multerFile,
      { name: 'Custom Name' },
      'http://localhost:5000',
    );

    expect(FileRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        url: 'http://localhost:5000/uploads/files/test-image-123.jpg',
      }),
    );
    expect(result.provider).toBe('local');
    expect(result.metadata?.path).toBe('uploads/files/test-image-123.jpg');
  });
});

// ─── createCloudFiles ────────────────────────────────────────────────────────

describe('FileService.createCloudFiles', () => {
  it('should create cloud file records', async () => {
    const mockFileData = mockCloudFile();
    (FileRepository.createMany as jest.Mock).mockResolvedValue([mockFileData]);

    const storageResults = [
      {
        filename: 'cloud-image-456.png',
        originalName: 'cloud-image.png',
        publicUrl:
          'https://storage.googleapis.com/test-bucket/cloud-image-456.png',
        mimetype: 'image/png',
        size: 2048,
        bucket: 'test-bucket',
      },
    ] as any;

    const result = await FileService.createCloudFiles(
      { _id: '507f1f77bcf86cd799439022' } as any,
      storageResults,
      {},
    );

    expect(FileRepository.createMany).toHaveBeenCalled();
    expect(result[0].provider).toBe('gcs');
    expect(result[0].metadata?.bucket).toBe('test-bucket');
  });
});

// ─── getFile ──────────────────────────────────────────────────────────────────

describe('FileService.getFile', () => {
  it('should return a file when found', async () => {
    const file = mockLocalFile();
    (FileRepository.findById as jest.Mock).mockResolvedValue(file);

    const result = await FileService.getFile('507f1f77bcf86cd799439011');
    expect(result).toEqual(file);
  });

  it('should throw 404 when file not found', async () => {
    (FileRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(FileService.getFile('non-existent')).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });
});

// ─── deleteFilePermanent ─────────────────────────────────────────────────────

describe('FileService.deleteFilePermanent', () => {
  it('should delete local file from disk', async () => {
    const file = mockLocalFile();
    (FileRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(file);
    const { deleteFiles } = jest.requireMock('../../../utils/delete-files');

    await FileService.deleteFilePermanent('id');

    expect(deleteFiles).toHaveBeenCalledWith(file.metadata?.path, undefined, {
      throwOnError: true,
    });
    expect(FileRepository.hardDeleteById).toHaveBeenCalledWith('id');
  });
});

describe('FileService complete contract', () => {
  const storageClient = (Storage as unknown as jest.Mock).mock.results[0].value;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects a missing local upload', async () => {
    await expect(
      FileService.createLocalFile(
        { _id: 'user-id' } as any,
        undefined as unknown as Express.Multer.File,
        {},
      ),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'No file uploaded',
    });
  });

  it('rejects a local upload with an unsupported MIME type', async () => {
    const { deleteFiles } = jest.requireMock('../../../utils/delete-files');
    const uploaded = {
      filename: 'payload.exe',
      originalname: 'payload.exe',
      path: 'uploads/payload.exe',
      mimetype: 'application/x-msdownload',
      size: 100,
    } as Express.Multer.File;

    await expect(
      FileService.createLocalFile({ _id: 'user-id' } as any, uploaded, {}),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: expect.stringContaining('application/x-msdownload'),
    });
    expect(FileRepository.create).not.toHaveBeenCalled();
    expect(deleteFiles).toHaveBeenCalledWith('uploads/payload.exe');
  });

  it('rejects a stored extension that does not match the MIME policy', async () => {
    const { deleteFiles } = jest.requireMock('../../../utils/delete-files');
    const uploaded = {
      filename: 'payload.html',
      originalname: 'photo.jpg',
      path: 'uploads/files/payload.html',
      mimetype: 'image/jpeg',
      size: 100,
    } as Express.Multer.File;

    await expect(
      FileService.createLocalFile({ _id: 'user-id' } as any, uploaded, {}),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'Stored file extension does not match its MIME type',
    });
    expect(FileRepository.create).not.toHaveBeenCalled();
    expect(deleteFiles).toHaveBeenCalledWith(uploaded.path);
  });

  it('removes the physical upload when database creation fails', async () => {
    const { deleteFiles } = jest.requireMock('../../../utils/delete-files');
    const databaseError = new Error('database unavailable');
    const uploaded = {
      filename: '550e8400-e29b-41d4-a716-446655440000.png',
      originalname: 'photo.png',
      path: 'uploads/files/550e8400-e29b-41d4-a716-446655440000.png',
      mimetype: 'image/png',
      size: 100,
    } as Express.Multer.File;
    (FileRepository.create as jest.Mock).mockRejectedValue(databaseError);

    await expect(
      FileService.createLocalFile({ _id: 'user-id' } as any, uploaded, {}),
    ).rejects.toBe(databaseError);
    expect(deleteFiles).toHaveBeenCalledWith(uploaded.path);
  });

  it('rejects an empty cloud upload result', async () => {
    await expect(
      FileService.createCloudFiles({ _id: 'user-id' } as any, [], {}),
    ).rejects.toMatchObject({
      status: httpStatus.BAD_REQUEST,
      message: 'No storage results found',
    });
  });

  it('rejects a cloud batch when any MIME type is unsupported', async () => {
    const results = [
      {
        filename: 'payload.exe',
        originalName: 'payload.exe',
        publicUrl: 'https://storage/payload.exe',
        mimetype: 'application/x-msdownload',
        size: 100,
        bucket: 'bucket',
      },
    ] as any;

    await expect(
      FileService.createCloudFiles({ _id: 'user-id' } as any, results, {}),
    ).rejects.toMatchObject({ status: httpStatus.BAD_REQUEST });
    expect(FileRepository.createMany).not.toHaveBeenCalled();
    expect(storageClient.bucket).toHaveBeenCalledWith('bucket');
    const bucket = storageClient.bucket.mock.results[0].value;
    expect(bucket.file).toHaveBeenCalledWith('payload.exe');
    expect(bucket.file.mock.results[0].value.delete).toHaveBeenCalledWith();
  });

  it('removes uploaded GCS objects when database creation fails', async () => {
    const databaseError = new Error('database unavailable');
    const results = [
      {
        filename: '550e8400-e29b-41d4-a716-446655440000.png',
        originalName: 'photo.png',
        publicUrl: 'https://storage/bucket/photo.png',
        mimetype: 'image/png',
        size: 100,
        bucket: 'bucket',
      },
    ] as any;
    (FileRepository.createMany as jest.Mock).mockRejectedValue(databaseError);

    await expect(
      FileService.createCloudFiles({ _id: 'user-id' } as any, results, {}),
    ).rejects.toBe(databaseError);

    expect(storageClient.bucket).toHaveBeenCalledWith('bucket');
    const bucket = storageClient.bucket.mock.results[0].value;
    expect(bucket.file).toHaveBeenCalledWith(results[0].filename);
    expect(bucket.file.mock.results[0].value.delete).toHaveBeenCalledWith();
  });

  it.each(['type', 'file_type'])(
    'maps the %s list filter to metadata.file_type',
    async (key) => {
      (FileRepository.findPaginated as jest.Mock).mockResolvedValue({
        data: [mockLocalFile()],
        meta: { total: 1, page: 1, limit: 10 },
      });
      const query: Record<string, unknown> = { [key]: 'image', page: 1 };

      await FileService.getFiles(query);

      expect(FileRepository.findPaginated).toHaveBeenCalledWith({
        'metadata.file_type': 'image',
        page: 1,
      });
    },
  );

  it('returns the authenticated user files with an author filter', async () => {
    (FileRepository.findPaginated as jest.Mock).mockResolvedValue({
      data: [mockLocalFile()],
      meta: { total: 1, page: 1, limit: 10 },
    });

    await FileService.getSelfFiles({ _id: 'user-id' } as any, {
      file_type: 'image',
    });

    expect(FileRepository.findPaginated).toHaveBeenCalledWith(
      { 'metadata.file_type': 'image' },
      { author: 'user-id' },
    );
  });

  it('updates metadata for an existing file', async () => {
    const updated = { ...mockLocalFile(), name: 'Updated name' };
    (FileRepository.findByIdLean as jest.Mock).mockResolvedValue(
      mockLocalFile(),
    );
    (FileRepository.updateById as jest.Mock).mockResolvedValue(updated);

    await expect(
      FileService.updateFile('file-id', { name: 'Updated name' }),
    ).resolves.toEqual(updated);
    expect(FileRepository.updateById).toHaveBeenCalledWith('file-id', {
      name: 'Updated name',
    });
  });

  it('does not update a missing file', async () => {
    (FileRepository.findByIdLean as jest.Mock).mockResolvedValue(null);

    await expect(
      FileService.updateFile('missing', { name: 'Updated name' }),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(FileRepository.updateById).not.toHaveBeenCalled();
  });

  it('bulk-updates found files and reports missing ids', async () => {
    (FileRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...mockLocalFile(), _id: { toString: () => 'found' } },
    ]);
    (FileRepository.updateManyByIds as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
    });

    await expect(
      FileService.updateFiles(['found', 'missing'], { status: 'inactive' }),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(FileRepository.updateManyByIds).toHaveBeenCalledWith(['found'], {
      status: 'inactive',
    });
  });

  it('soft-deletes an existing file', async () => {
    const softDelete = jest.fn().mockResolvedValue(undefined);
    (FileRepository.findById as jest.Mock).mockResolvedValue({ softDelete });

    await expect(FileService.deleteFile('file-id')).resolves.toBeUndefined();
    expect(softDelete).toHaveBeenCalledWith();
  });

  it('does not soft-delete a missing file', async () => {
    (FileRepository.findById as jest.Mock).mockResolvedValue(null);

    await expect(FileService.deleteFile('missing')).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
    });
  });

  it('bulk soft-deletes found files and reports missing ids', async () => {
    (FileRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...mockLocalFile(), _id: { toString: () => 'found' } },
    ]);

    await expect(
      FileService.deleteFiles(['found', 'missing']),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(FileRepository.softDeleteManyByIds).toHaveBeenCalledWith(['found']);
  });

  it('does not permanently delete a missing file', async () => {
    (FileRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(null);

    await expect(
      FileService.deleteFilePermanent('missing'),
    ).rejects.toMatchObject({ status: httpStatus.NOT_FOUND });
    expect(FileRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('deletes a GCS object before permanently deleting its record', async () => {
    const cloud = mockCloudFile();
    (FileRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(cloud);

    await FileService.deleteFilePermanent('cloud-id');

    expect(storageClient.bucket).toHaveBeenCalledWith('test-bucket');
    const bucket = storageClient.bucket.mock.results[0].value;
    expect(bucket.file).toHaveBeenCalledWith(cloud.filename);
    expect(bucket.file.mock.results[0].value.delete).toHaveBeenCalledWith();
    expect(FileRepository.hardDeleteById).toHaveBeenCalledWith('cloud-id');
  });

  it('retains the database record when GCS deletion fails', async () => {
    const cloud = mockCloudFile();
    const failedDelete = jest
      .fn()
      .mockRejectedValue(new Error('storage unavailable'));
    storageClient.bucket.mockReturnValueOnce({
      file: jest.fn(() => ({ delete: failedDelete })),
    });
    (FileRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(cloud);

    await expect(
      FileService.deleteFilePermanent('cloud-id'),
    ).rejects.toMatchObject({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: expect.stringContaining('record was retained'),
    });
    expect(FileRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('retains the database record when local physical deletion fails', async () => {
    const local = mockLocalFile();
    const { deleteFiles } = jest.requireMock('../../../utils/delete-files');
    deleteFiles.mockRejectedValueOnce(new Error('permission denied'));
    (FileRepository.findByIdWithDeleted as jest.Mock).mockResolvedValue(local);

    await expect(
      FileService.deleteFilePermanent('local-id'),
    ).rejects.toMatchObject({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: expect.stringContaining('record was retained'),
    });
    expect(FileRepository.hardDeleteById).not.toHaveBeenCalled();
  });

  it('bulk permanently deletes physical files and reports missing ids', async () => {
    const local = { ...mockLocalFile(), _id: { toString: () => 'local' } };
    const cloud = { ...mockCloudFile(), _id: { toString: () => 'cloud' } };
    (FileRepository.findManyDeletedByIds as jest.Mock).mockResolvedValue([
      local,
      cloud,
    ]);
    const { deleteFiles } = jest.requireMock('../../../utils/delete-files');

    await expect(
      FileService.deleteFilesPermanent(['local', 'cloud', 'missing']),
    ).resolves.toEqual({ count: 2, not_found_ids: ['missing'] });
    expect(deleteFiles).toHaveBeenCalledWith(local.metadata!.path, undefined, {
      throwOnError: true,
    });
    expect(FileRepository.hardDeleteById).toHaveBeenNthCalledWith(1, 'local');
    expect(FileRepository.hardDeleteById).toHaveBeenNthCalledWith(2, 'cloud');
    expect(FileRepository.hardDeleteManyByIds).not.toHaveBeenCalled();
  });

  it('restores one deleted file', async () => {
    (FileRepository.restoreById as jest.Mock).mockResolvedValue(
      mockLocalFile(),
    );

    await expect(FileService.restoreFile('file-id')).resolves.toEqual(
      mockLocalFile(),
    );
  });

  it('throws 404 when one file cannot be restored', async () => {
    (FileRepository.restoreById as jest.Mock).mockResolvedValue(null);

    await expect(FileService.restoreFile('missing')).rejects.toMatchObject({
      status: httpStatus.NOT_FOUND,
      message: 'File not found or not deleted',
    });
  });

  it('bulk-restores files and reports ids that remain missing', async () => {
    (FileRepository.restoreManyByIds as jest.Mock).mockResolvedValue({
      modifiedCount: 1,
    });
    (FileRepository.findManyByIds as jest.Mock).mockResolvedValue([
      { ...mockLocalFile(), _id: { toString: () => 'restored' } },
    ]);

    await expect(
      FileService.restoreFiles(['restored', 'missing']),
    ).resolves.toEqual({ count: 1, not_found_ids: ['missing'] });
    expect(FileRepository.restoreManyByIds).toHaveBeenCalledWith([
      'restored',
      'missing',
    ]);
  });
});
