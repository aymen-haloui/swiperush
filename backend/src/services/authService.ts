import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  username: z.string().min(3, 'Username must be at least 3 characters').max(20, 'Username must be less than 20 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required')
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(6, 'New password must be at least 6 characters')
});

// Auth service class
export class AuthService {
  // Register new user
  static async register(data: z.infer<typeof registerSchema>) {
    const validatedData = registerSchema.parse(data);
    
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          { username: validatedData.username }
        ]
      }
    });

    if (existingUser) {
      throw new Error('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      validatedData.password,
      parseInt(process.env.BCRYPT_ROUNDS!) || 12
    );

    // Create user
    const user = await prisma.user.create({
      data: {
        ...validatedData,
        password: hashedPassword
      },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        xp: true,
        level: true,
        isAdmin: true,
        createdAt: true
      }
    });

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user,
      token
    };
  }

  // Login user
  static async login(data: z.infer<typeof loginSchema>) {
    const validatedData = loginSchema.parse(data);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: validatedData.email }
    });

    if (!user) {
      console.log(`Login attempt failed: User not found for email: ${validatedData.email}`);
      throw new Error('Invalid credentials');
    }

    if (!user.isActive) {
      console.log(`Login attempt failed: User ${user.email} is inactive`);
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(validatedData.password, user.password);

    if (!isValidPassword) {
      console.log(`Login attempt failed: Invalid password for email: ${validatedData.email}`);
      throw new Error('Invalid credentials');
    }

    // Update last login (you can add this field to schema if needed)
    await prisma.user.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    // Generate JWT token
    const token = this.generateToken(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        xp: user.xp,
        level: user.level,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      },
      token
    };
  }

  // Change password
  static async changePassword(userId: string, data: z.infer<typeof changePasswordSchema>) {
    const validatedData = changePasswordSchema.parse(data);

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(validatedData.currentPassword, user.password);

    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      validatedData.newPassword,
      parseInt(process.env.BCRYPT_ROUNDS!) || 12
    );

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword }
    });

    return { message: 'Password changed successfully' };
  }

  // Generate JWT token
  static generateToken(userId: string): string {
    const secret: Secret = (process.env.JWT_SECRET || '').trim();
    const expiresInEnv = process.env.JWT_EXPIRES_IN;
    const expiresIn = expiresInEnv && !Number.isNaN(Number(expiresInEnv))
      ? Number(expiresInEnv)
      : (expiresInEnv ?? '7d');

    const options: SignOptions = {
      expiresIn: expiresIn as any,
      algorithm: 'HS256'
    };

    return jwt.sign({ userId }, secret, options);
  }

  // Verify JWT token
  static verifyToken(token: string): any {
    return jwt.verify(token, process.env.JWT_SECRET!);
  }

  // Get user profile
  static async getUserProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        xp: true,
        level: true,
        rank: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            challengeProgress: {
              where: { status: 'COMPLETED' }
            },
            achievements: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  }

  // Update user profile
  static async updateProfile(userId: string, data: {
    firstName?: string;
    lastName?: string;
    avatar?: string;
  }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
        xp: true,
        level: true,
        rank: true,
        isAdmin: true,
        updatedAt: true
      }
    });

    return user;
  }
}
