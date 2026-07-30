import {
  getCanonicalUploadExtension,
  isSupportedLocalUploadMime,
  LOCAL_UPLOAD_MIME_TO_EXTENSION,
  SUPPORTED_LOCAL_UPLOAD_MIME_TYPES,
} from '../upload-policy';

describe('upload policy', () => {
  it.each([
    ['image/jpeg', 'jpg'],
    ['image/jpg', 'jpg'],
    ['image/png', 'png'],
    ['image/gif', 'gif'],
    ['image/webp', 'webp'],
    ['image/svg+xml', 'svg'],
    ['video/mp4', 'mp4'],
    ['video/webm', 'webm'],
    ['video/ogg', 'ogv'],
    ['audio/mpeg', 'mp3'],
    ['audio/ogg', 'ogg'],
    ['audio/wav', 'wav'],
    ['application/pdf', 'pdf'],
    ['application/msword', 'doc'],
    [
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'docx',
    ],
    ['text/plain', 'txt'],
  ])('maps %s to the canonical .%s extension', (mimeType, extension) => {
    expect(getCanonicalUploadExtension(mimeType)).toBe(extension);
    expect(isSupportedLocalUploadMime(mimeType)).toBe(true);
  });

  it('keeps the exported allowlist synchronized with the mapping', () => {
    expect(SUPPORTED_LOCAL_UPLOAD_MIME_TYPES).toEqual(
      Object.keys(LOCAL_UPLOAD_MIME_TO_EXTENSION),
    );
  });

  it.each(['text/html', 'application/javascript', 'application/x-msdownload'])(
    'rejects executable or unapproved MIME type %s',
    (mimeType) => {
      expect(getCanonicalUploadExtension(mimeType)).toBeUndefined();
      expect(isSupportedLocalUploadMime(mimeType)).toBe(false);
    },
  );
});
