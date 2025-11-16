// API configuration and utilities
import logger from './logger';
import { API_BASE_URL } from './config';

logger.debug('🔍 API_BASE_URL =', API_BASE_URL);

export const getChallengeById = (id: string) => apiClient.getChallengeById(id);

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

// Auth interfaces
export interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  xp: number;
  level: number;
  rank?: number;
  isAdmin: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    challengeProgress: number;
    achievements: number;
  };
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}




export interface RegisterRequest {
  email: string;
  username: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

// Challenge interfaces
export interface Stage {
  id: string;
  title: string;
  description: string;
  order: number;
  latitude: number;
  longitude: number;
  radius: number;
  qrCode?: string;
  isActive: boolean;
}
export interface CreateStageRequest {
  order: number;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  radius?: number; // optional, backend default = 50
  qrCode?: string; // optional, for QR code verification
}

export interface CreateChallengeRequest {
  title: string;
  description: string;
  category: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  xpReward: number;
  startDate: string; // ISO format date string (datetime)
  endDate: string; // ISO format date string (datetime) - REQUIRED
  image?: string; // optional - base64 image string
  requiredLevel?: number; // optional, defaults to 1
  maxParticipants?: number; // optional
  latitude?: number; // optional - challenge location latitude
  longitude?: number; // optional - challenge location longitude
  stages: CreateStageRequest[];
}
export interface Challenge {
  id: string;
  latitude?: number;
  longitude?: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  xpReward: number;
  startDate: string;
  endDate: string;
  image?: string;
  requiredLevel: number;
  isActive: boolean;
  maxParticipants?: number;
  createdAt: string;
  updatedAt: string;
  stages: Stage[];
  _count: {
    progress: number;
  };
  userProgress?: ChallengeProgress;
}

export interface ChallengeProgress {
  id: string;
  userId: string;
  challengeId: string;
  status: 'ACTIVE' | 'COMPLETED' | 'ABANDONED';
  startedAt: string;
  completedAt?: string;
  stages: StageProgress[];
  challenge?: Challenge;
}

export interface StageProgress {
  id: string;
  stageId: string;
  status: 'PENDING' | 'COMPLETED' | 'SKIPPED';
  completedAt?: string;
  latitude?: number;
  longitude?: number;
  stage: Stage;
}

export interface JoinChallengeRequest {
  challengeId: string;
}

export interface SubmitStageRequest {
  stageId: string;
  latitude: number;
  longitude: number;
  submissionType: 'TEXT' | 'IMAGE' | 'LOCATION' | 'QR_CODE';
  content?: string;
}

// Leaderboard interfaces
export interface LeaderboardEntry {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  xp: number;
  level: number;
  rank: number;
  completedChallenges: number;
  achievements: number;
}

export interface LeaderboardData {
  period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME';
  leaderboard: LeaderboardEntry[];
  total: number;
}

export interface LeaderboardStats {
  totalUsers: number;
  totalChallenges: number;
  totalXP: number;
  topUser?: {
    username: string;
    xp: number;
    level: number;
  };
  averageXP: number;
}

// Category interfaces
export interface Category {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateCategoryRequest {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
}

export interface UpdateCategoryRequest {
  name?: string;
  description?: string;
  icon?: string;
  color?: string;
}

// Level interfaces
export interface Level {
  id: string;
  number: number;
  name: string;
  minXP: number;
  maxXP?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLevelRequest {
  number: number;
  name: string;
  minXP: number;
  maxXP?: number;
  isActive?: boolean;
}

export interface UpdateLevelRequest {
  number?: number;
  name?: string;
  minXP?: number;
  maxXP?: number;
  isActive?: boolean;
}

// API client class
class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('auth_token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
   const headers: Record<string, string> = {
  'Content-Type': 'application/json',
  ...(options.headers as Record<string, string>),
};

if (this.token) {
  headers['Authorization'] = `Bearer ${this.token}`;
}

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch (parseError) {
        // If response is not JSON, check status and provide appropriate error
        if (!response.ok) {
          if (response.status === 500 || response.status === 503) {
            throw new Error('Server error. Please check if the backend server and database are running.');
          }
          throw new Error(`Request failed with status ${response.status}`);
        }
        throw new Error('Invalid response from server');
      }

      if (!response.ok) {
        // Check for database connection errors (503 Service Unavailable)
        if (response.status === 503) {
          const errorMessage = data.error || data.message || 'Service temporarily unavailable';
          throw new Error(errorMessage);
        }
        
        // Check for database connection errors in error message
        const errorMessage = data.error || data.message || 'Request failed';
        
        // Provide user-friendly message for database connection errors
        if (errorMessage.includes('database server') || 
            errorMessage.includes('Can\'t reach database') ||
            errorMessage.includes('Database connection failed') ||
            errorMessage.includes('database configuration')) {
          throw new Error('Database connection failed. The backend cannot connect to the database. Please check the database configuration on the server.');
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      // Re-throw with better message if it's already an Error
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error. Please check your connection.');
    }
  }



  

  // Auth methods
  async login(credentials: LoginRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async register(userData: RegisterRequest): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data) {
      this.setToken(response.data.token);
    }

    return response.data!;
  }

  async getProfile(): Promise<User> {
    const response = await this.request<User>('/auth/profile');
    return response.data!;
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    const response = await this.request<User>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    return response.data!;
  }

  async changePassword(data: { currentPassword: string; newPassword: string }): Promise<void> {
    await this.request('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Challenge methods
  async getChallenges(filters?: {
    category?: string;
    difficulty?: string;
    status?: 'active' | 'upcoming' | 'completed' | 'all';
    limit?: number;
    offset?: number;
  }): Promise<{ challenges: Challenge[]; pagination: PaginationInfo }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/challenges${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.request<{ challenges: Challenge[]; pagination: PaginationInfo }>(endpoint);
    return response.data!;
  }

  async getChallengeById(id: string): Promise<Challenge> {
    const response = await this.request<Challenge>(`/challenges/${id}`);
    return response.data!;
  }

  async joinChallenge(challengeId: string): Promise<ChallengeProgress> {
    const response = await this.request<ChallengeProgress>('/challenges/join', {
      method: 'POST',
      body: JSON.stringify({ challengeId }),
    });

    return response.data!;
  }


  async createChallenge(data: CreateChallengeRequest): Promise<Challenge> {
  if (!this.token) {
    throw new Error("❌ Unauthorized: You must be logged in to create a challenge");
  }

  const response = await this.request<Challenge>('/challenges', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${this.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  return response.data!;
}

  async updateChallenge(id: string, data: Partial<CreateChallengeRequest>): Promise<Challenge> {
    if (!this.token) {
      throw new Error("❌ Unauthorized: You must be logged in to update a challenge");
    }

    const response = await this.request<Challenge>(`/challenges/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${this.token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async deleteChallenge(id: string): Promise<void> {
    if (!this.token) {
      throw new Error("❌ Unauthorized: You must be logged in to delete a challenge");
    }

    await this.request(`/challenges/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${this.token}`,
      },
    });
  }


  async submitStage(data: SubmitStageRequest): Promise<StageProgress> {
    const response = await this.request<StageProgress>('/challenges/submit-stage', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    return response.data!;
  }

  async getUserChallenges(status?: 'ACTIVE' | 'COMPLETED' | 'ABANDONED'): Promise<ChallengeProgress[]> {
    const endpoint = `/challenges/user/my-challenges${status ? `?status=${status}` : ''}`;
    const response = await this.request<ChallengeProgress[]>(endpoint);
    return response.data!;
  }

  // Leaderboard methods
  async getLeaderboard(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME', limit: number = 50): Promise<LeaderboardData> {
    const response = await this.request<LeaderboardData>(`/leaderboard?period=${period}&limit=${limit}`);
    return response.data!;
  }

  async getLeaderboardStats(): Promise<LeaderboardStats> {
    const response = await this.request<LeaderboardStats>('/leaderboard/stats');
    return response.data!;
  }

  async getUserRank(period: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'ALL_TIME' = 'ALL_TIME'): Promise<{
    userId: string;
    xp: number;
    rank: number;
    period: string;
  }> {
    const response = await this.request<{
      userId: string;
      xp: number;
      rank: number;
      period: string;
    }>(`/leaderboard/user-rank?period=${period}`);
    return response.data!;
  }

  // Category methods
  async getCategories(includeInactive = false): Promise<Category[]> {
    const endpoint = `/categories${includeInactive ? '?includeInactive=true' : ''}`;
    const response = await this.request<Category[]>(endpoint);
    return response.data!;
  }

  async getCategoryById(id: string): Promise<Category> {
    const response = await this.request<Category>(`/categories/${id}`);
    return response.data!;
  }

  async createCategory(data: CreateCategoryRequest): Promise<Category> {
    const response = await this.request<Category>('/categories', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateCategory(id: string, data: UpdateCategoryRequest): Promise<Category> {
    const response = await this.request<Category>(`/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteCategory(id: string): Promise<void> {
    await this.request(`/categories/${id}`, {
      method: 'DELETE',
    });
  }

  async toggleCategoryStatus(id: string): Promise<Category> {
    const response = await this.request<Category>(`/categories/${id}/toggle-status`, {
      method: 'PATCH',
    });
    return response.data!;
  }

  // Level methods
  async getLevels(includeInactive = false): Promise<Level[]> {
    const endpoint = `/levels${includeInactive ? '?includeInactive=true' : ''}`;
    const response = await this.request<Level[]>(endpoint);
    return response.data!;
  }

  async getLevelById(id: string): Promise<Level> {
    const response = await this.request<Level>(`/levels/${id}`);
    return response.data!;
  }

  async createLevel(data: CreateLevelRequest): Promise<Level> {
    const response = await this.request<Level>('/levels', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async updateLevel(id: string, data: UpdateLevelRequest): Promise<Level> {
    const response = await this.request<Level>(`/levels/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data!;
  }

  async deleteLevel(id: string): Promise<void> {
    await this.request(`/levels/${id}`, {
      method: 'DELETE',
    });
  }

  async updateAllUserLevels(): Promise<{ message: string }> {
    const response = await this.request<{ message: string }>('/levels/update-all-users', {
      method: 'POST',
    });
    return response.data!;
  }

  // User methods (admin only)
  async getAllUsers(filters?: {
    search?: string;
    isActive?: boolean;
    isAdmin?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ users: User[]; total: number; limit: number; offset: number }> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }

    const endpoint = `/users${params.toString() ? `?${params.toString()}` : ''}`;
    const response = await this.request<{ users: User[]; total: number; limit: number; offset: number }>(endpoint);
    return response.data!;
  }

  async getUserById(id: string): Promise<User> {
    const response = await this.request<User>(`/users/${id}`);
    return response.data!;
  }

  async toggleUserStatus(id: string): Promise<{ id: string; isActive: boolean }> {
    const response = await this.request<{ id: string; isActive: boolean }>(`/users/${id}/toggle-status`, {
      method: 'PATCH',
    });
    return response.data!;
  }

  // Utility methods
  setToken(token: string): void {
    this.token = token;
    localStorage.setItem('auth_token', token);
  }

  clearToken(): void {
    this.token = null;
    localStorage.removeItem('auth_token');
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }
}

// Create and export API client instance

export const apiClient = new ApiClient(API_BASE_URL);

// ✅ Export helper for easier use in the frontend
export const createChallenge = (data: CreateChallengeRequest) =>
  apiClient.createChallenge(data);
