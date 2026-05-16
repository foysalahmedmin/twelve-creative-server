export const NEWS_STATUS = {
  DRAFT: 'draft',
  PENDING: 'pending',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const;

export const CONTENT_TYPES = {
  ARTICLE: 'article',
  VIDEO: 'video',
  PODCAST: 'podcast',
  LIVE_BLOG: 'live-blog',
  PHOTO_ESSAY: 'photo-essay',
} as const;

export const FILE_PROVIDERS = {
  LOCAL: 'local',
  GCS: 'gcs',
} as const;

export const REACTION_TYPES = {
  LIKE: 'like',
  DISLIKE: 'dislike',
} as const;

export const WORKFLOW_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
} as const;

export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const CACHE_TTL = {
  SHORT: 300, // 5 minutes
  MEDIUM: 1800, // 30 minutes
  LONG: 86400, // 24 hours
} as const;

export const AUTH_SOURCES = {
  EMAIL: 'email',
  GOOGLE: 'google',
} as const;
