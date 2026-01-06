module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'pnpm',
      args: 'start',
      interpreter: 'none',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    },
    {
      name: 'backend',
      cwd: './backend',
      script: 'node',
      args: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        MONGODB_URI: 'mongodb://localhost:27017/emis',
        JWT_ACCESS_TOKEN_SECRET: 'your-access-token-secret-key-change-this-in-production',
        JWT_REFRESH_TOKEN_SECRET: 'your-refresh-token-secret-key-change-this-in-production',
        JWT_ACCESS_TOKEN_EXPIRATION_MS: '3600000',
        JWT_REFRESH_TOKEN_EXPIRATION_MS: '86400000',
        GOOGLE_AUTH_CLIENT_ID: 'your-google-client-id',
        GOOGLE_AUTH_CLIENT_SECRET: 'your-google-client-secret',
        GOOGLE_AUTH_REDIRECT_URI: 'http://localhost:3001/api/auth/google/callback',
        AUTH_UI_REDIRECT: 'http://localhost:3000'
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s'
    }
  ]
};
