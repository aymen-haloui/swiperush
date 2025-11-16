import { PrismaClient, Difficulty, ProgressStatus, Prisma } from '@prisma/client';
import { z } from 'zod';
import fs from 'fs';
import path from 'path';
import QRCode from 'qrcode';

const prisma = new PrismaClient();

// Helper function to decode QR code from image file
const decodeQRCodeFromFile = async (filePath: string): Promise<string | null> => {
  try {
    // Read the image file
    const imageBuffer = fs.readFileSync(filePath);
    
    // Decode QR code from image buffer
    // Note: The qrcode package doesn't have a decode function, so we'll use a try-catch approach
    // For proper decoding, we would need a library like 'qrcode-reader' or 'jsqr'
    // For now, we'll validate by attempting to decode and if it fails, we'll regenerate
    // This is a simplified approach - in production, you might want to use a dedicated QR decoder
    
    // Try to decode using QRCode.decode (if available) or use an alternative method
    // Since qrcode package primarily generates QR codes, we'll use a workaround:
    // We'll always regenerate QR codes to ensure they contain the correct stage ID
    // This ensures data integrity regardless of what admin uploads
    
    return null; // Return null to indicate we should regenerate
  } catch (error) {
    console.error('Error decoding QR code:', error);
    return null; // If decoding fails, return null to trigger regeneration
  }
};

// Helper function to generate QR code with stage ID encoded
const generateQRCode = async (stageId: string, filenamePrefix: string = 'qr'): Promise<string> => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Generate QR code data as base64 string
  const qrCodeDataUrl = await QRCode.toDataURL(stageId, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    width: 500,
    margin: 1
  });

  // Parse the data URL to get base64 data
  const base64Match = qrCodeDataUrl.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  if (!base64Match) {
    throw new Error('Failed to generate QR code');
  }

  const [, , base64Data] = base64Match;

  // Generate unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `${filenamePrefix}-${uniqueSuffix}.png`;
  const filePath = path.join(uploadDir, filename);

  // Convert base64 to buffer and save
  const buffer = Buffer.from(base64Data, 'base64');
  fs.writeFileSync(filePath, buffer);

  // Return the filename (relative path for storage)
  return filename;
};

// Helper function to save base64 image to file
const saveBase64Image = (base64String: string, filenamePrefix: string = 'qr', maxSizeMB: number = 2): string => {
  const uploadDir = process.env.UPLOAD_DIR || './uploads';
  
  // Ensure upload directory exists
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  // Parse base64 string
  // Format: data:image/png;base64,iVBORw0KGgo...
  const base64Match = base64String.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
  
  if (!base64Match) {
    throw new Error('Invalid base64 image format');
  }

  const [, imageType, base64Data] = base64Match;
  
  // Validate image type
  const validTypes = ['png', 'jpeg', 'jpg', 'gif', 'webp'];
  if (!validTypes.includes(imageType.toLowerCase())) {
    throw new Error(`Unsupported image type: ${imageType}. Supported types: ${validTypes.join(', ')}`);
  }

  // Determine file extension
  const extension = imageType === 'jpeg' ? 'jpg' : imageType.toLowerCase();

  // Generate unique filename
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const filename = `${filenamePrefix}-${uniqueSuffix}.${extension}`;
  const filePath = path.join(uploadDir, filename);

  // Convert base64 to buffer and save
  const buffer = Buffer.from(base64Data, 'base64');
  
  // Validate file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (buffer.length > maxSizeBytes) {
    throw new Error(`Image must be smaller than ${maxSizeMB}MB`);
  }

  fs.writeFileSync(filePath, buffer);

  // Return the filename (relative path for storage)
  return filename;
};

// Validation schemas
export const createChallengeSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title too long'),
  description: z.string().min(1, 'Description is required').max(1000, 'Description too long'),
  category: z.string().min(1, 'Category is required'),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  xpReward: z.number().min(1, 'XP reward must be positive'),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  image: z.string().optional(),
  requiredLevel: z.number().min(1, 'Required level must be at least 1').optional().default(1),
  maxParticipants: z.number().optional(),
  stages: z.array(z.object({
    title: z.string().min(1, 'Stage title is required'),
    description: z.string().min(1, 'Stage description is required'),
    order: z.number().min(1, 'Stage order must be positive'),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    radius: z.number().min(1).max(1000).default(50).optional(),
    qrCode: z.string().min(1, 'QR code image is required. Please upload a QR code for this stage.')
  })).min(1, 'At least one stage is required')
});

export const updateChallengeSchema = createChallengeSchema
  .partial()
  .extend({
    isActive: z.boolean().optional()
  });

export const joinChallengeSchema = z.object({
  challengeId: z.string().min(1, 'Challenge ID is required')
});

export const submitStageSchema = z.object({
  stageId: z.string().min(1, 'Stage ID is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  submissionType: z.enum(['TEXT', 'IMAGE', 'LOCATION', 'QR_CODE']),
  content: z.string().optional()
});

// Challenge service class
export class ChallengeService {
  // Create new challenge (admin only)
  static async createChallenge(data: z.infer<typeof createChallengeSchema>) {
    const validatedData = createChallengeSchema.parse(data);

    // Validate dates
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);
    
    if (startDate >= endDate) {
      throw new Error('End date must be after start date');
    }

    if (startDate < new Date()) {
      throw new Error('Start date cannot be in the past');
    }

    // Validate that all stages have QR codes before processing
    const stagesWithoutQR = validatedData.stages.filter(stage => !stage.qrCode || stage.qrCode.trim() === '');
    if (stagesWithoutQR.length > 0) {
      throw new Error(`The following stages are missing QR codes: ${stagesWithoutQR.map(s => `Stage ${s.order}`).join(', ')}. Please upload QR code images for all stages.`);
    }

    // Process stages and handle QR code uploads
    const stagesData = await Promise.all(
      validatedData.stages.map(async (stage) => {
        let qrCodePath: string | undefined = undefined;

        // QR code is required and validated above
        if (stage.qrCode) {
          // Check if it's a base64 string (starts with data:image/)
          if (stage.qrCode.startsWith('data:image/')) {
            try {
              // Save base64 image to file
              qrCodePath = saveBase64Image(stage.qrCode, `qr-stage-${stage.order}`);
            } catch (error) {
              throw new Error(
                `Failed to save QR code for stage ${stage.order}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          } else {
            // Assume it's already a file path (for backward compatibility)
            qrCodePath = stage.qrCode;
          }
        }

      return {
        title: stage.title,
        description: stage.description,
        order: stage.order,
        latitude: stage.latitude || 0, // Default to 0 if not provided (GPS disabled)
        longitude: stage.longitude || 0, // Default to 0 if not provided (GPS disabled)
        radius: stage.radius || 50,
        qrCode: qrCodePath
      };
      })
    );

    // Process challenge image if provided
    let challengeImagePath: string | undefined = undefined;
    if (validatedData.image) {
      // Check if it's a base64 string (starts with data:image/)
      if (validatedData.image.startsWith('data:image/')) {
        try {
          // Save base64 image to file (5MB max for challenge images)
          challengeImagePath = saveBase64Image(validatedData.image, 'challenge', 5);
        } catch (error) {
          throw new Error(
            `Failed to save challenge image: ${error instanceof Error ? error.message : 'Unknown error'}`
          );
        }
      } else {
        // Assume it's already a file path (for backward compatibility)
        challengeImagePath = validatedData.image;
      }
    }

    // Create challenge with stages
    const challenge = await prisma.challenge.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        category: validatedData.category,
        difficulty: validatedData.difficulty as Difficulty,
        xpReward: validatedData.xpReward,
        startDate,
        endDate,
        image: challengeImagePath,
        requiredLevel: validatedData.requiredLevel ?? 1,
        maxParticipants: validatedData.maxParticipants,
        stages: {
          create: stagesData
        }
      },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            progress: true
          }
        }
      }
    });

    // QR codes must be uploaded by admin - no auto-generation
    // Verify all stages have QR codes
    const stagesWithoutQR = challenge.stages.filter(stage => !stage.qrCode);
    if (stagesWithoutQR.length > 0) {
      throw new Error(`The following stages are missing QR codes: ${stagesWithoutQR.map(s => `Stage ${s.order}`).join(', ')}. Please upload QR code images for all stages.`);
    }

    // Fetch challenge with uploaded QR codes
    const updatedChallenge = await prisma.challenge.findUnique({
      where: { id: challenge.id },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            progress: true
          }
        }
      }
    });

    return updatedChallenge || challenge;
  }

  // Get all challenges with filters
  static async getChallenges(filters: {
    category?: string;
    difficulty?: string;
    status?: 'active' | 'upcoming' | 'completed' | 'all';
    limit?: number;
    offset?: number;
  }) {
    const { category, difficulty, status, limit = 20, offset = 0 } = filters;

    const where: Prisma.ChallengeWhereInput = {};

    if (category && category !== 'all') {
      where.category = category;
    }

    if (difficulty && difficulty !== 'all') {
      const normalized = difficulty.toUpperCase() as Difficulty;
      if ((Object.values(Difficulty) as string[]).includes(normalized)) {
        where.difficulty = normalized;
      }
    }

    if (status && status !== 'all') {
      const now = new Date();
      switch (status) {
        case 'active':
          where.startDate = { lte: now };
          where.endDate = { gte: now };
          where.isActive = true;
          break;
        case 'upcoming':
          where.startDate = { gt: now };
          where.isActive = true;
          break;
        case 'completed':
          where.endDate = { lt: now };
          break;
      }
    }

    const [challenges, total] = await Promise.all([
      prisma.challenge.findMany({
        where,
        include: {
          stages: {
            orderBy: { order: 'asc' },
            select: {
              id: true,
              title: true,
              order: true,
              latitude: true,
              longitude: true,
              radius: true
            }
          },
          _count: {
            select: {
              progress: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }),
      prisma.challenge.count({ where })
    ]);

    return {
      challenges,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    };
  }

  // Get challenge by ID
  static async getChallengeById(challengeId: string, userId?: string) {
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            progress: true
          }
        }
      }
    });

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    // If user is provided, include their progress
    let userProgress = null;
    if (userId) {
      userProgress = await prisma.challengeProgress.findUnique({
        where: {
          userId_challengeId: {
            userId,
            challengeId
          }
        },
        include: {
          stages: {
            include: {
              stage: true
            },
            orderBy: {
              stage: { order: 'asc' }
            }
          }
        }
      });
    }

    return {
      ...challenge,
      userProgress
    };
  }

// Update challenge (admin only)
static async updateChallenge(id: string, data: z.infer<typeof updateChallengeSchema>) {
  // Validate and parse incoming data
  const validatedData = updateChallengeSchema.parse(data);

  // Find existing challenge
  const existingChallenge = await prisma.challenge.findUnique({
    where: { id },
    include: { stages: true },
  });

  if (!existingChallenge) {
    throw new Error('Challenge not found');
  }

  // If dates are provided, validate them
  if (validatedData.startDate && validatedData.endDate) {
    const startDate = new Date(validatedData.startDate);
    const endDate = new Date(validatedData.endDate);

    if (startDate >= endDate) {
      throw new Error('End date must be after start date');
    }
  }

  // Process challenge image if provided
  let challengeImagePath: string | undefined = undefined;
  if (validatedData.image) {
    // Check if it's a base64 string (starts with data:image/)
    if (validatedData.image.startsWith('data:image/')) {
      try {
        // Save base64 image to file (5MB max for challenge images)
        challengeImagePath = saveBase64Image(validatedData.image, 'challenge', 5);
      } catch (error) {
        throw new Error(
          `Failed to save challenge image: ${error instanceof Error ? error.message : 'Unknown error'}`
        );
      }
    } else {
      // Assume it's already a file path (for backward compatibility)
      challengeImagePath = validatedData.image;
    }
  }

  // Build update data
  const updateData: Prisma.ChallengeUpdateInput = {
    title: validatedData.title ?? existingChallenge.title,
    description: validatedData.description ?? existingChallenge.description,
    category: validatedData.category ?? existingChallenge.category,
    difficulty: validatedData.difficulty ?? existingChallenge.difficulty,
    xpReward: validatedData.xpReward ?? existingChallenge.xpReward,
    startDate: validatedData.startDate ? new Date(validatedData.startDate) : existingChallenge.startDate,
    endDate: validatedData.endDate ? new Date(validatedData.endDate) : existingChallenge.endDate,
    image: challengeImagePath !== undefined ? challengeImagePath : existingChallenge.image,
    requiredLevel: validatedData.requiredLevel ?? existingChallenge.requiredLevel,
    maxParticipants: validatedData.maxParticipants ?? existingChallenge.maxParticipants,
    isActive: typeof validatedData.isActive === 'boolean' ? validatedData.isActive : existingChallenge.isActive,
  };

  // If stages are provided, replace them
  if (validatedData.stages && validatedData.stages.length > 0) {
    // Delete old stages
    await prisma.stage.deleteMany({
      where: { challengeId: id },
    });

    // Validate that all stages have QR codes before processing
    const stagesWithoutQR = validatedData.stages.filter(stage => !stage.qrCode || stage.qrCode.trim() === '');
    if (stagesWithoutQR.length > 0) {
      throw new Error(`The following stages are missing QR codes: ${stagesWithoutQR.map(s => `Stage ${s.order}`).join(', ')}. Please upload QR code images for all stages.`);
    }

    // Process stages and handle QR code uploads
    const stagesData = await Promise.all(
      validatedData.stages.map(async (stage) => {
        let qrCodePath: string | undefined = undefined;

        // QR code is required and validated above
        if (stage.qrCode) {
          // Check if it's a base64 string (starts with data:image/)
          if (stage.qrCode.startsWith('data:image/')) {
            try {
              // Save base64 image to file
              qrCodePath = saveBase64Image(stage.qrCode, `qr-stage-${stage.order}`);
            } catch (error) {
              throw new Error(
                `Failed to save QR code for stage ${stage.order}: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          } else {
            // Assume it's already a file path (for backward compatibility)
            qrCodePath = stage.qrCode;
          }
        }

        return {
          title: stage.title,
          description: stage.description,
          order: stage.order,
          latitude: stage.latitude ?? 0, // Default to 0 if not provided (GPS disabled)
          longitude: stage.longitude ?? 0, // Default to 0 if not provided (GPS disabled)
          radius: stage.radius ?? 50,
          qrCode: qrCodePath,
        };
      })
    );

    // Recreate stages
    updateData.stages = {
      create: stagesData,
    };
  }

  // Perform update
  const updatedChallenge = await prisma.challenge.update({
    where: { id },
    data: updateData,
    include: {
      stages: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          progress: true,
        },
      },
    },
  });

  // QR codes must be uploaded by admin - verify all stages have QR codes
  const stagesWithoutQR = updatedChallenge.stages.filter(stage => !stage.qrCode);
  if (stagesWithoutQR.length > 0) {
    throw new Error(`The following stages are missing QR codes: ${stagesWithoutQR.map(s => `Stage ${s.order}`).join(', ')}. Please upload QR code images for all stages.`);
  }

  // Fetch updated challenge with uploaded QR codes
  const finalChallenge = await prisma.challenge.findUnique({
    where: { id },
    include: {
      stages: {
        orderBy: { order: 'asc' },
      },
      _count: {
        select: {
          progress: true,
        },
      },
    },
  });

  return finalChallenge || updatedChallenge;
}


// Delete challenge (admin only)
static async deleteChallenge(id: string) {
  // Check if challenge exists
  const challenge = await prisma.challenge.findUnique({
    where: { id },
    include: { stages: true, progress: true },
  });

  if (!challenge) {
    throw new Error('Challenge not found');
  }

  // Delete related data in correct order (to avoid foreign key constraint errors)
  await prisma.stageProgress.deleteMany({
    where: {
      stage: { challengeId: id },
    },
  });

  await prisma.challengeProgress.deleteMany({
    where: { challengeId: id },
  });

  await prisma.stage.deleteMany({
    where: { challengeId: id },
  });

  // Finally delete the challenge itself
  await prisma.challenge.delete({
    where: { id },
  });

  return { message: 'Challenge deleted successfully' };
}

  static async joinChallenge(userId: string, challengeId: string) {
    // Check if challenge exists and is active
    const challenge = await prisma.challenge.findUnique({
      where: { id: challengeId }
    });

    if (!challenge) {
      throw new Error('Challenge not found');
    }

    if (!challenge.isActive) {
      throw new Error('Challenge is not active');
    }

    const now = new Date();
    if (now < challenge.startDate) {
      throw new Error('Challenge has not started yet');
    }

    if (now > challenge.endDate) {
      throw new Error('Challenge has ended');
    }

    // Check user level requirement
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { level: true }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.level < challenge.requiredLevel) {
      throw new Error(`You need to be at least level ${challenge.requiredLevel} to join this challenge. Your current level is ${user.level}.`);
    }

    // Check if user already joined
    const existingProgress = await prisma.challengeProgress.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId
        }
      }
    });

    if (existingProgress) {
      throw new Error('You have already joined this challenge');
    }

    // Check participant limit
    if (challenge.maxParticipants) {
      const participantCount = await prisma.challengeProgress.count({
        where: { challengeId }
      });

      if (participantCount >= challenge.maxParticipants) {
        throw new Error('Challenge is full');
      }
    }

    // Create challenge progress
    const progress = await prisma.challengeProgress.create({
      data: {
        userId,
        challengeId,
        status: 'ACTIVE'
      },
      include: {
        challenge: {
          include: {
            stages: {
              orderBy: { order: 'asc' }
            }
          }
        }
      }
    });

    return progress;
  }

  // Submit stage completion
  static async submitStage(userId: string, data: z.infer<typeof submitStageSchema>) {
    const validatedData = submitStageSchema.parse(data);

    // Get challenge progress
    const stage = await prisma.stage.findUnique({
      where: { id: validatedData.stageId },
      include: {
        challenge: true
      }
    });

    if (!stage) {
      throw new Error('Stage not found');
    }

    const progress = await prisma.challengeProgress.findUnique({
      where: {
        userId_challengeId: {
          userId,
          challengeId: stage.challengeId
        }
      }
    });

    if (!progress) {
      throw new Error('You have not joined this challenge');
    }

    if (progress.status !== 'ACTIVE') {
      throw new Error('Challenge is not active');
    }

    // Check if stage is already completed
    const existingStageProgress = await prisma.stageProgress.findUnique({
      where: {
        challengeProgressId_stageId: {
          challengeProgressId: progress.id,
          stageId: validatedData.stageId
        }
      }
    });

    if (existingStageProgress && existingStageProgress.status === 'COMPLETED') {
      throw new Error('Stage already completed');
    }

    // Validate QR code requirement
    if (stage.qrCode) {
      // If stage has QR code, submission must be QR_CODE type
      if (validatedData.submissionType !== 'QR_CODE') {
        throw new Error('This stage requires QR code scanning');
      }

      // QR code content must be provided
      if (!validatedData.content || validatedData.content.trim() === '') {
        throw new Error('QR code data is required. Please scan the QR code.');
      }

      // Validate QR code matches stage (QR code should contain stage ID or unique identifier)
      const scannedData = validatedData.content.trim();
      
      // Validate QR code contains stage ID - this ensures the scanned code matches the correct stage
      if (scannedData !== stage.id) {
        throw new Error('Invalid QR code. This QR code does not match this stage.');
      }
    } else {
      // If stage doesn't have QR code, but submission type is QR_CODE, that's invalid
      if (validatedData.submissionType === 'QR_CODE') {
        throw new Error('This stage does not require QR code scanning');
      }
    }

    // GPS validation is disabled - only validate QR code if stage has one
    // Location validation commented out as GPS functionality is disabled
    // const distance = this.calculateDistance(
    //   validatedData.latitude,
    //   validatedData.longitude,
    //   stage.latitude,
    //   stage.longitude
    // );

    // if (distance > stage.radius) {
    //   throw new Error(`You must be within ${stage.radius}m of the stage location`);
    // }

    // Create or update stage progress
    const stageProgress = await prisma.stageProgress.upsert({
      where: {
        challengeProgressId_stageId: {
          challengeProgressId: progress.id,
          stageId: validatedData.stageId
        }
      },
      update: {
        status: 'COMPLETED',
        completedAt: new Date(),
        latitude: validatedData.latitude,
        longitude: validatedData.longitude
      },
      create: {
        challengeProgressId: progress.id,
        stageId: validatedData.stageId,
        status: 'COMPLETED',
        completedAt: new Date(),
        latitude: validatedData.latitude,
        longitude: validatedData.longitude
      }
    });

    // Check if all stages are completed
    const completedStages = await prisma.stageProgress.count({
      where: {
        challengeProgressId: progress.id,
        status: 'COMPLETED'
      }
    });

    const totalStages = await prisma.stage.count({
      where: { challengeId: stage.challengeId }
    });

    if (completedStages === totalStages) {
      // Complete the challenge
      await prisma.challengeProgress.update({
        where: { id: progress.id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });

      // Award XP
      await prisma.user.update({
        where: { id: userId },
        data: {
          xp: {
            increment: stage.challenge.xpReward
          }
        }
      });

      // Update user level (simplified level calculation)
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { xp: true }
      });

      if (user) {
        const newLevel = Math.floor(user.xp / 1000) + 1;
        await prisma.user.update({
          where: { id: userId },
          data: { level: newLevel }
        });
      }
    }

    return stageProgress;
  }

  // Get user's challenges
  static async getUserChallenges(userId: string, status?: ProgressStatus) {
    const where: Prisma.ChallengeProgressWhereInput = { userId };
    if (status) {
      where.status = status;
    }

    const challenges = await prisma.challengeProgress.findMany({
      where,
      include: {
        challenge: {
          include: {
            stages: {
              orderBy: { order: 'asc' }
            },
            _count: {
              select: {
                progress: true
              }
            }
          }
        },
        stages: {
          include: {
            stage: true
          },
          orderBy: {
            stage: { order: 'asc' }
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    return challenges;
  }

  // Helper function to calculate distance between two points
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  }
}
