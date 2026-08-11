import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/index.js';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  login: (emailOrUsername: string) => Promise<void>;
  signUp: (username: string, email: string) => Promise<void>;
  playAnonymously: (customName?: string) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('nexus_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMe = async (authToken: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('nexus_token');
        setToken(null);
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token) {
      fetchMe(token);
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const playAnonymously = async (customName?: string) => {
    setIsLoading(true);
    try {
      const identifier = customName?.trim() || `Guest_${Math.floor(Math.random() * 8999 + 1000)}`;
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: identifier })
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('nexus_token', data.token);
        setToken(data.token);
        setUser(data.user);
      }
    } catch (err) {
      console.error('Anonymous login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (emailOrUsername: string) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: emailOrUsername, email: emailOrUsername })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login failed');
    }
    const data = await res.json();
    localStorage.setItem('nexus_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const signUp = async (username: string, email: string) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Sign up failed');
    }
    const data = await res.json();
    localStorage.setItem('nexus_token', data.token);
    setToken(data.token);
    setUser(data.user);
  };

  const logout = () => {
    localStorage.removeItem('nexus_token');
    setToken(null);
    setUser(null);
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!token) return;
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Failed to update profile');
    }
    setUser(data.user);
  };

  const refreshProfile = async () => {
    if (token) await fetchMe(token);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        signUp,
        playAnonymously,
        logout,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
