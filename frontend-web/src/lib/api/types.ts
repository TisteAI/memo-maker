/**
 * API Types
 * TypeScript types matching backend API responses
 */

export type Role = 'USER' | 'ADMIN';

export type MemoStatus = 'UPLOADING' | 'TRANSCRIBING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

export type SubscriptionTier = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  createdAt: string;
}

export interface Subscription {
  tier: SubscriptionTier;
  monthlyMinutes: number;
  minutesUsed: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface Memo {
  id: string;
  userId: string;
  title: string;
  date: string;
  duration: number | null;
  participants: string[];
  audioUrl: string | null;
  status: MemoStatus;
  errorMessage: string | null;
  memoContent: MemoContent | null;
  transcript?: Transcript | null;
  createdAt: string;
  updatedAt: string;
}

export interface Transcript {
  id: string;
  memoId: string;
  text: string;
  segments: TranscriptSegment[];
  language: string;
  createdAt: string;
}

export interface TranscriptSegment {
  id: number;
  start: number;
  end: number;
  text: string;
}

export interface MemoContent {
  summary: string;
  keyPoints: string[];
  actionItems: ActionItem[];
  decisions: string[];
  nextSteps?: string[];
  attendees?: string[];
}

export interface ActionItem {
  task: string;
  owner?: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
}

// Request types
export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface CreateMemoRequest {
  title: string;
  date?: string;
  participants?: string[];
}

export interface UpdateMemoRequest {
  title?: string;
  participants?: string[];
}

export interface ListMemosParams {
  limit?: number;
  offset?: number;
  status?: MemoStatus;
}

// Response types
export interface ApiResponse<T> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface UserResponse {
  user: User & { subscription?: Subscription };
}

export interface MemoResponse {
  memo: Memo;
}

export interface MemosResponse {
  memos: Memo[];
}

export interface UploadResponse {
  message: string;
  audioUrl?: string;
  uploadUrl?: string;
  key?: string;
}

export interface DownloadUrlResponse {
  downloadUrl: string;
}
