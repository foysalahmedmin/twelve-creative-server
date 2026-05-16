export enum AuthSource {
  EMAIL = 'email',
  GOOGLE = 'google',
}

export enum TokenType {
  ACCESS = 'access',
  REFRESH = 'refresh',
  RESET_PASSWORD = 'reset_password',
  EMAIL_VERIFICATION = 'email_verification',
}

export enum AuthEvent {
  SIGNED_IN = 'auth.signed_in',
  SIGNED_OUT = 'auth.signed_out',
  SIGNED_UP = 'auth.signed_up',
  PASSWORD_CHANGED = 'auth.password_changed',
  PASSWORD_RESET_REQUESTED = 'auth.password_reset_requested',
  EMAIL_VERIFIED = 'auth.email_verified',
  ACCOUNT_LOCKED = 'auth.account_locked',
}
