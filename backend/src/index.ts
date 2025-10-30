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
app.use(helmet());
app.use(cors({
  origin: "http://localhost:8081",
  credentials: true,
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use(requestLogger);

// Rate limiting
app.use(generalRateLimit);

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Auth routes
apiRouter.post('/auth/register', authRateLimit, AuthController.register);//verified
apiRouter.post('/auth/login', authRateLimit, AuthController.login);//verified
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

// Mount API routes
app.use('/api', apiRouter);

// 404 handler
app.use(notFound);

// Error handling middleware
app.use(handleUploadError);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📡 Socket.IO enabled`);
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
