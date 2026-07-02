'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { UserProfile, registerUser, loginUser, getUserProfile, upgradeUserProfile } from './api';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  upgradeAccount: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load session from localStorage on mount
  useEffect(() => {
    async function loadSession() {
      const storedToken = localStorage.getItem('ats_auth_token');
      if (storedToken) {
        setToken(storedToken);
        try {
          const profile = await getUserProfile();
          setUser(profile);
        } catch (err) {
          console.error('Failed to restore auth session:', err);
          // Token expired or invalid
          localStorage.removeItem('ats_auth_token');
          setToken(null);
        }
      }
      setLoading(false);
    }
    loadSession();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await loginUser(email, password);
      localStorage.setItem('ats_auth_token', res.access_token);
      setToken(res.access_token);
      
      const profile = await getUserProfile();
      setUser(profile);
    } catch (err) {
      logout();
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string) => {
    setLoading(true);
    try {
      await registerUser(email, password);
      // Automatically log in after registration
      await login(email, password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  const logout = () => {
    localStorage.removeItem('ats_auth_token');
    setToken(null);
    setUser(null);
    setLoading(false);
  };

  const upgradeAccount = async () => {
    if (!token) return;
    try {
      await upgradeUserProfile();
      await refreshProfile();
    } catch (err) {
      console.error('Failed to upgrade account:', err);
      throw err;
    }
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const profile = await getUserProfile();
      setUser(profile);
    } catch (err) {
      console.error('Failed to refresh user profile:', err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, upgradeAccount, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useEntitlements() {
  const { user } = useAuth();
  
  if (!user) {
    return {
      canGenerateAI: false,
      canExportReport: false,
      canCopySuggestions: false,
      isPremium: false,
      plan: 'none'
    };
  }

  const { entitlements, subscription_plan } = user;
  return {
    canGenerateAI: entitlements.can_generate_ai,
    canExportReport: entitlements.can_export_report,
    canCopySuggestions: entitlements.can_copy_suggestions,
    isPremium: subscription_plan === 'premium',
    plan: subscription_plan
  };
}
