import { Request, Response } from 'express';
import logger from '../utils/logger';
import { AuthService, registerSchema, loginSchema, changePasswordSchema } from '../services/authService';
import { AuthRequest } from '../middleware/auth';

export class AuthController {
  // Register new user
  static async register(req: Request, res: Response): Promise<void> {
  try {
    // Validate and register user
    const result = await AuthService.register(req.body);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: result.user,
        token: result.token,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const error = err as any;
    
    // Check for database connection errors
    if (error?.code === 'P1001' || error?.code === 'P1002' || error?.code === 'P1003' || 
        error?.code === 'P1017' || message?.includes('Can\'t reach database') ||
        message?.includes('database server') || message?.includes('connection')) {
      logger.error('Database connection error during registration:', error);
      res.status(503).json({
        success: false,
        error: 'Database connection failed. Please check the database configuration.',
        message: process.env.NODE_ENV === 'development' ? message : 'Service temporarily unavailable'
      });
      return;
    }
    
    res.status(400).json({
      success: false,
      error: message,
    });
  }
}


  // Login user
  static async login(req: Request, res: Response): Promise<void> {
    try {
  logger.debug(`Login attempt - Request body:`, JSON.stringify(req.body));
  logger.debug(`Login attempt for email: ${req.body?.email || 'unknown'}`);
      
      // Validate request body
      if (!req.body || !req.body.email || !req.body.password) {
        console.error('Login failed: Missing email or password in request body');
        res.status(400).json({
          success: false,
          error: 'Email and password are required'
        });
        return;
      }
      
      const result = await AuthService.login(req.body);
      
  logger.info(`Login successful for user: ${result.user.email}`);
      res.json({
        success: true,
        message: 'Login successful',
        data: result
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      const error = err as any;
      
      // Check for database connection errors
      if (error?.code === 'P1001' || error?.code === 'P1002' || error?.code === 'P1003' || 
          error?.code === 'P1017' || message?.includes('Can\'t reach database') ||
          message?.includes('database server') || message?.includes('connection')) {
        logger.error('Database connection error during login:', error);
        res.status(503).json({
          success: false,
          error: 'Database connection failed. Please check the database configuration.',
          message: process.env.NODE_ENV === 'development' ? message : 'Service temporarily unavailable'
        });
        return;
      }
      
      console.error('Login error:', message, err);
      // Only return 401 for actual authentication failures
      res.status(401).json({
        success: false,
        error: message
      });
    }
  }

  // Get current user profile
  static async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await AuthService.getUserProfile(req.user!.id);
      
      res.json({
        success: true,
        data: user
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(404).json({
        success: false,
        error: message
      });
    }
  }

  // Update user profile
  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await AuthService.updateProfile(req.user!.id, req.body);
      
      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: user
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: message
      });
    }
  }

  // Change password
  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await AuthService.changePassword(req.user!.id, req.body);
      
      res.json({
        success: true,
        message: result.message
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(400).json({
        success: false,
        error: message
      });
    }
  }

  // Refresh token (optional - for implementing refresh token logic)
  static async refreshToken(req: AuthRequest, res: Response): Promise<void> {
    try {
      const newToken = AuthService.generateToken(req.user!.id);
      
      res.json({
        success: true,
        data: { token: newToken }
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      res.status(401).json({
        success: false,
        error: message
      });
    }
  }
}
