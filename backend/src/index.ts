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
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:5173',
  'https://challengequest-frontend.vercel.app',
  process.env.CORS_ORIGIN
].filter(Boolean); // Remove any undefined values

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

// API Routes
const apiRouter = express.Router();

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

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(handleUploadError);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;

// Validate required environment variables
if (!process.env.JWT_SECRET) {
  console.error('❌ ERROR: JWT_SECRET environment variable is not set');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('❌ ERROR: DATABASE_URL environment variable is not set');
  process.exit(1);
}

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Socket.IO enabled`);
}).on('error', (error: any) => {
  console.error('❌ Failed to start server:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
  });
});

export { app, server, socketService };
