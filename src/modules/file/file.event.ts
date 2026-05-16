import { publish } from '../../events/event-publisher';

export const emitFileUploaded = (
  fileId: string,
  uploadedBy: string,
  fileType: string,
) =>
  publish('news.created', {
    fileId,
    uploadedBy,
    fileType,
    type: 'file_uploaded',
  });

export const emitFileDeleted = (fileId: string, deletedBy: string) =>
  publish('news.deleted', { fileId, deletedBy, type: 'file_deleted' });
