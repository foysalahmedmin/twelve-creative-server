export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  FILE = 'file',
  PDF = 'pdf',
  DOC = 'doc',
  TXT = 'txt',
}

export enum FileStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  ARCHIVED = 'archived',
}

export enum FileProvider {
  LOCAL = 'local',
  GCS = 'gcs',
}
