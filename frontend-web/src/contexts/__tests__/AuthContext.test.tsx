import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../AuthContext';
import { apiClient } from '@/lib/api/client';
import { createTestQueryClient } from '@/tests/helpers';
import { QueryClientProvider } from '@tanstack/react-query';

// Mock the API client
vi.mock('@/lib/api/client', () => ({
  apiClient: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
    register: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
  },
}));

// Mock Next.js router
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    prefetch: vi.fn(),
  }),
  usePathname: () => '/memos',
  useSearchParams: () => new URLSearchParams(),
}));

describe('AuthContext', () => {
  const queryClient = createTestQueryClient();

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    queryClient.clear();
  });

  it('provides auth context', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBeDefined();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('throws error when used outside provider', () => {
    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => {
      renderHook(() => useAuth());
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });

  it('checks for existing tokens on mount', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    };

    localStorage.setItem('accessToken', 'test-access-token');
    localStorage.setItem('refreshToken', 'test-refresh-token');

    vi.mocked(apiClient.getCurrentUser).mockResolvedValue({
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  it('handles login successfully', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    };

    vi.mocked(apiClient.login).mockResolvedValue({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await result.current.login({
      email: 'test@example.com',
      password: 'password123',
    });

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);
      expect(mockPush).toHaveBeenCalledWith('/memos');
    });
  });

  it('handles login failure', async () => {
    const loginError = new Error('Invalid credentials');
    vi.mocked(apiClient.login).mockRejectedValue(loginError);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await expect(
      result.current.login({
        email: 'test@example.com',
        password: 'wrong-password',
      })
    ).rejects.toThrow();

    await waitFor(() => {
      expect(result.current.loginError).toBeTruthy();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  it('handles logout', async () => {
    const mockUser = {
      id: '123',
      email: 'test@example.com',
      name: 'Test User',
    };

    localStorage.setItem('accessToken', 'test-access-token');
    localStorage.setItem('refreshToken', 'test-refresh-token');

    vi.mocked(apiClient.getCurrentUser).mockResolvedValue({
      user: mockUser,
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
    });

    result.current.logout();

    expect(apiClient.clearTokens).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith('/login');
  });
});
