import { ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Create a test query client with minimal retry and caching
export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// Wrapper component for testing with React Query
export function TestWrapper({ children }: { children: ReactNode }) {
  const queryClient = createTestQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

// Custom render function that includes React Query provider
export function renderWithQueryClient(
  ui: React.ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: TestWrapper, ...options });
}

// Mock API responses
export const mockUser = {
  id: '123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'USER' as const,
  createdAt: '2024-01-01T00:00:00.000Z',
};

export const mockMemo = {
  id: 'memo-1',
  userId: '123',
  title: 'Test Meeting',
  date: '2024-01-15T10:00:00.000Z',
  duration: 1800,
  participants: ['John Doe', 'Jane Smith'],
  audioUrl: 'https://example.com/audio.mp3',
  audioStorageKey: 'memos/memo-1/audio.mp3',
  status: 'COMPLETED' as const,
  memoContent: {
    summary: 'This is a test meeting summary.',
    keyPoints: ['Point 1', 'Point 2', 'Point 3'],
    actionItems: [
      {
        task: 'Complete the report',
        owner: 'John Doe',
        dueDate: '2024-01-20',
        priority: 'high' as const,
      },
    ],
    decisions: ['Decision 1', 'Decision 2'],
    nextSteps: ['Step 1', 'Step 2'],
  },
  transcript: {
    id: 'transcript-1',
    memoId: 'memo-1',
    text: 'This is the full transcript text.',
    segments: [
      { id: 0, start: 0, end: 5, text: 'Hello everyone.' },
      { id: 1, start: 5, end: 10, text: 'Let\'s begin the meeting.' },
    ],
    language: 'en',
  },
  createdAt: '2024-01-15T10:00:00.000Z',
  updatedAt: '2024-01-15T11:00:00.000Z',
};

export const mockAuthTokens = {
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  user: mockUser,
};
