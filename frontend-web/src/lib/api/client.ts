/**
 * API Client
 * Type-safe HTTP client for backend API
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  AuthTokens,
  RegisterRequest,
  LoginRequest,
  UserResponse,
  CreateMemoRequest,
  UpdateMemoRequest,
  MemoResponse,
  MemosResponse,
  ListMemosParams,
  UploadResponse,
  DownloadUrlResponse,
} from './types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

class ApiClient {
  private client: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use((config) => {
      if (this.accessToken) {
        config.headers.Authorization = `Bearer ${this.accessToken}`;
      }
      return config;
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError<{ error?: { code: string; message: string; details?: unknown } }>) => {
        const status = error.response?.status || 500;
        const apiError = error.response?.data?.error;

        if (apiError) {
          throw new ApiError(
            status,
            apiError.code,
            apiError.message,
            apiError.details
          );
        }

        throw new ApiError(
          status,
          'NETWORK_ERROR',
          error.message || 'Network error occurred'
        );
      }
    );

    // Load tokens from localStorage
    if (typeof window !== 'undefined') {
      this.accessToken = localStorage.getItem('accessToken');
      this.refreshToken = localStorage.getItem('refreshToken');
    }
  }

  setTokens(accessToken: string, refreshToken: string) {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;

    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
    }
  }

  clearTokens() {
    this.accessToken = null;
    this.refreshToken = null;

    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Auth endpoints
  async register(data: RegisterRequest): Promise<{ user: AuthTokens['user'] }> {
    const response = await this.client.post('/api/auth/register', data);
    return response.data;
  }

  async login(data: LoginRequest): Promise<AuthTokens> {
    const response = await this.client.post<AuthTokens>('/api/auth/login', data);
    const tokens = response.data;
    this.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  async logout(): Promise<void> {
    if (this.refreshToken) {
      await this.client.post('/api/auth/logout', {
        refreshToken: this.refreshToken,
      });
    }
    this.clearTokens();
  }

  async refreshAccessToken(): Promise<AuthTokens> {
    if (!this.refreshToken) {
      throw new ApiError(401, 'NO_REFRESH_TOKEN', 'No refresh token available');
    }

    const response = await this.client.post<AuthTokens>('/api/auth/refresh', {
      refreshToken: this.refreshToken,
    });

    const tokens = response.data;
    this.setTokens(tokens.accessToken, tokens.refreshToken);
    return tokens;
  }

  async getCurrentUser(): Promise<UserResponse> {
    const response = await this.client.get<UserResponse>('/api/auth/me');
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    await this.client.post('/api/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  // Memo endpoints
  async createMemo(data: CreateMemoRequest): Promise<MemoResponse> {
    const response = await this.client.post<MemoResponse>('/api/memos', data);
    return response.data;
  }

  async listMemos(params?: ListMemosParams): Promise<MemosResponse> {
    const response = await this.client.get<MemosResponse>('/api/memos', { params });
    return response.data;
  }

  async getMemo(memoId: string): Promise<MemoResponse> {
    const response = await this.client.get<MemoResponse>(`/api/memos/${memoId}`);
    return response.data;
  }

  async updateMemo(memoId: string, data: UpdateMemoRequest): Promise<MemoResponse> {
    const response = await this.client.patch<MemoResponse>(`/api/memos/${memoId}`, data);
    return response.data;
  }

  async deleteMemo(memoId: string): Promise<void> {
    await this.client.delete(`/api/memos/${memoId}`);
  }

  async uploadAudio(memoId: string, file: File): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    const response = await this.client.post<UploadResponse>(
      `/api/memos/${memoId}/audio`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );

    return response.data;
  }

  async getPresignedUploadUrl(memoId: string): Promise<UploadResponse> {
    const response = await this.client.post<UploadResponse>(
      `/api/memos/${memoId}/audio/upload-url`
    );
    return response.data;
  }

  async getAudioDownloadUrl(memoId: string): Promise<DownloadUrlResponse> {
    const response = await this.client.get<DownloadUrlResponse>(
      `/api/memos/${memoId}/audio/download-url`
    );
    return response.data;
  }

  // Helper to check if user is authenticated
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
