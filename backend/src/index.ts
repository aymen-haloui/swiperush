import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import dotenv from 'dotenv';
import path from 'path';

// Import middleware
import { 
  generalRateLimit, 
  authRateLimit, 
  submissionRateLimit,
  errorHandler, 
  notFound, 
  corsOptions,
  requestLogger 
} from './middleware';
import { handleUploadError } from './middleware/upload';
import { uploadSingle } from './middleware/upload';

// Import controllers
import { AuthController } from './controllers/authController';
import { ChallengeController } from './controllers/challengeController';
import { LeaderboardController } from './controllers/leaderboardController';
import { CategoryController } from './controllers/categoryController';
import { LevelController } from './controllers/levelController';

// Import middleware
import { authenticateToken, requireAdmin, optionalAuth } from './middleware/auth';

// Import socket service
import { initializeSocketService } from './services/socketService';
import logger from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Initialize Socket.IO
const socketService = initializeSocketService(server);

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
}));

// CORS configuration - allow multiple origins
const defaultOrigins = [
  'http://localhost:8081',
  'http://localhost:5173',
  'https://challengequest-frontend.vercel.app',
  'https://swiperush.vercel.app'
];

const envOrigins = process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',').map((s) => s.trim()) : [];
const allowedOrigins = Array.from(new Set([...envOrigins, ...defaultOrigins])).filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);

// Rate limiting
app.use(generalRateLimit);

// Static files for uploads with CORS headers
app.use('/uploads', (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
}, express.static(path.join(__dirname, '../uploads')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    connectedUsers: socketService.getConnectedUsersCount()
  });
});

// Database health check endpoint
app.get('/health/db', async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test database connection
    const connectionTest = await prisma.$queryRaw`SELECT 1 as test`;
  logger.debug('Database connection test:', connectionTest);
    
    // Check if tables exist
    let tablesExist = false;
    let userCount = 0;
    let sampleUsers: any[] = [];
    
    try {
      // Count users
      userCount = await prisma.user.count();
      
      // Get sample users (without passwords)
      sampleUsers = await prisma.user.findMany({
        take: 5,
        select: {
          id: true,
          email: true,
          username: true,
          isActive: true,
          isAdmin: true
        }
      });
      
      tablesExist = true;
    } catch (tableError: any) {
      console.error('Table access error:', tableError);
      // Tables might not exist - migrations might not have run
    }
    
    // Get DATABASE_URL info (without password)
    const dbUrl = process.env.DATABASE_URL || 'Not set';
    const dbUrlInfo = dbUrl.includes('@') 
      ? dbUrl.split('@')[1]?.split('/')[0] || 'Unknown host'
      : 'Invalid format';
    
    await prisma.$disconnect();
    
    res.json({
      status: 'OK',
      database: 'Connected',
      databaseHost: dbUrlInfo,
      tablesExist,
      userCount,
      sampleUsers,
      hasUsers: userCount > 0,
      message: !tablesExist 
        ? 'Database connected but tables may not exist. Run migrations: npx prisma migrate deploy'
        : userCount === 0 
          ? 'Database connected but no users found. Register a user at /api/auth/register or run seed script.'
          : 'Database is accessible and has users'
    });
  } catch (error: any) {
  logger.error('Database health check failed:', error);
    const dbUrl = process.env.DATABASE_URL || 'Not set';
    const dbUrlInfo = dbUrl !== 'Not set' && dbUrl.includes('@')
      ? dbUrl.split('@')[1]?.split('/')[0] || 'Unknown host'
      : 'Not configured';
    
    res.status(500).json({
      status: 'ERROR',
      database: 'Connection failed',
      databaseHost: dbUrlInfo,
      error: error.message,
      errorCode: error.code,
      errorName: error.name,
      message: 'Database connection failed. Check DATABASE_URL environment variable in Render dashboard.',
      troubleshooting: [
        '1. Verify DATABASE_URL is set in Render environment variables',
        '2. Check if Neon database is active and accessible',
        '3. Ensure DATABASE_URL format is: postgresql://user:password@host:port/database',
        '4. Check Neon dashboard for connection issues',
        '5. Verify network connectivity from Render to Neon'
      ]
    });
  }
});

// API Routes
const apiRouter = express.Router();

// API root endpoint - returns API information
apiRouter.get('/', (req, res) => {
  res.json({
    name: 'ChallengeQuest API',
    version: '1.0.0',
    status: 'active',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
        updateProfile: 'PUT /api/auth/profile',
        changePassword: 'PUT /api/auth/change-password',
        refreshToken: 'POST /api/auth/refresh'
      },
      challenges: {
        list: 'GET /api/challenges',
        getById: 'GET /api/challenges/:id',
        create: 'POST /api/challenges',
        update: 'PUT /api/challenges/:id',
        delete: 'DELETE /api/challenges/:id',
        join: 'POST /api/challenges/join',
        submitStage: 'POST /api/challenges/submit-stage',
        myChallenges: 'GET /api/challenges/user/my-challenges'
      },
      leaderboard: {
        get: 'GET /api/leaderboard',
        stats: 'GET /api/leaderboard/stats',
        userRank: 'GET /api/leaderboard/user-rank'
      },
      categories: {
        list: 'GET /api/categories',
        getById: 'GET /api/categories/:id'
      },
      levels: {
        list: 'GET /api/levels',
        getById: 'GET /api/levels/:id'
      },
      health: {
        basic: 'GET /health',
        database: 'GET /health/db'
      }
    }
  });
});

// Auth routes (rate limiting removed for testing)
apiRouter.post('/auth/register', AuthController.register);//verified
apiRouter.post('/auth/login', AuthController.login);//verified
apiRouter.get('/auth/profile', authenticateToken, AuthController.getProfile);//verified
apiRouter.put('/auth/profile', authenticateToken, AuthController.updateProfile);//verified
apiRouter.put('/auth/change-password', authenticateToken, AuthController.changePassword);//verified
apiRouter.post('/auth/refresh', authenticateToken, AuthController.refreshToken);//verified

// Challenge routes
apiRouter.get('/challenges', optionalAuth, ChallengeController.getChallenges);//verified
apiRouter.get('/challenges/:id', optionalAuth, ChallengeController.getChallengeById);//verified
apiRouter.post('/challenges', authenticateToken, requireAdmin, ChallengeController.createChallenge);//verified
apiRouter.put('/challenges/:id', authenticateToken, requireAdmin, ChallengeController.updateChallenge);//verified
apiRouter.delete('/challenges/:id', authenticateToken, requireAdmin, ChallengeController.deleteChallenge);//verified
// Upload endpoints for challenge images and stage QR codes
apiRouter.post('/challenges/:id/image', authenticateToken, requireAdmin, uploadSingle('file'), ChallengeController.uploadChallengeImage);
apiRouter.post('/challenges/:id/stages/:stageId/qr', authenticateToken, requireAdmin, uploadSingle('file'), ChallengeController.uploadStageQr);
apiRouter.post('/challenges/join', authenticateToken, ChallengeController.joinChallenge);
apiRouter.post('/challenges/submit-stage', authenticateToken, submissionRateLimit, ChallengeController.submitStage);
apiRouter.get('/challenges/user/my-challenges', authenticateToken, ChallengeController.getUserChallenges);//should craate a page in the frontend

// Leaderboard routes
apiRouter.get('/leaderboard', LeaderboardController.getLeaderboard);//verified
apiRouter.get('/leaderboard/stats', LeaderboardController.getStats);
apiRouter.get('/leaderboard/user-rank', authenticateToken, LeaderboardController.getUserRank);
apiRouter.post('/leaderboard/update-ranks', authenticateToken, requireAdmin, LeaderboardController.updateRanks);

// Category routes
apiRouter.get('/categories', CategoryController.getCategories);
apiRouter.get('/categories/:id', CategoryController.getCategoryById);
apiRouter.post('/categories', authenticateToken, requireAdmin, CategoryController.createCategory);
apiRouter.put('/categories/:id', authenticateToken, requireAdmin, CategoryController.updateCategory);
apiRouter.delete('/categories/:id', authenticateToken, requireAdmin, CategoryController.deleteCategory);
apiRouter.patch('/categories/:id/toggle-status', authenticateToken, requireAdmin, CategoryController.toggleCategoryStatus);

// Level routes
apiRouter.get('/levels', LevelController.getLevels);
apiRouter.get('/levels/:id', LevelController.getLevelById);
apiRouter.post('/levels', authenticateToken, requireAdmin, LevelController.createLevel);
apiRouter.put('/levels/:id', authenticateToken, requireAdmin, LevelController.updateLevel);
apiRouter.delete('/levels/:id', authenticateToken, requireAdmin, LevelController.deleteLevel);
apiRouter.post('/levels/update-all-users', authenticateToken, requireAdmin, LevelController.updateAllUserLevels);

// User routes (admin only)
import { UserController } from './controllers/userController';
apiRouter.get('/users', authenticateToken, requireAdmin, UserController.getAllUsers);
apiRouter.get('/users/:id', authenticateToken, requireAdmin, UserController.getUserById);
apiRouter.patch('/users/:id/toggle-status', authenticateToken, requireAdmin, UserController.toggleUserStatus);

// Mount API routes
app.use('/api', apiRouter);

// Multer upload error handler
app.use(handleUploadError);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(handleUploadError);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  logger.error('❌ ERROR: JWT_SECRET environment variable is not set');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  logger.error('❌ ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
  logger.info(`📡 Socket.IO enabled`);
}).on('error', (error: any) => {
  logger.error('❌ Failed to start server:', error);
  if (error.code === 'EADDRINUSE') {
    logger.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
  });
});

export { app, server, socketService };
