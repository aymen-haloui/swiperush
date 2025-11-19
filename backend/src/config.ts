import path from 'path';

const NODE_ENV = (process.env.NODE_ENV || 'development').trim();
const isProd = NODE_ENV === 'production';

function required(name: string, value: any) {
  if (isProd && (value === undefined || value === null || value === '')) {
    throw new Error(`Missing required environment variable in production: ${name}`);
  }
  return value;
}

export const CONFIG = {
  NODE_ENV,
  isProd,
  PORT: process.env.PORT ? Number(process.env.PORT) : 5000,
  DATABASE_URL: required('DATABASE_URL', process.env.DATABASE_URL) || process.env.DATABASE_URL || '',
  JWT_SECRET: required('JWT_SECRET', process.env.JWT_SECRET) || process.env.JWT_SECRET || '',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  BCRYPT_ROUNDS: process.env.BCRYPT_ROUNDS ? Number(process.env.BCRYPT_ROUNDS) : 12,
  UPLOAD_DIR: process.env.UPLOAD_DIR || path.join(process.cwd(), 'backend', 'uploads'),
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE ? Number(process.env.MAX_FILE_SIZE) : 5 * 1024 * 1024,
  CORS_ORIGINS: (process.env.CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean),
  SOCKET_CORS_ORIGINS: (process.env.SOCKET_CORS_ORIGIN || '').split(',').map(s => s.trim()).filter(Boolean),
  RATE_LIMIT_WINDOW_MS: process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : 15 * 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: process.env.RATE_LIMIT_MAX_REQUESTS ? Number(process.env.RATE_LIMIT_MAX_REQUESTS) : 500,
};

export default CONFIG;
