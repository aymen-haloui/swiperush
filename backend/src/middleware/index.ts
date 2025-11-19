import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import rateLimit from 'express-rate-limit';
import { CONFIG } from '../config';

// Rate limiting middleware (auto-adjusts based on environment)
export const createRateLimit = (windowMs: number, max: number, message?: string) => {
  const isDev = !CONFIG.isProd;

  return rateLimit({
    windowMs,
    max: isDev ? max * 100 : max, // much higher limit in dev mode
    message: message || 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
};


// General rate limiting (relaxed for testing)
export const generalRateLimit = createRateLimit(
  CONFIG.RATE_LIMIT_WINDOW_MS,
  CONFIG.RATE_LIMIT_MAX_REQUESTS
);

// Relaxed rate limiting for auth endpoints (for testing)
export const authRateLimit = createRateLimit(
  15 * 60 * 1000, // 15 minutes
  500, // 500 attempts per window (relaxed for testing)
  'Too many authentication attempts, please try again later.'
);

// Challenge submission rate limiting
export const submissionRateLimit = createRateLimit(
  60 * 1000, // 1 minute
  10, // 10 submissions per minute
  'Too many submissions, please slow down.'
);

// Error handling middleware
export const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', error);

  if (error.name === 'ValidationError') {
    res.status(400).json({
      error: 'Validation Error',
      details: error.message
    });
    return;
  }

  if (error.name === 'UnauthorizedError') {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Invalid credentials'
    });
    return;
  }

  // Prisma database connection errors
  if (error.code === 'P1001' || error.code === 'P1002' || error.code === 'P1003' || 
      error.code === 'P1017' || error.message?.includes('Can\'t reach database') ||
      error.message?.includes('database server') || error.message?.includes('connection')) {
    logger.error('Database connection error:', error);
    res.status(503).json({
      error: 'Service Unavailable',
      message: 'Database connection failed. Please check the database configuration.',
      details: !CONFIG.isProd ? error.message : undefined
    });
    return;
  }

  if (error.code === 'P2002') {
    res.status(409).json({
      error: 'Conflict',
      message: 'Resource already exists'
    });
    return;
  }

  res.status(500).json({
    error: 'Internal Server Error',
    message: !CONFIG.isProd ? error.message : 'Something went wrong'
  });
};

// Not found middleware
export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`
  });
};

// CORS middleware
export const corsOptions = {
  origin: CONFIG.CORS_ORIGINS.length > 0 ? CONFIG.CORS_ORIGINS : ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200
};

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
  logger.info(`${req.method} ${req.originalUrl} - ${res.statusCode} - ${duration}ms`);
  });
  
  next();
};
