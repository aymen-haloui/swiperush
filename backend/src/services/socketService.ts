import { Server as SocketIOServer, Socket } from "socket.io";

import { Server as HTTPServer } from 'http';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  user?: {
    id: string;
    username: string;
    isAdmin: boolean;
  };
}

export class SocketService {
  private io: SocketIOServer;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(server: HTTPServer) {
    // CORS configuration - allow multiple origins
    const allowedOrigins = [
      'http://localhost:8081',
      'http://localhost:5173',
      'https://challengequest-frontend.vercel.app',
      process.env.SOCKET_CORS_ORIGIN,
      process.env.CORS_ORIGIN
    ].filter(Boolean); // Remove any undefined values

    this.io = new SocketIOServer(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps)
          if (!origin) return callback(null, true);
          
          if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
          } else {
            callback(new Error('Not allowed by CORS'));
          }
        },
        methods: ["GET", "POST"],
        credentials: true
      }
    });

    this.setupSocketHandlers();
  }

  private setupSocketHandlers(): void {
    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User ${socket.user?.username} connected: ${socket.id}`);

      if (socket.user) {
        this.connectedUsers.set(socket.user.id, socket.id);
        
        // Join user to their personal room
        socket.join(`user:${socket.user.id}`);
        
        // Join admin to admin room if applicable
        if (socket.user.isAdmin) {
          socket.join('admin');
        }
      }

      // Handle leaderboard updates
      socket.on('subscribe:leaderboard', (period: string) => {
        socket.join(`leaderboard:${period}`);
      });

      socket.on('unsubscribe:leaderboard', (period: string) => {
        socket.leave(`leaderboard:${period}`);
      });

      // Handle challenge updates
      socket.on('subscribe:challenge', (challengeId: string) => {
        socket.join(`challenge:${challengeId}`);
      });

      socket.on('unsubscribe:challenge', (challengeId: string) => {
        socket.leave(`challenge:${challengeId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`User ${socket.user?.username} disconnected: ${socket.id}`);
        
        if (socket.user) {
          this.connectedUsers.delete(socket.user.id);
        }
      });
    });
  }

  private async authenticateSocket(socket: AuthenticatedSocket, next: Function): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, username: true, isAdmin: true, isActive: true }
      });

      if (!user || !user.isActive) {
        return next(new Error('Invalid user'));
      }

      socket.user = {
        id: user.id,
        username: user.username,
        isAdmin: user.isAdmin
      };

      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  }

  // Emit leaderboard update
  public emitLeaderboardUpdate(period: string, data: any): void {
    this.io.to(`leaderboard:${period}`).emit('leaderboard:update', data);
  }

  // Emit challenge update
  public emitChallengeUpdate(challengeId: string, data: any): void {
    this.io.to(`challenge:${challengeId}`).emit('challenge:update', data);
  }

  // Emit user notification
  public emitUserNotification(userId: string, notification: any): void {
    this.io.to(`user:${userId}`).emit('notification', notification);
  }

  // Emit admin notification
  public emitAdminNotification(data: any): void {
    this.io.to('admin').emit('admin:notification', data);
  }

  // Emit global announcement
  public emitGlobalAnnouncement(data: any): void {
    this.io.emit('announcement', data);
  }

  // Get connected users count
  public getConnectedUsersCount(): number {
    return this.connectedUsers.size;
  }

  // Check if user is online
  public isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  // Get online users
  public getOnlineUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }
}

// Export singleton instance
let socketService: SocketService | null = null;

export const initializeSocketService = (server: HTTPServer): SocketService => {
  if (!socketService) {
    socketService = new SocketService(server);
  }
  return socketService;
};

export const getSocketService = (): SocketService | null => {
  return socketService;
};
