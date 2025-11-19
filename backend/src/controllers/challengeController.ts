import { Request, Response } from 'express';
import { ProgressStatus } from '@prisma/client';
import { ChallengeService } from '../services/challengeService';
import { AuthRequest } from '../middleware/auth';
import logger from '../utils/logger';

export class ChallengeController {
  // Create challenge (admin only)
  static async createChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const challenge = await ChallengeService.createChallenge(req.body);

      res.status(201).json({
        success: true,
        message: 'Challenge created successfully',
        data: challenge,
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in createChallenge:', message);
      res.status(400).json({ success: false, error: message });
    }
  }

  // Get all challenges
  static async getChallenges(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        category: req.query.category as string,
        difficulty: req.query.difficulty as string,
        status: req.query.status as 'active' | 'upcoming' | 'completed' | 'all',
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const result = await ChallengeService.getChallenges(filters);

      res.json({ success: true, data: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in getChallenges:', message);
      res.status(400).json({ success: false, error: message });
    }
  }

  // Get challenge by ID
  static async getChallengeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as AuthRequest).user?.id;

      const challenge = await ChallengeService.getChallengeById(id, userId);

      res.json({ success: true, data: challenge });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in getChallengeById:', message);
      res.status(404).json({ success: false, error: message });
    }
  }

  // Join challenge
  static async joinChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { challengeId } = req.body;
      const userId = req.user!.id;

      const progress = await ChallengeService.joinChallenge(userId, challengeId);

      res.json({ success: true, message: 'Successfully joined challenge', data: progress });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in joinChallenge:', message);
      res.status(400).json({ success: false, error: message });
    }
  }

  // Submit stage completion
  static async submitStage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;

      const stageProgress = await ChallengeService.submitStage(userId, req.body);

      res.json({ success: true, message: 'Stage completed successfully', data: stageProgress });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in submitStage:', message);
      res.status(400).json({ success: false, error: message });
    }
  }

  // Get user's challenges
  static async getUserChallenges(req: AuthRequest, res: Response): Promise<void> {
    try {
      logger.debug('📥 [getUserChallenges] Incoming request...');
      logger.debug('🔐 Authenticated user payload:', req.user);

      const userId = req.user?.id;
      if (!userId) {
        logger.warn('❌ No userId found in request!');
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }

      const statusParam = (req.query.status as string | undefined)?.toUpperCase();
      const isValidStatus = statusParam && (Object.values(ProgressStatus) as string[]).includes(statusParam);
      const status = isValidStatus ? (statusParam as ProgressStatus) : undefined;

      logger.debug('👤 userId:', userId);
      logger.debug('📊 status filter:', status || 'none');

      logger.debug('⚙️ Calling ChallengeService.getUserChallenges...');
      const challenges = await ChallengeService.getUserChallenges(userId, status);

      logger.info(`✅ Found ${challenges.length} challenge progress record(s)`);
      if (challenges.length > 0) {
        logger.debug('🧩 First challenge result:', JSON.stringify(challenges[0], null, 2));
      } else {
        logger.info('⚠️ No challenges found for this user or filter');
      }

      res.json({ success: true, data: challenges });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('💥 Error in getUserChallenges:', message);
      res.status(400).json({ success: false, error: message });
    }
  }

  // Update challenge (admin only)
  static async updateChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updatedData = req.body;

      const updatedChallenge = await ChallengeService.updateChallenge(id, updatedData);

      res.json({ success: true, message: 'Challenge updated successfully', data: updatedChallenge });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in updateChallenge:', message);
      res.status(400).json({ success: false, error: message });
    }
  }

  // Upload or replace challenge image (admin only)
  static async uploadChallengeImage(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const result = await ChallengeService.uploadChallengeImage(id, file);

      res.json({ success: true, message: 'Image uploaded', url: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in uploadChallengeImage:', message);
      res.status(400).json({ success: false, error: message });
    }
  }

  // Upload or replace stage QR image (admin only)
  static async uploadStageQr(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id, stageId } = req.params;
      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ success: false, error: 'No file uploaded' });
        return;
      }

      const result = await ChallengeService.uploadStageQr(id, stageId, file);

      res.json({ success: true, message: 'QR uploaded', url: result });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in uploadStageQr:', message);
      res.status(400).json({ success: false, error: message });
    }
  }

  // Delete challenge (admin only)
  static async deleteChallenge(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const result = await ChallengeService.deleteChallenge(id);

      res.json({ success: true, message: result.message });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      logger.error('Error in deleteChallenge:', message);
      res.status(400).json({ success: false, error: message });
    }
  }
}
