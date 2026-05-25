module.exports = {
  apps: [
    {
      name: 'tc-backend',
      script: 'node',
      args: 'dist/index.js',
      cwd: '/var/www/websites/twelve-creative-backend',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        PORT: 5003,
      },
      error_file: '/root/.pm2/logs/tc-backend-error.log',
      out_file: '/root/.pm2/logs/tc-backend-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
