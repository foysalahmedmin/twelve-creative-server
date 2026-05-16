export enum NotificationStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  WEB = 'web',
  PUSH = 'push',
  EMAIL = 'email',
}

export enum NotificationType {
  NEWS_REQUEST = 'news-request',
  NEWS_REQUEST_RESPONSE = 'news-request-response',
  NEWS_HEADLINE_REQUEST = 'news-headline-request',
  NEWS_HEADLINE_REQUEST_RESPONSE = 'news-headline-request-response',
  NEWS_BREAK_REQUEST = 'news-break-request',
  NEWS_BREAK_REQUEST_RESPONSE = 'news-break-request-response',
  REACTION = 'reaction',
  COMMENT = 'comment',
  REPLY = 'reply',
}
