// Keep unit/route tests isolated from developer-specific .env integrations.
// These values are set before application modules load, so a local Redis,
// RabbitMQ, Kafka, or cluster configuration cannot create background work.
process.env.DOTENV_CONFIG_QUIET = 'true';
process.env.CLUSTER_ENABLED = 'false';
process.env.REDIS_ENABLED = 'false';
process.env.RABBITMQ_ENABLED = 'false';
process.env.KAFKA_ENABLED = 'false';

process.env.SESSION_SECRET = 'test-session-secret';
process.env.JWT_ACCESS_SECRET = 'test-jwt-access-secret';
process.env.JWT_REFRESH_SECRET = 'test-jwt-refresh-secret';
process.env.JWT_RESET_PASSWORD_SECRET = 'test-jwt-reset-password-secret';
process.env.JWT_EMAIL_VERIFICATION_SECRET =
  'test-jwt-email-verification-secret';
process.env.NODE_ENV = 'test';
