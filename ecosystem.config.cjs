/* global module, __dirname */

module.exports = {
  apps: [
    {
      name: 'tc-backend',
      script: 'dist/index.js',
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      watch: false,
      // /api/file/cloud (storage.middleware.ts) uses multer.memoryStorage(),
      // buffering the whole upload before it reaches GCS. Must clear
      // baseline usage plus a full MAX_UPLOAD_BYTES (1G) file, or PM2 kills
      // the process mid-upload.
      max_memory_restart: '2048M',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: 5003,
      },
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
