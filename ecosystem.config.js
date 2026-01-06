module.exports = {
  apps: [
    {
      name: 'frontend',
      cwd: './frontend',
      script: 'npm',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      }
    },
    {
      name: 'backend',
      cwd: './backend',
      script: './dist/main.js',
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
        GOOGLE_AUTH_REDIRECT_URI: 'http://ect.cognitron.co.ke/auth/google/callback',
        AUTH_UI_REDIRECT: 'http://ect.cognitron.co.ke'
      }
    }
  ]
};
