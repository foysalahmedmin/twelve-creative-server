export const CMS_VIDEO_SOURCES = ['youtube', 'url', 'upload'] as const;

export type TCmsVideoSource = (typeof CMS_VIDEO_SOURCES)[number];

export type TCmsVideoRef = {
  source: TCmsVideoSource;
  value: string;
};

export type TCmsImageMedia = {
  type: 'image';
  image: string;
};

export type TCmsVideoMedia = {
  type: 'video';
  video: TCmsVideoRef;
  thumbnail?: string;
};

/**
 * Explicit media union shared by CMS modules. A record can never ambiguously
 * contain both an image and a video; the admin chooses one presentation type.
 */
export type TCmsMedia = TCmsImageMedia | TCmsVideoMedia;
