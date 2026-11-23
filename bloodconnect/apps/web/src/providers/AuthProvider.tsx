'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '../lib/api';
import { UserRole } from '@bloodconnect/shared';

export interface UserSession {
  id: string;
  email: string;
  role: UserRole;
  fullName: string;
  organizationId?: string | null;
  organizationName?: string | null;
  donorProfileId?: string | null;
}

interface AuthContextType {
  user: UserSession | null;
  isLoading: boolean;
  login: (tokens: { accessToken: string; refreshToken: string; user: UserSession }) => void;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  login: () => {},
  logout: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      try {
        const storedUser = localStorage.getItem('bc_user');
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }

        const token = api.getAccessToken();
        if (token) {
          const profile = await api.get('/auth/me');
          setUser(profile);
          localStorage.setItem('bc_user', JSON.stringify(profile));
        }
      } catch (err) {
        api.clearTokens();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = (data: { accessToken: string; refreshToken: string; user: UserSession }) => {
    api.setTokens(data.accessToken, data.refreshToken);
    setUser(data.user);
    localStorage.setItem('bc_user', JSON.stringify(data.user));

    // Role-based redirect
    switch (data.user.role) {
      case UserRole.DONOR:
        router.push('/donor');
        break;
      case UserRole.HOSPITAL:
        router.push('/hospital');
        break;
      case UserRole.BLOOD_CENTRE:
        router.push('/centre');
        break;
      case UserRole.NGO:
        router.push('/ngo');
        break;
      case UserRole.ADMIN:
        router.push('/admin');
        break;
      default:
        router.push('/');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    api.clearTokens();
    setUser(null);
    router.push('/login');
  };

  const refreshProfile = async () => {
    try {
      const profile = await api.get('/auth/me');
      setUser(profile);
      localStorage.setItem('bc_user', JSON.stringify(profile));
    } catch {}
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
