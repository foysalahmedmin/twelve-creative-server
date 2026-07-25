/**
 * Public uploads are served directly by Nginx, which determines Content-Type
 * from the stored filename. Never preserve a client-controlled extension:
 * each accepted MIME type has exactly one server-controlled extension.
 */
export const LOCAL_UPLOAD_MIME_TO_EXTENSION = Object.freeze({
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/ogg': 'ogv',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/wav': 'wav',
  'application/pdf': 'pdf',
  'application/msword': 'doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
    'docx',
  'text/plain': 'txt',
} as const);

export type TSupportedLocalUploadMime =
  keyof typeof LOCAL_UPLOAD_MIME_TO_EXTENSION;

export const SUPPORTED_LOCAL_UPLOAD_MIME_TYPES: readonly string[] =
  Object.freeze(Object.keys(LOCAL_UPLOAD_MIME_TO_EXTENSION));

export const getCanonicalUploadExtension = (
  mimeType: string,
): string | undefined =>
  LOCAL_UPLOAD_MIME_TO_EXTENSION[mimeType as TSupportedLocalUploadMime];

export const isSupportedLocalUploadMime = (
  mimeType: string,
): mimeType is TSupportedLocalUploadMime =>
  getCanonicalUploadExtension(mimeType) !== undefined;
