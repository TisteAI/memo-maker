'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import type { User, LoginRequest, RegisterRequest } from '@/lib/api/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  loginError: string | null;
  registerError: string | null;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [loginError, setLoginError] = React.useState<string | null>(null);
  const [registerError, setRegisterError] = React.useState<string | null>(null);

  // Check if user is authenticated on mount
  const {
    data: user,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      try {
        // Try to restore tokens from localStorage
        const accessToken = localStorage.getItem('accessToken');
        const refreshToken = localStorage.getItem('refreshToken');

        if (!accessToken || !refreshToken) {
          return null;
        }

        apiClient.setTokens(accessToken, refreshToken);
        const response = await apiClient.getCurrentUser();
        return response.user;
      } catch (error) {
        // If token is invalid, clear it
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest) => {
      setLoginError(null);
      return apiClient.login(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      router.push('/memos');
    },
    onError: (error: any) => {
      const message = error.message || 'Login failed. Please try again.';
      setLoginError(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest) => {
      setRegisterError(null);
      return apiClient.register(data);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['auth', 'me'], data.user);
      router.push('/memos');
    },
    onError: (error: any) => {
      const message = error.message || 'Registration failed. Please try again.';
      setRegisterError(message);
    },
  });

  const logout = React.useCallback(() => {
    apiClient.clearTokens();
    queryClient.setQueryData(['auth', 'me'], null);
    queryClient.clear();
    router.push('/login');
  }, [queryClient, router]);

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated: !!user,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout,
    loginError,
    registerError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
